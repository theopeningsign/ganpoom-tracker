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

    // 활성 에이전트 목록 조회 (상세 정보 포함)
    const { data: agents } = await supabaseAdmin
      .from('agents')
      .select('id, name, phone, account_number, memo, email')
      .eq('is_active', true)

    // 각 에이전트별 기간별 통계 계산 (병렬 최적화)
    const startDateTime = `${defaultStart} 00:00:00`
    const endDateTime = `${defaultEnd} 23:59:59`

    const agentStats = await Promise.all(
      (agents || []).map(async (agent) => {
        try {
          // 병렬로 클릭 수와 견적요청 조회
          const [clickResult, quoteResult] = await Promise.all([
            supabaseAdmin
              .from('link_clicks')
              .select('*', { count: 'exact' })
              .eq('agent_id', agent.id)
              .gte('clicked_at', startDateTime)
              .lte('clicked_at', endDateTime),
            supabaseAdmin
              .from('quote_requests')
              .select('commission_amount, estimated_value')
              .eq('agent_id', agent.id)
              .gte('created_at', startDateTime)
              .lte('created_at', endDateTime)
          ])

        const clickCount = clickResult.count || 0
        const quotes = quoteResult.data || []
        const quoteCount = quotes.length
        const totalCommission = quotes.reduce((sum, item) => 
          sum + (item.commission_amount || 10000), 0
        ) || 0
        const totalRevenue = quotes.reduce((sum, item) => 
          sum + (item.estimated_value || 0), 0
        ) || 0

        const conversionRate = clickCount > 0 ? 
          ((quoteCount / clickCount) * 100).toFixed(1) : '0.0'

        // 각 에이전트별 월별 견적요청 수 (최근 6개월) - 병렬로 조회
        const now = new Date()
        const monthlyQueries = []
        const monthlyDates = []
        
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
          
          monthlyDates.push({
            month: `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1).toString().padStart(2, '0')}`,
            start: monthDate.toISOString(),
            end: nextMonth.toISOString()
          })
          
          monthlyQueries.push(
            supabaseAdmin
              .from('quote_requests')
              .select('*', { count: 'exact' })
              .eq('agent_id', agent.id)
              .gte('created_at', monthDate.toISOString())
              .lt('created_at', nextMonth.toISOString())
          )
        }

          // 모든 월별 쿼리를 병렬로 실행
          const monthlyResults = await Promise.all(monthlyQueries)
          const monthlyStats = monthlyResults.map((result, index) => ({
            month: monthlyDates[index].month,
            quotes: result.count || 0
          }))

          return {
            agentId: agent.id,
            name: agent.name,
            phone: agent.phone || null,
            account_number: agent.account_number || null,
            memo: agent.memo || null,
            email: agent.email || null,
            clicks: clickCount,
            quotes: quoteCount,
            commission: totalCommission,
            revenue: totalRevenue,
            conversionRate: parseFloat(conversionRate),
            period: `${defaultStart} ~ ${defaultEnd}`,
            monthlyStats: monthlyStats
          }
        } catch (error) {
          // 개별 에이전트 조회 실패 시 기본값 반환
          console.error(`에이전트 ${agent.id} 통계 조회 오류:`, error)
          return {
            agentId: agent.id,
            name: agent.name,
            phone: agent.phone || null,
            account_number: agent.account_number || null,
            memo: agent.memo || null,
            email: agent.email || null,
            clicks: 0,
            quotes: 0,
            commission: 0,
            revenue: 0,
            conversionRate: 0,
            period: `${defaultStart} ~ ${defaultEnd}`,
            monthlyStats: []
          }
        }
      })
    )

    // 월별 전체 통계 (최근 12개월) - 병렬 최적화
    const now = new Date()
    const monthlyQueries = []
    const monthlyDates = []
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      monthlyDates.push({
        month: `${monthDate.getFullYear()}.${(monthDate.getMonth() + 1).toString().padStart(2, '0')}`,
        start: monthDate.toISOString(),
        end: nextMonth.toISOString()
      })
      
      monthlyQueries.push(
        supabaseAdmin
          .from('quote_requests')
          .select('commission_amount')
          .gte('created_at', monthDate.toISOString())
          .lt('created_at', nextMonth.toISOString())
      )
    }

    // 모든 월별 쿼리를 병렬로 실행 (에러 발생 시 기본값 사용)
    const monthlyResults = await Promise.allSettled(monthlyQueries)
    const monthlyStats = monthlyResults.map((result, index) => {
      if (result.status === 'fulfilled' && result.value.data) {
        const quotes = result.value.data.length || 0
        const commission = result.value.data.reduce((sum, item) => 
          sum + (item.commission_amount || 10000), 0
        ) || 0
        
        return {
          month: monthlyDates[index].month,
          quotes,
          commission
        }
      } else {
        // 에러 발생 시 기본값
        console.error(`월별 통계 조회 오류 (${monthlyDates[index].month}):`, result.reason)
        return {
          month: monthlyDates[index].month,
          quotes: 0,
          commission: 0
        }
      }
    })

    // 일별 통계 (최근 30일) - 병렬 최적화
    const dailyQueries = []
    const dailyDates = []
    
    for (let i = 29; i >= 0; i--) {
      const dayDate = new Date()
      dayDate.setDate(dayDate.getDate() - i)
      
      const dayStart = dayDate.toISOString().split('T')[0] + ' 00:00:00'
      const dayEnd = dayDate.toISOString().split('T')[0] + ' 23:59:59'
      
      dailyDates.push({
        date: dayDate.toISOString().split('T')[0],
        start: dayStart,
        end: dayEnd
      })
      
      // 클릭 수와 견적요청을 병렬로 조회
      dailyQueries.push(
        Promise.all([
          supabaseAdmin
            .from('link_clicks')
            .select('*', { count: 'exact' })
            .gte('clicked_at', dayStart)
            .lte('clicked_at', dayEnd),
          supabaseAdmin
            .from('quote_requests')
            .select('commission_amount')
            .gte('created_at', dayStart)
            .lte('created_at', dayEnd)
        ])
      )
    }

    // 모든 일별 쿼리를 병렬로 실행 (에러 발생 시 기본값 사용)
    const dailyResults = await Promise.allSettled(dailyQueries)
    const dailyStats = dailyResults.map((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const clicks = result.value[0]?.count || 0
        const quotes = result.value[1]?.data?.length || 0
        const commission = result.value[1]?.data?.reduce((sum, item) => 
          sum + (item.commission_amount || 10000), 0
        ) || 0

        return {
          date: dailyDates[index].date,
          clicks,
          quotes,
          commission
        }
      } else {
        // 에러 발생 시 기본값
        console.error(`일별 통계 조회 오류 (${dailyDates[index].date}):`, result.reason)
        return {
          date: dailyDates[index].date,
          clicks: 0,
          quotes: 0,
          commission: 0
        }
      }
    })

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
