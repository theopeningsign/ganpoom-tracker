import { createClient } from '@supabase/supabase-js'
import { QUOTE_EVENTS } from '../../../lib/constants'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const ADMIN_API = 'https://api.ganpoom.com'

function toYMD(d) {
  return d.toISOString().slice(0, 10)
}

async function adminGet(path) {
  try {
    const res = await fetch(`${ADMIN_API}${path}`, {
      headers: { Cookie: process.env.ADMIN_COOKIE },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    // 기간: 기본 60일 전 ~ 14일 전 (알림톡 발송 조건과 동일: 2주 경과)
    const daysBack = parseInt(req.query.daysBack || '60')
    const now = new Date()
    const startDate = new Date(now.getTime() - daysBack * 86400000)
    const endDate = new Date(now.getTime() - 14 * 86400000)

    // 1. Supabase에서 req_id 있는 견적 이벤트 조회
    const PAGE_SIZE = 1000
    let allEvents = []
    let page = 0
    while (true) {
      const { data, error } = await supabase
        .from('events')
        .select('req_id, channel, created_at')
        .in('event_category', QUOTE_EVENTS)
        .not('req_id', 'is', null)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('is_staging', false)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      if (error) { console.error('supabase error:', error); break }
      allEvents = allEvents.concat(data || [])
      if (!data || data.length < PAGE_SIZE) break
      page++
    }

    // req_id별 최초 이벤트 정보 (채널, 발생일시)
    const reqIdMap = {}
    allEvents.forEach(e => {
      if (!reqIdMap[e.req_id]) {
        reqIdMap[e.req_id] = { channel: e.channel || 'unattributed', created_at: e.created_at }
      }
    })
    const allReqIds = Object.keys(reqIdMap).map(Number)

    if (allReqIds.length === 0) {
      return res.status(200).json({ success: true, items: [], total: 0, scanned: 0 })
    }

    // 2-a. 이미 연락완료 처리된 req_id 조회 → 백엔드 API 호출 스킵
    const { data: statusRows } = await supabase
      .from('unconfirmed_status')
      .select('req_id')
    const contactedReqIds = new Set((statusRows || []).map(r => Number(r.req_id)))

    // 연락완료 req_id는 백엔드 API 호출 없이 별도 처리
    const activeReqIds = allReqIds.filter(id => !contactedReqIds.has(id))

    // 2. 수기 입력 계약 (Supabase manual_contracts) 조회 — activeReqIds만 체크
    const { data: manualRows } = await supabase
      .from('manual_contracts')
      .select('req_id')
      .in('req_id', activeReqIds.length > 0 ? activeReqIds : [0])
    const manualReqIds = new Set((manualRows || []).map(m => Number(m.req_id)))

    // 3. 백엔드 API 배치 조회 (detail_matched + advcie_joinpartners 병렬)
    const BATCH_SIZE = 10
    const contractedReqIds = new Set()
    const detailMap = {}
    const consultMap = {}

    for (let i = 0; i < activeReqIds.length; i += BATCH_SIZE) {
      const batch = activeReqIds.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(async (reqId) => {
        const [detail, consult] = await Promise.all([
          adminGet(`/web/admin/detail_matched?req_id=${reqId}`),
          adminGet(`/web/admin/advcie_joinpartners?req_id=${reqId}`),
        ])

        if (detail?.res === 0) {
          detailMap[reqId] = detail
          if (detail.ests?.some(e => e.status >= 3)) {
            contractedReqIds.add(reqId)
          }
        }
        if (consult !== null) consultMap[reqId] = consult
      }))
    }

    // 4. 미확인 필터링 (activeReqIds 중에서만)
    const unconfirmed = activeReqIds.filter(id => {
      if (contractedReqIds.has(id)) return false
      if (manualReqIds.has(id)) return false
      const consult = consultMap[id]
      const partners = Array.isArray(consult) ? consult
        : (consult?.data || consult?.list || consult?.partners || [])
      return partners.length > 0
    })

    // 최신순 정렬
    unconfirmed.sort((a, b) => new Date(reqIdMap[b].created_at) - new Date(reqIdMap[a].created_at))

    // 5. 고객 정보 ex_alldata 조회 — XLSX 파일로 반환됨
    const customerMap = {}
    try {
      const exRes = await fetch(
        `${ADMIN_API}/internal/ex_alldata?start=${toYMD(startDate)}&end=${toYMD(endDate)}`,
        { headers: { Cookie: process.env.ADMIN_COOKIE }, signal: AbortSignal.timeout(15000) }
      )
      if (exRes.ok) {
        const buffer = await exRes.arrayBuffer()
        const wb = XLSX.read(buffer, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        // range: 1 → 1행(타이틀) 스킵, 2행을 헤더로 사용
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '', range: 1 })

        // 개발 모드: 컬럼명 확인
        if (process.env.NODE_ENV === 'development' && rows.length > 0) {
          console.log('[unconfirmed] ex_alldata columns:', Object.keys(rows[0]))
          console.log('[unconfirmed] ex_alldata sample row:', rows[0])
        }

        // 개발 모드: 엑셀 원본 첫 행 응답에 포함
        if (process.env.NODE_ENV === 'development' && rows.length > 0) {
          customerMap['__debug_first_row__'] = rows[0]
          customerMap['__debug_row_count__'] = rows.length
        }

        rows.forEach(row => {
          // 모든 컬럼을 순회하며 숫자값이 있는 컬럼 중 req_id와 매칭되는 컬럼 탐색
          const allKeys = Object.keys(row)
          let rid = 0

          // 우선순위 순서로 시도
          const candidateKeys = ['견적번호', '견적 번호', 'req_id', '요청ID', '요청번호', 'id', 'ID', '번호', 'No', 'no']
          for (const k of candidateKeys) {
            if (row[k]) { rid = Number(row[k]); break }
          }

          // 그래도 못찾으면: 숫자값이 있는 첫 번째 컬럼
          if (!rid) {
            for (const k of allKeys) {
              const v = Number(row[k])
              if (v > 1000 && v < 9999999) { rid = v; break }
            }
          }

          if (rid) customerMap[rid] = row
        })
      }
    } catch (e) {
      console.error('[unconfirmed] ex_alldata parse error:', e.message)
      // 고객 정보 없이도 나머지 데이터는 정상 표시
    }

    // 6. 최종 조합
    const items = unconfirmed.map(reqId => {
      const ev = reqIdMap[reqId]
      const detail = detailMap[reqId] || {}
      const req = detail.req || {}  // 견적 상세정보는 detail.req 하위에 있음
      const consult = consultMap[reqId]
      const customer = customerMap[reqId] || {}
      const daysSince = Math.floor((now - new Date(ev.created_at)) / 86400000)

      const partners = Array.isArray(consult) ? consult
        : (consult?.data || consult?.list || consult?.partners || [])

      // 개발 모드: 필드 확인용 (처음 아이템만)
      if (process.env.NODE_ENV === 'development' && reqId === unconfirmed[0]) {
        console.log('[unconfirmed] detail keys:', Object.keys(detail))
        console.log('[unconfirmed] detail.req keys:', Object.keys(req))
        console.log('[unconfirmed] customer keys:', Object.keys(customer))
        console.log('[unconfirmed] customer sample:', customer)
        console.log('[unconfirmed] partner sample:', partners[0] ? Object.keys(partners[0]) : [])
      }

      return {
        req_id: reqId,
        created_at: ev.created_at,
        days_since: daysSince,
        channel: ev.channel,
        // 고객 정보 — detail.req에 직접 포함
        customer_name: req.name || customer['고객명'] || customer['이름'] || customer['__EMPTY_2'] || '',
        customer_phone: req.phone || customer['연락처'] || customer['__EMPTY_3'] || '',
        // 견적 정보 (detail.req 하위)
        title: req.req_title || req.title || '',
        address: req.area || req.address || '',
        company: req.req_title || '',  // 상호명 = 견적 제목과 동일
        // 참여 업체 제안서 (ests)
        contractors: (detail.ests || []).map(e => ({
          name: e.partner_name || e.name || e.company || e.corp_name || '',
          amount: e.product_cost || e.amount || e.price || 0,
          status: e.status,
        })),
        // 상담 참여 기록 (advcie_joinpartners)
        consultation: partners.map(p => ({
          name: p.partner_name || p.name || p.company || p.corp_name || '',
          is_callclick: !!(p.is_callclick || p.callclick),
          memo: p.memo || p.note || p.comment || '',
          joined_at: p.reg_date || p.created_at || p.joined_at || '',
        })),
        _raw_req_keys: process.env.NODE_ENV === 'development' ? Object.keys(req) : undefined,
        _raw_customer_keys: process.env.NODE_ENV === 'development' ? Object.keys(customer) : undefined,
      }
    })

    return res.status(200).json({
      success: true,
      items,
      total: unconfirmed.length,
      scanned: allReqIds.length,
      _debug: process.env.NODE_ENV === 'development' ? {
        customerMapSize: Object.keys(customerMap).filter(k => !k.startsWith('__')).length,
        xlsxRowCount: customerMap['__debug_row_count__'] || 0,
        xlsxFirstRow: customerMap['__debug_first_row__'] || null,
        sampleReqId: unconfirmed[0] || null,
        sampleCustomer: unconfirmed[0] ? customerMap[unconfirmed[0]] : null,
        sampleReq: unconfirmed[0] && detailMap[unconfirmed[0]] ? detailMap[unconfirmed[0]].req : null,
      } : undefined,
    })
  } catch (err) {
    console.error('unconfirmed API error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
