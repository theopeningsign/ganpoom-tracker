import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { agentId, month, commissionAmount } = req.body

    if (!agentId || !month || !commissionAmount) {
      return res.status(400).json({ error: 'Agent ID, month, and commission amount are required' })
    }

    // 정산 대상 월의 시작일과 종료일 계산
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = `${month}-01 00:00:00`
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0] + ' 23:59:59'

    // 해당 에이전트의 해당 월 모든 미정산 견적요청의 commission_amount 업데이트
    const { data, error } = await supabaseAdmin
      .from('quote_requests')
      .update({
        commission_amount: commissionAmount,
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agentId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('is_settled', false)
      .select()

    if (error) {
      console.error('커미션 업데이트 오류:', error)
      return res.status(500).json({ error: 'Failed to update commission' })
    }

    res.status(200).json({
      success: true,
      message: `${data.length}건의 견적요청 커미션이 업데이트되었습니다.`,
      updatedCount: data.length
    })

  } catch (error) {
    console.error('커미션 업데이트 API 오류:', error)
    res.status(500).json({ 
      error: 'Server error occurred',
      details: error.message 
    })
  }
}

