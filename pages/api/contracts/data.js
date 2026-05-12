import { createClient } from '@supabase/supabase-js'
import { QUOTE_EVENTS } from '../../../lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ADMIN_API = 'https://api.ganpoom.com'

// req_id 하나에 대해 계약 데이터 조회
async function getContractData(reqId) {
  try {
    const res = await fetch(`${ADMIN_API}/web/admin/detail_matched?req_id=${reqId}`, {
      headers: { Cookie: process.env.ADMIN_COOKIE },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.res !== 0 || !data.ests || data.ests.length === 0) return null
    // 계약진행(3) 또는 시공완료(4)인 제안서 탐색
    const contracted = data.ests.find(e => e.status === 3 || e.status === 4)
    if (!contracted) return null
    return {
      status: contracted.status,
      product_cost: contracted.product_cost || 0,
    }
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { startDate, endDate, platform } = req.query

  const start = startDate
    ? new Date(startDate + 'T00:00:00+09:00')
    : (() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d })()
  const end = endDate ? new Date(endDate + 'T23:59:59.999+09:00') : new Date()

  try {
    // Supabase에서 req_id 있는 견적 이벤트 조회
    const PAGE_SIZE = 1000
    let allEvents = []
    let page = 0

    while (true) {
      let q = supabase
        .from('events')
        .select('channel, req_id')
        .in('event_category', QUOTE_EVENTS)
        .not('req_id', 'is', null)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('is_staging', false)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (platform && platform !== 'all') q = q.eq('platform', platform)

      const { data, error } = await q
      if (error) { console.error('contracts/data supabase error:', error); break }
      allEvents = allEvents.concat(data || [])
      if (!data || data.length < PAGE_SIZE) break
      page++
    }

    if (allEvents.length === 0) {
      return res.status(200).json({ success: true, byChannel: {}, total: 0 })
    }

    // req_id → channel 매핑 (중복 req_id 제거: 먼저 나온 채널 기준)
    const channelByReqId = {}
    allEvents.forEach(e => {
      if (!channelByReqId[e.req_id]) {
        channelByReqId[e.req_id] = e.channel || 'unattributed'
      }
    })

    const uniqueReqIds = Object.keys(channelByReqId).map(Number)

    // 20개씩 배치 병렬 조회 (관리자 API)
    const BATCH_SIZE = 20
    const contracted = []
    const contractedReqIds = new Set()

    for (let i = 0; i < uniqueReqIds.length; i += BATCH_SIZE) {
      const batch = uniqueReqIds.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (reqId) => {
          const contract = await getContractData(reqId)
          return contract ? { reqId, channel: channelByReqId[reqId], ...contract } : null
        })
      )
      batchResults.filter(Boolean).forEach(r => {
        contracted.push(r)
        contractedReqIds.add(r.reqId)
      })
    }

    // API에서 못 찾은 req_id → 수기 입력 테이블에서 보완
    const missingReqIds = uniqueReqIds.filter(id => !contractedReqIds.has(id))
    if (missingReqIds.length > 0) {
      const { data: manualRows } = await supabase
        .from('manual_contracts')
        .select('req_id, product_cost')
        .in('req_id', missingReqIds)
      if (manualRows) {
        manualRows.forEach(mc => {
          contracted.push({
            reqId: mc.req_id,
            channel: channelByReqId[mc.req_id],
            status: 'manual',
            product_cost: mc.product_cost || 0,
          })
        })
      }
    }

    // 채널별 집계
    const byChannel = {}
    contracted.forEach(r => {
      const ch = r.channel
      if (!byChannel[ch]) byChannel[ch] = { contracts: 0, totalAmount: 0, reqIds: [] }
      byChannel[ch].contracts++
      byChannel[ch].totalAmount += r.product_cost || 0
      byChannel[ch].reqIds.push(r.reqId)
    })

    return res.status(200).json({
      success: true,
      byChannel,
      total: contracted.length,
      scanned: uniqueReqIds.length,
    })
  } catch (err) {
    console.error('contracts/data error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
