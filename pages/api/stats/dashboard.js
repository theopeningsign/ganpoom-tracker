import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 전체 통계 조회
    const [agentsResult, clicksResult, quotesResult] = await Promise.all([
      // 활성 에이전트 수
      supabaseAdmin
        .from('agents')
        .select('*', { count: 'exact' })
        .eq('is_active', true),
      
      // 전체 클릭 수 - 활성 에이전트만
      supabaseAdmin
        .from('link_clicks')
        .select('agent_id, agents!inner(is_active)', { count: 'exact' })
        .eq('agents.is_active', true),
      
      // 전체 견적요청 수 - 활성 에이전트만
      supabaseAdmin
        .from('quote_requests')
        .select('agent_id, agents!inner(is_active)', { count: 'exact' })
        .eq('agents.is_active', true)
    ])

    const totalAgents = agentsResult.count || 0
    const totalClicks = clicksResult.count || 0
    const totalQuotes = quotesResult.count || 0
    const conversionRate = totalClicks > 0 ? ((totalQuotes / totalClicks) * 100).toFixed(1) : '0.0'

    // 최근 견적요청, 상위 에이전트, 월별 통계를 병렬로 조회
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    const startISO = todayStart.toISOString()
    const endISO = todayEnd.toISOString()

    const [recentQuotesResult, topAgentsResult, monthlyQueries, todayQuotesResult] = await Promise.all([
      // 최근 견적요청 목록 (최대 10개) - 활성 에이전트만
      supabaseAdmin
        .from('quote_requests')
        .select(`
          id,
          customer_name,
          customer_phone,
          service_type,
          estimated_value,
          created_at,
          agents!inner(name, is_active)
        `)
        .eq('agents.is_active', true)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // 상위 에이전트 목록 (최대 5명)
      supabaseAdmin
        .from('agents')
        .select('id, name')
        .eq('is_active', true)
        .limit(5),
      
      // 월별 통계 쿼리 준비 (최근 6개월)
      (() => {
        const now = new Date()
        const queries = []
        const dates = []
        
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
          
          dates.push({
            month: `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1).toString().padStart(2, '0')}`
          })
          
          queries.push(
            supabaseAdmin
              .from('quote_requests')
              .select('commission_amount, agents!inner(is_active)')
              .eq('agents.is_active', true)
              .gte('created_at', monthDate.toISOString())
              .lt('created_at', nextMonth.toISOString())
          )
        }
        
        return { queries, dates }
      })(),
      supabaseAdmin
        .from('quote_requests')
        .select('agent_id, agents!inner(name, is_active)')
        .eq('agents.is_active', true)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
    ])

    // 월별 통계 결과 조회 (병렬) - 에러 발생 시 기본값 사용
    const monthlyResults = await Promise.allSettled(monthlyQueries.queries)
    const monthlyStats = monthlyResults.map((result, index) => {
      if (result.status === 'fulfilled' && result.value.data) {
        const quotes = result.value.data.length || 0
        const commission = result.value.data.reduce((sum, item) => 
          sum + (item.commission_amount || 10000), 0
        ) || 0

        return {
          month: monthlyQueries.dates[index].month,
          quotes,
          commission
        }
      } else {
        // 에러 발생 시 기본값
        console.error(`월별 통계 조회 오류 (${monthlyQueries.dates[index].month}):`, result.reason)
        return {
          month: monthlyQueries.dates[index].month,
          quotes: 0,
          commission: 0
        }
      }
    })

    // 상위 에이전트 통계 계산 (병렬)
    const agents = topAgentsResult.data || []
    const topAgents = await Promise.all(
      agents.map(async (agent) => {
        const [clickCount, quoteCount] = await Promise.all([
          supabaseAdmin
            .from('link_clicks')
            .select('*', { count: 'exact' })
            .eq('agent_id', agent.id),
          
          supabaseAdmin
            .from('quote_requests')
            .select('commission_amount')
            .eq('agent_id', agent.id)
        ])

        const clicks = clickCount.count || 0
        const quotes = quoteCount.data?.length || 0
        const commission = quoteCount.data?.reduce((sum, item) => 
          sum + (item.commission_amount || 10000), 0
        ) || 0

        return {
          ...agent,
          clicks,
          quotes,
          commission,
          conversionRate: clicks > 0 ? ((quotes / clicks) * 100).toFixed(1) : '0.0'
        }
      })
    )

    const recentQuotes = recentQuotesResult.data || []

    const todayQuotes = todayQuotesResult.data || []
    const todayQuoteMap = {}
    todayQuotes.forEach((item) => {
      const agentId = item.agent_id || 'unknown'
      if (!todayQuoteMap[agentId]) {
        todayQuoteMap[agentId] = {
          agentId,
          name: item.agents?.name || '알 수 없음',
          quotes: 0
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
        totalRevenue: monthlyStats.reduce((sum, month) => sum + month.commission, 0)
      },
      recentQuotes: recentQuotes || [],
      topAgents: topAgents.sort((a, b) => b.quotes - a.quotes),
      monthlyStats,
      todayQuotes: todayQuoteList
    })

  } catch (error) {
    console.error('대시보드 통계 API 오류:', error)
    res.status(500).json({ 
      error: 'Server error occurred',
      details: error.message 
    })
  }
}
