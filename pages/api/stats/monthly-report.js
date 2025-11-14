import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { year, endMonth } = req.query

    if (!year || !endMonth) {
      return res.status(400).json({ error: 'Year and endMonth parameters are required' })
    }

    const yearNum = parseInt(year)
    const endMonthNum = parseInt(endMonth)

    // 1월부터 endMonth까지 월별 통계 조회
    const monthlyReports = []

    for (let month = 1; month <= endMonthNum; month++) {
      const monthStr = `${yearNum}-${month.toString().padStart(2, '0')}`
      const monthDate = new Date(yearNum, month - 1, 1)
      const nextMonth = new Date(yearNum, month, 1)

      // 해당 월의 클릭 수와 견적요청 수를 병렬로 조회
      const [clickResult, quoteResult] = await Promise.all([
        supabaseAdmin
          .from('link_clicks')
          .select('*', { count: 'exact' })
          .gte('clicked_at', monthDate.toISOString())
          .lt('clicked_at', nextMonth.toISOString()),
        supabaseAdmin
          .from('quote_requests')
          .select('commission_amount, agent_id')
          .gte('created_at', monthDate.toISOString())
          .lt('created_at', nextMonth.toISOString())
      ])

      const totalClicks = clickResult.count || 0
      const quotes = quoteResult.data || []
      const totalQuotes = quotes.length
      
      // 커미션 계산 (commission_amount가 null이면 기본값 10,000원 사용)
      const DEFAULT_COMMISSION = 10000
      const totalCommission = quotes.reduce((sum, item) => 
        sum + (item.commission_amount || DEFAULT_COMMISSION), 0
      ) || 0

      // 활성 에이전트 수 (견적요청이 있는 에이전트 수)
      const activeAgentIds = new Set(quotes.map(q => q.agent_id).filter(Boolean))
      const activeAgents = activeAgentIds.size

      // 전환율 계산
      const conversionRate = totalClicks > 0 ? 
        ((totalQuotes / totalClicks) * 100).toFixed(1) : '0.0'

      monthlyReports.push({
        month: monthStr,
        monthName: `${month}월`,
        year: yearNum,
        totalClicks,
        totalQuotes,
        totalCommission,
        activeAgents,
        conversionRate: parseFloat(conversionRate)
      })
    }

    res.status(200).json({
      success: true,
      year: yearNum,
      reports: monthlyReports
    })

  } catch (error) {
    console.error('월별 실적표 API 오류:', error)
    res.status(500).json({ 
      error: 'Server error occurred',
      details: error.message 
    })
  }
}

