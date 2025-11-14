import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { agentId, name, phone, email, account, account_number, memo } = req.body

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' })
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '에이전트 이름은 필수입니다' })
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: '전화번호는 필수입니다' })
    }

    if (!account && !account_number) {
      return res.status(400).json({ error: '계좌번호는 필수입니다' })
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

    const trimmedEmail = email && email.trim() ? email.trim() : null
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: '올바른 이메일 형식을 입력해주세요' })
      }
    }

    // 업데이트할 필드 구성
    const updateData = {
      name: name.trim(),
      phone: phone.trim(),
      email: trimmedEmail,
      account_number: (account || account_number)?.trim() || null,
      memo: memo && memo.trim() ? memo.trim() : null,
      updated_at: new Date().toISOString()
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
