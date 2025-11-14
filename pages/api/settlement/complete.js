import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { agentId, month, isBulk = false } = req.body

    if (!agentId || !month) {
      return res.status(400).json({ error: 'Agent ID and month are required' })
    }

    // 정산 대상 월의 시작일과 종료일 계산
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = `${month}-01 00:00:00`
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0] + ' 23:59:59'

    if (isBulk) {
      // 일괄 정산: 해당 월의 모든 미정산 견적요청을 정산 처리
      const { data, error } = await supabaseAdmin
        .from('quote_requests')
        .update({
          is_settled: true,
          settlement_month: month,
          updated_at: new Date().toISOString()
        })
        .eq('agent_id', agentId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('is_settled', false)
        .select()

      if (error) {
        console.error('일괄 정산 오류:', error)
        return res.status(500).json({ error: 'Failed to complete bulk settlement' })
      }

      res.status(200).json({
        success: true,
        message: `${data.length}건의 견적요청이 정산 처리되었습니다.`,
        settledCount: data.length
      })

    } else {
      // 개별 정산: 특정 에이전트의 해당 월 모든 견적요청 정산 처리
      const { data, error } = await supabaseAdmin
        .from('quote_requests')
        .update({
          is_settled: true,
          settlement_month: month,
          updated_at: new Date().toISOString()
        })
        .eq('agent_id', agentId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('is_settled', false)
        .select()

      if (error) {
        console.error('정산 오류:', error)
        return res.status(500).json({ error: 'Failed to complete settlement' })
      }

      res.status(200).json({
        success: true,
        message: '정산이 완료되었습니다.',
        settledCount: data.length
      })
    }

  } catch (error) {
    console.error('정산 API 오류:', error)
    res.status(500).json({ 
      error: 'Server error occurred',
      details: error.message 
    })
  }
}
