import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { agentId, commission_per_quote, commission_rate } = req.body

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' })
    }

    // 에이전트 존재 여부 확인
    const { data: agent, error: findError } = await supabaseAdmin
      .from('agents')
      .select('id, name')
      .eq('id', agentId)
      .single()

    if (findError || !agent) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    // 업데이트할 필드 구성
    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (commission_per_quote !== undefined) {
      updateData.commission_per_quote = commission_per_quote
    }

    if (commission_rate !== undefined) {
      updateData.commission_rate = commission_rate
    }

    // 에이전트 정보 업데이트
    const { data, error: updateError } = await supabaseAdmin
      .from('agents')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single()

    if (updateError) {
      console.error('에이전트 업데이트 오류:', updateError)
      return res.status(500).json({ error: 'Failed to update agent' })
    }

    res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      agent: data
    })

  } catch (error) {
    console.error('에이전트 업데이트 API 오류:', error)
    res.status(500).json({ error: 'Server error occurred' })
  }
}
