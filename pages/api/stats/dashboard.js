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
      
      // 전체 클릭 수
      supabaseAdmin
        .from('link_clicks')
        .select('*', { count: 'exact' }),
      
      // 전체 견적요청 수
      supabaseAdmin
        .from('quote_requests')
        .select('*', { count: 'exact' })
    ])

    const totalAgents = agentsResult.count || 0
    const totalClicks = clicksResult.count || 0
    const totalQuotes = quotesResult.count || 0
    const conversionRate = totalClicks > 0 ? ((totalQuotes / totalClicks) * 100).toFixed(1) : '0.0'

    // 최근 견적요청 목록 (최대 10개)
    const { data: recentQuotes } = await supabaseAdmin
      .from('quote_requests')
      .select(`
        id,
        customer_name,
        customer_phone,
        service_type,
        estimated_value,
        created_at,
        agents!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // 상위 에이전트 통계 (최대 5명)
    const { data: agents } = await supabaseAdmin
      .from('agents')
      .select('id, name')
      .eq('is_active', true)

    const topAgents = await Promise.all(
      (agents || []).slice(0, 5).map(async (agent) => {
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

    // 월별 통계 (최근 6개월)
    const monthlyStats = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
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
        month: `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1).toString().padStart(2, '0')}`,
        quotes,
        commission
      })
    }

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
      monthlyStats
    })

  } catch (error) {
    console.error('대시보드 통계 API 오류:', error)
    res.status(500).json({ 
      error: 'Server error occurred',
      details: error.message 
    })
  }
}
