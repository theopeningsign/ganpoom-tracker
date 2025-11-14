import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { month } = req.query

    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required' })
    }

    // 정산 대상 월의 시작일과 종료일 계산
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = `${month}-01 00:00:00`
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0] + ' 23:59:59'

    // 활성 에이전트 목록 조회
    const { data: agents } = await supabaseAdmin
      .from('agents')
      .select('id, name, phone, account_number')
      .eq('is_active', true)

    // 각 에이전트별 해당 월 정산 데이터 계산
    const settlementData = await Promise.all(
      (agents || []).map(async (agent) => {
        // 해당 월의 견적요청 수 조회
        const { data: quotes } = await supabaseAdmin
          .from('quote_requests')
          .select('commission_amount')
          .eq('agent_id', agent.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate)

        const quoteCount = quotes?.length || 0

        // 정산 완료 여부 확인
        const { data: settledQuotes } = await supabaseAdmin
          .from('quote_requests')
          .select('id')
          .eq('agent_id', agent.id)
          .eq('settlement_month', month)
          .eq('is_settled', true)
          .gte('created_at', startDate)
          .lte('created_at', endDate)

        const settledCount = settledQuotes?.length || 0
        const isSettled = quoteCount > 0 && settledCount === quoteCount

        // 커미션 계산 (commission_amount가 null이면 기본값 10,000원 사용)
        const DEFAULT_COMMISSION = 10000
        const totalCommission = quotes?.reduce((sum, item) => 
          sum + (item.commission_amount || DEFAULT_COMMISSION), 0
        ) || 0

        // 이미 정산 완료된 금액
        const settledCommission = quotes?.filter(q => {
          return settledQuotes?.some(s => s.id === q.id)
        }).reduce((sum, item) => sum + (item.commission_amount || DEFAULT_COMMISSION), 0) || 0

        return {
          agentId: agent.id,
          name: agent.name,
          phone: agent.phone || '정보 없음',
          account: agent.account_number || '정보 없음',
          quotes: quoteCount,
          commission: totalCommission,
          settledCommission: settledCommission,
          settlementMonth: month,
          isSettled: isSettled
        }
      })
    )

    // 실적이 있는 에이전트만 필터링
    const filteredData = settlementData.filter(agent => agent.quotes > 0)

    // 통계 계산
    const totalCommission = filteredData.reduce((sum, agent) => sum + agent.commission, 0)
    const totalSettled = filteredData.filter(agent => agent.isSettled).length
    const totalPending = filteredData.filter(agent => !agent.isSettled).length

    res.status(200).json({
      success: true,
      month: month,
      settlementData: filteredData,
      stats: {
        totalAgents: filteredData.length,
        totalCommission: totalCommission,
        settledCount: totalSettled,
        pendingCount: totalPending
      }
    })

  } catch (error) {
    console.error('정산 데이터 API 오류:', error)
    res.status(500).json({ 
      error: 'Server error occurred',
      details: error.message 
    })
  }
}
