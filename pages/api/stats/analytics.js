import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { startDate, endDate } = req.query

    // 기본값 설정 (이번 달) - 로컬 시간대 기준
    const today = new Date()
    let defaultStart, defaultEnd
    
    if (startDate) {
      defaultStart = startDate
    } else {
      // 이번 달 1일 (로컬 시간 기준)
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      defaultStart = `${firstDay.getFullYear()}-${(firstDay.getMonth() + 1).toString().padStart(2, '0')}-${firstDay.getDate().toString().padStart(2, '0')}`
    }
    
    if (endDate) {
      defaultEnd = endDate
    } else {
      // 오늘 (로컬 시간 기준)
      defaultEnd = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
    }

    // 활성 에이전트 목록 조회 (상세 정보 포함)
    const { data: agents } = await supabaseAdmin
      .from('agents')
      .select('id, name, phone, account_number, memo, email')
      .eq('is_active', true)

    // 각 에이전트별 기간별 통계 계산 (병렬 최적화)
    // 날짜 문자열을 ISO 8601 형식으로 변환 (한국 시간대 KST = UTC+9)
    // 시작일: 00:00:00 KST → UTC로 변환
    const startDateObj = new Date(`${defaultStart}T00:00:00+09:00`)
    // 종료일: 23:59:59.999 KST → UTC로 변환
    const endDateObj = new Date(`${defaultEnd}T23:59:59.999+09:00`)
    
    // ISO 8601 형식으로 변환 (Supabase TIMESTAMP WITH TIME ZONE과 정확히 비교)
    const startDateTime = startDateObj.toISOString()
    const endDateTime = endDateObj.toISOString()
    
    // 디버깅용 로그 (배포 후 제거 가능)
    // console.log('기간 필터:', { defaultStart, defaultEnd, startDateTime, endDateTime })

    const agentStats = await Promise.all(
      (agents || []).map(async (agent) => {
        try {
          // 병렬로 클릭 수와 견적요청 조회
          // 기간 필터: startDateTime <= clicked_at/created_at <= endDateTime
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

          // 에이전트별 월별 통계는 모달에서만 로드 (성능 최적화)
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
            period: `${defaultStart} ~ ${defaultEnd}`
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
            period: `${defaultStart} ~ ${defaultEnd}`
          }
        }
      })
    )

    // 전체 통계 계산
    const totalQuotes = agentStats.reduce((sum, agent) => sum + agent.quotes, 0)
    const totalCommission = agentStats.reduce((sum, agent) => sum + agent.commission, 0)
    const totalRevenue = agentStats.reduce((sum, agent) => sum + agent.revenue, 0)

    // 월별/일별 통계는 별도 API로 분리 (성능 최적화)
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
      monthlyStats: [], // 별도 API로 로드
      dailyStats: [] // 별도 API로 로드
    })

  } catch (error) {
    console.error('상세 통계 API 오류:', error)
    res.status(500).json({ 
      error: 'Server error occurred',
      details: error.message 
    })
  }
}
