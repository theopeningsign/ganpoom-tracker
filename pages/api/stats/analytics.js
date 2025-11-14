import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { startDate, endDate } = req.query

    // 기본값 설정 (이번 달)
    const today = new Date()
    const defaultStart = startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const defaultEnd = endDate || today.toISOString().split('T')[0]

    // 활성 에이전트 목록 조회
    const { data: agents } = await supabaseAdmin
      .from('agents')
      .select('id, name')
      .eq('is_active', true)

    // 각 에이전트별 기간별 통계 계산
    const agentStats = await Promise.all(
      (agents || []).map(async (agent) => {
        const startDateTime = `${defaultStart} 00:00:00`
        const endDateTime = `${defaultEnd} 23:59:59`

        // 기간별 클릭 수
        const { count: clickCount } = await supabaseAdmin
          .from('link_clicks')
          .select('*', { count: 'exact' })
          .eq('agent_id', agent.id)
          .gte('clicked_at', startDateTime)
          .lte('clicked_at', endDateTime)

        // 기간별 견적요청 수
        const { data: quotes } = await supabaseAdmin
          .from('quote_requests')
          .select('commission_amount, estimated_value')
          .eq('agent_id', agent.id)
          .gte('created_at', startDateTime)
          .lte('created_at', endDateTime)

        const quoteCount = quotes?.length || 0
        const totalCommission = quotes?.reduce((sum, item) => 
          sum + (item.commission_amount || 10000), 0
        ) || 0
        const totalRevenue = quotes?.reduce((sum, item) => 
          sum + (item.estimated_value || 0), 0
        ) || 0

        const conversionRate = clickCount > 0 ? 
          ((quoteCount / clickCount) * 100).toFixed(1) : '0.0'

        return {
          agentId: agent.id,
          name: agent.name,
          clicks: clickCount || 0,
          quotes: quoteCount,
          commission: totalCommission,
          revenue: totalRevenue,
          conversionRate: parseFloat(conversionRate),
          period: `${defaultStart} ~ ${defaultEnd}`
        }
      })
    )

    // 월별 전체 통계 (최근 12개월)
    const monthlyStats = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const monthStart = monthDate.toISOString()
      const monthEnd = nextMonth.toISOString()
      
      const { data: monthlyQuotes } = await supabaseAdmin
        .from('quote_requests')
        .select('commission_amount')
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd)
      
      const quotes = monthlyQuotes?.length || 0
      const commission = monthlyQuotes?.reduce((sum, item) => 
        sum + (item.commission_amount || 10000), 0
      ) || 0

      monthlyStats.push({
        month: `${monthDate.getFullYear()}.${(monthDate.getMonth() + 1).toString().padStart(2, '0')}`,
        quotes,
        commission
      })
    }

    // 일별 통계 (최근 30일)
    const dailyStats = []
    
    for (let i = 29; i >= 0; i--) {
      const dayDate = new Date()
      dayDate.setDate(dayDate.getDate() - i)
      
      const dayStart = dayDate.toISOString().split('T')[0] + ' 00:00:00'
      const dayEnd = dayDate.toISOString().split('T')[0] + ' 23:59:59'
      
      const { data: dailyQuotes } = await supabaseAdmin
        .from('quote_requests')
        .select('commission_amount')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
      
      const quotes = dailyQuotes?.length || 0
      const commission = dailyQuotes?.reduce((sum, item) => 
        sum + (item.commission_amount || 10000), 0
      ) || 0

      dailyStats.push({
        date: dayDate.toISOString().split('T')[0],
        quotes,
        commission
      })
    }

    // 전체 통계 계산
    const totalQuotes = agentStats.reduce((sum, agent) => sum + agent.quotes, 0)
    const totalCommission = agentStats.reduce((sum, agent) => sum + agent.commission, 0)
    const totalRevenue = agentStats.reduce((sum, agent) => sum + agent.revenue, 0)

    res.status(200).json({
      success: true,
      dateRange: {
        startDate: defaultStart,
        endDate: defaultEnd
      },
      totalQuotes,
      totalCommission,
      totalRevenue,
      agentStats: agentStats.sort((a, b) => b.quotes - a.quotes),
      monthlyStats,
      dailyStats
    })

  } catch (error) {
    console.error('상세 통계 API 오류:', error)
    res.status(500).json({ 
      error: 'Server error occurred',
      details: error.message 
    })
  }
}
