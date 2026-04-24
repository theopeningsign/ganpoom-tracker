import { supabaseAdmin } from '../../../lib/supabase'

const QUOTE_EVENTS = [
  'comparison.request',
  'airbridge.ecommerce.order.completed',
  'simple.request',
]

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 오늘 날짜 범위
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // 최근 6개월 시작
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    // 전체 통계 + 이벤트 데이터 병렬 조회
    const [
      agentsResult,
      clicksResult,
      totalQuotesResult,
      recentEventsResult,
      allQuoteEventsResult,
      todayEventsResult,
    ] = await Promise.all([
      // 활성 에이전트 수
      supabaseAdmin
        .from('agents')
        .select('id, name', { count: 'exact' })
        .eq('is_active', true),

      // 전체 클릭 수 (link_clicks)
      supabaseAdmin
        .from('link_clicks')
        .select('agent_id, agents!inner(is_active)', { count: 'exact' })
        .eq('agents.is_active', true),

      // 전체 견적요청 수 (events 테이블, 에이전트 유입 기준)
      supabaseAdmin
        .from('events')
        .select('*', { count: 'exact', head: true })
        .in('event_category', QUOTE_EVENTS)
        .not('agent_id', 'is', null),

      // 최근 견적요청 10개 (events 테이블)
      supabaseAdmin
        .from('events')
        .select('id, agent_id, event_category, channel, landing_page, created_at, device_type, os_name')
        .in('event_category', QUOTE_EVENTS)
        .not('agent_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10),

      // 최근 6개월 견적 이벤트 전체 (월별 통계 + 상위 에이전트용)
      supabaseAdmin
        .from('events')
        .select('agent_id, event_category, created_at')
        .in('event_category', QUOTE_EVENTS)
        .not('agent_id', 'is', null)
        .gte('created_at', sixMonthsAgo.toISOString()),

      // 오늘 견적 이벤트
      supabaseAdmin
        .from('events')
        .select('agent_id, event_category, created_at')
        .in('event_category', QUOTE_EVENTS)
        .not('agent_id', 'is', null)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString()),
    ])

    const totalAgents = agentsResult.count || 0
    const totalClicks = clicksResult.count || 0
    const totalQuotes = totalQuotesResult.count || 0
    const conversionRate = totalClicks > 0 ? ((totalQuotes / totalClicks) * 100).toFixed(1) : '0.0'

    const allQuoteEvents = allQuoteEventsResult.data || []

    // 월별 통계 계산 (JavaScript에서 집계)
    const now = new Date()
    const monthlyStats = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthKey = `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1).toString().padStart(2, '0')}`

      const monthEvents = allQuoteEvents.filter(e => {
        const d = new Date(e.created_at)
        return d >= monthDate && d < nextMonth
      })

      monthlyStats.push({
        month: monthKey,
        quotes: monthEvents.length,
        commission: monthEvents.length * 10000, // 건당 기본 커미션 (추후 실제값으로 대체)
      })
    }

    // 상위 에이전트 계산 (JavaScript에서 agent_id별 집계)
    const agentQuoteMap = {}
    allQuoteEvents.forEach(e => {
      if (!e.agent_id) return
      agentQuoteMap[e.agent_id] = (agentQuoteMap[e.agent_id] || 0) + 1
    })

    // 상위 5명 agent_id 추출
    const topAgentIds = Object.entries(agentQuoteMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    // 상위 에이전트 이름 조회 + 클릭수
    const topAgents = await Promise.all(
      topAgentIds.map(async (agentId) => {
        const [agentResult, clickResult] = await Promise.all([
          supabaseAdmin.from('agents').select('id, name').eq('id', agentId).single(),
          supabaseAdmin.from('link_clicks').select('*', { count: 'exact', head: true }).eq('agent_id', agentId),
        ])
        const quotes = agentQuoteMap[agentId] || 0
        const clicks = clickResult.count || 0
        return {
          id: agentId,
          name: agentResult.data?.name || agentId,
          quotes,
          clicks,
          commission: quotes * 10000,
          conversionRate: clicks > 0 ? ((quotes / clicks) * 100).toFixed(1) : '0.0',
        }
      })
    )

    // 최근 견적 이벤트에 에이전트 이름 추가
    const recentEvents = recentEventsResult.data || []
    const agentIds = [...new Set(recentEvents.map(e => e.agent_id).filter(Boolean))]
    let agentNameMap = {}
    if (agentIds.length > 0) {
      const { data: agentNames } = await supabaseAdmin
        .from('agents')
        .select('id, name')
        .in('id', agentIds)
      agentNameMap = Object.fromEntries((agentNames || []).map(a => [a.id, a.name]))
    }

    const recentQuotes = recentEvents.map(e => ({
      id: e.id,
      agent_id: e.agent_id,
      agentName: agentNameMap[e.agent_id] || e.agent_id,
      event_category: e.event_category,
      channel: e.channel,
      device_type: e.device_type,
      os_name: e.os_name,
      created_at: e.created_at,
    }))

    // 오늘 에이전트별 견적 집계
    const todayEvents = todayEventsResult.data || []
    const todayQuoteMap = {}
    todayEvents.forEach(e => {
      const agentId = e.agent_id || 'unknown'
      if (!todayQuoteMap[agentId]) {
        todayQuoteMap[agentId] = {
          agentId,
          name: agentNameMap[agentId] || agentId,
          quotes: 0,
        }
      }
      todayQuoteMap[agentId].quotes += 1
    })
    const todayQuoteList = Object.values(todayQuoteMap).sort((a, b) => b.quotes - a.quotes)

    res.status(200).json({
      success: true,
      stats: {
        totalAgents,
        totalClicks,
        totalQuotes,
        conversionRate: parseFloat(conversionRate),
        totalRevenue: monthlyStats.reduce((sum, month) => sum + month.commission, 0),
      },
      recentQuotes,
      topAgents: topAgents.sort((a, b) => b.quotes - a.quotes),
      monthlyStats,
      todayQuotes: todayQuoteList,
    })

  } catch (error) {
    console.error('대시보드 통계 API 오류:', error)
    res.status(500).json({
      error: 'Server error occurred',
      details: error.message,
    })
  }
}
