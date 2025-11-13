import { supabaseAdmin } from '../../../lib/supabase'

// IP 주소 추출 함수
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         '127.0.0.1'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      agentId,
      sessionId,
      formData,
      estimatedValue,
      conversionType = 'quote_request'
    } = req.body

    // 필수 필드 검증
    if (!agentId || !formData) {
      return res.status(400).json({ error: 'Agent ID and form data are required' })
    }

    // 에이전트 정보 조회
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, commission_rate, is_active')
      .eq('id', agentId)
      .eq('is_active', true)
      .single()

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agent not found or inactive' })
    }

    // 최근 클릭 정보 조회 (같은 세션에서)
    const { data: recentClick } = await supabaseAdmin
      .from('link_clicks')
      .select('id')
      .eq('agent_id', agentId)
      .eq('session_id', sessionId)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .single()

    // 클라이언트 정보 수집
    const ipAddress = getClientIP(req)
    const userAgent = req.headers['user-agent'] || ''

    // 예상 계약 금액 및 커미션 계산
    const contractValue = estimatedValue || 0
    const commissionAmount = contractValue * (agent.commission_rate / 100)

    // 견적요청 기록
    const { data: quoteData, error: quoteError } = await supabaseAdmin
      .from('quote_requests')
      .insert([
        {
          agent_id: agentId,
          click_id: recentClick?.id || null,
          customer_name: formData.name || null,
          customer_phone: formData.phone || null,
          customer_email: formData.email || null,
          service_type: formData.service || null,
          budget_range: formData.budget || null,
          details: formData.details || null,
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: sessionId,
          estimated_value: contractValue,
          commission_amount: commissionAmount,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (quoteError) {
      console.error('견적요청 기록 오류:', quoteError)
      return res.status(500).json({ error: 'Failed to record conversion' })
    }

    // 세션 전환 상태 업데이트
    if (sessionId) {
      await supabaseAdmin
        .from('user_sessions')
        .update({ 
          converted: true,
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    }

    // 실시간 알림 발송 (Supabase Realtime 사용)
    await supabaseAdmin
      .channel('quote_requests')
      .send({
        type: 'broadcast',
        event: 'new_quote',
        payload: {
          agentId: agentId,
          agentName: agent.name,
          customerName: formData.name,
          serviceType: formData.service,
          timestamp: new Date().toISOString()
        }
      })

    res.status(200).json({
      success: true,
      quoteId: quoteData.id,
      commissionAmount: commissionAmount
    })

  } catch (error) {
    console.error('전환 추적 오류:', error)
    res.status(500).json({ error: 'Server error occurred' })
  }
}
