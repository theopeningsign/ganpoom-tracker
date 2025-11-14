import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { agentId } = req.query

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' })
    }

    // 에이전트 존재 확인
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, name')
      .eq('id', agentId)
      .eq('is_active', true)
      .single()

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agent not found or inactive' })
    }

    // 각 에이전트별 월별 견적요청 수 (최근 6개월) - 병렬 최적화
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
          .eq('agent_id', agentId)
          .gte('created_at', monthDate.toISOString())
          .lt('created_at', nextMonth.toISOString())
      )
    }

    // 모든 월별 쿼리를 병렬로 실행
    const monthlyResults = await Promise.allSettled(monthlyQueries)
    const monthlyStats = monthlyResults.map((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        return {
          month: monthlyDates[index].month,
          quotes: result.value.count || 0
        }
      } else {
        console.error(`월별 통계 조회 오류 (${monthlyDates[index].month}):`, result.reason)
        return {
          month: monthlyDates[index].month,
          quotes: 0
        }
      }
    })

    res.status(200).json({
      success: true,
      agentId: agentId,
      monthlyStats: monthlyStats
    })

  } catch (error) {
    console.error('에이전트 월별 통계 API 오류:', error)
    res.status(500).json({ 
      error: 'Server error occurred',
      details: error.message 
    })
  }
}

