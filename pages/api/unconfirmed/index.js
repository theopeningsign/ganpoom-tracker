import { createClient } from '@supabase/supabase-js'
import { QUOTE_EVENTS } from '../../../lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const ADMIN_API = 'https://api.ganpoom.com'

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
    const daysBack = parseInt(req.query.daysBack || '60')
    const now = new Date()
    const startDate = new Date(now.getTime() - daysBack * 86400000)
    const endDate = new Date(now.getTime() - 14 * 86400000)

    // ── 1. Supabase 이벤트에서 req_id 조회 ──────────────────────────────
    // QUOTE_EVENTS 전체 포함 (airbridge.ecommerce.order.completed = 스타일시공 포함)
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

    // ── 2. 전체 req_id 목록 ───────────────────────────────────────────────
    const allReqIds = Object.keys(reqIdMap).map(Number)

    if (allReqIds.length === 0) {
      return res.status(200).json({ success: true, items: [], total: 0, scanned: 0 })
    }

    // ── 3. 연락완료 req_id 조회 → 백엔드 API 호출 스킵 ──────────────────
    const { data: statusRows } = await supabase
      .from('unconfirmed_status')
      .select('req_id')
    const contactedReqIds = new Set((statusRows || []).map(r => Number(r.req_id)))
    const activeReqIds = allReqIds.filter(id => !contactedReqIds.has(id))

    // ── 4. 수기 입력 계약 조회 ────────────────────────────────────────────
    const { data: manualRows } = await supabase
      .from('manual_contracts')
      .select('req_id')
      .in('req_id', activeReqIds.length > 0 ? activeReqIds : [0])
    const manualReqIds = new Set((manualRows || []).map(m => Number(m.req_id)))

    // ── 5. 백엔드 API 배치 조회 ───────────────────────────────────────────
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

    // ── 6. 미확인 필터링 ─────────────────────────────────────────────────
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

    // ── 7. 최종 조합 ─────────────────────────────────────────────────────
    const items = unconfirmed.map(reqId => {
      const ev = reqIdMap[reqId]
      const detail = detailMap[reqId] || {}
      const req = detail.req || {}
      const consult = consultMap[reqId]
      const daysSince = Math.floor((now - new Date(ev.created_at)) / 86400000)

      const partners = Array.isArray(consult) ? consult
        : (consult?.data || consult?.list || consult?.partners || [])

      return {
        req_id: reqId,
        created_at: ev.created_at,
        days_since: daysSince,
        channel: ev.channel,
        customer_name: req.name || '',
        customer_phone: req.phone || '',
        title: req.req_title || req.title || '',
        address: req.area || req.address || '',
        company: req.req_title || '',
        contractors: (detail.ests || []).map(e => ({
          name: e.partner_name || e.name || e.company || e.corp_name || '',
          amount: e.product_cost || e.amount || e.price || 0,
          status: e.status,
        })),
        consultation: partners.map(p => ({
          name: p.partner_name || p.name || p.company || p.corp_name || '',
          is_callclick: !!(p.is_callclick || p.callclick),
          memo: p.memo || p.note || p.comment || '',
          joined_at: p.reg_date || p.created_at || p.joined_at || '',
        })),
      }
    })

    return res.status(200).json({
      success: true,
      items,
      total: unconfirmed.length,
      scanned: allReqIds.length,
    })
  } catch (err) {
    console.error('unconfirmed API error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
