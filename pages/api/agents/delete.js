import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { agentId } = req.body

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

    // 소프트 삭제 (is_active를 false로 변경)
    const { data, error: deleteError } = await supabaseAdmin
      .from('agents')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)
      .select()
      .single()

    if (deleteError) {
      console.error('에이전트 삭제 오류:', deleteError)
      return res.status(500).json({ error: 'Failed to delete agent' })
    }

    res.status(200).json({
      success: true,
      message: `Agent ${agent.name} has been deleted successfully`,
      agent: data
    })

  } catch (error) {
    console.error('에이전트 삭제 API 오류:', error)
    res.status(500).json({ error: 'Server error occurred' })
  }
}
