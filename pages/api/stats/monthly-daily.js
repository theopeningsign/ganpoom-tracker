import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
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
      
      // 월별 클릭 수와 견적요청 수를 병렬로 조회 - 활성 에이전트만
      monthlyQueries.push(
        Promise.all([
          supabaseAdmin
            .from('link_clicks')
            .select('agent_id, agents!inner(is_active)', { count: 'exact' })
            .eq('agents.is_active', true)
            .gte('clicked_at', monthDate.toISOString())
            .lt('clicked_at', nextMonth.toISOString()),
          supabaseAdmin
            .from('quote_requests')
            .select('agent_id, agents!inner(is_active)', { count: 'exact' })
            .eq('agents.is_active', true)
            .gte('created_at', monthDate.toISOString())
            .lt('created_at', nextMonth.toISOString())
        ])
      )
    }

    // 모든 월별 쿼리를 병렬로 실행 (에러 발생 시 기본값 사용)
    const monthlyResults = await Promise.allSettled(monthlyQueries)
    const monthlyStats = monthlyResults.map((result, index) => {
      if (result.status === 'fulfilled' && result.value && result.value[0] && result.value[1]) {
        const clicks = result.value[0].count || 0
        const quotes = result.value[1].count || 0
        
        return {
          month: monthlyDates[index].month,
          clicks,
          quotes
        }
      } else {
        // 에러 발생 시 기본값
        console.error(`월별 통계 조회 오류 (${monthlyDates[index].month}):`, result.reason)
        return {
          month: monthlyDates[index].month,
          clicks: 0,
          quotes: 0
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
      
      // 클릭 수와 견적요청을 병렬로 조회 - 활성 에이전트만
      dailyQueries.push(
        Promise.all([
          supabaseAdmin
            .from('link_clicks')
            .select('agent_id, agents!inner(is_active)', { count: 'exact' })
            .eq('agents.is_active', true)
            .gte('clicked_at', dayStart)
            .lte('clicked_at', dayEnd),
          supabaseAdmin
            .from('quote_requests')
            .select('commission_amount, agents!inner(is_active)')
            .eq('agents.is_active', true)
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

    res.status(200).json({
      success: true,
      monthlyStats,
      dailyStats
    })

  } catch (error) {
    console.error('월별/일별 통계 API 오류:', error)
    res.status(500).json({ 
      error: 'Server error occurred',
      details: error.message 
    })
  }
}

