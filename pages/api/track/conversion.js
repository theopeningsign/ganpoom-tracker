import { supabaseAdmin } from '../../../lib/supabase'

// IP 주소 추출 함수
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         '127.0.0.1'
}

// 전화번호 정규화 (하이픈, 공백 제거)
function normalizePhone(phone) {
  if (!phone) return null
  const cleaned = phone.replace(/[^0-9]/g, '')
  // 최소 길이만 체크 (너무 짧으면 무효)
  return cleaned.length >= 8 ? cleaned : null
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
      conversionType = 'quote_request'
    } = req.body

    // 필수 필드 검증
    if (!agentId || !formData) {
      return res.status(400).json({ error: 'Agent ID and form data are required' })
    }

    // 에이전트 정보 조회 (name 포함)
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, name, is_active')
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
    const normalizedPhone = normalizePhone(formData.phone)

    // ====== 중복 체크: 실수 클릭 방지 (1분 이내) ======
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()

    // 1단계: 세션 + 전화번호 (가장 정확)
    if (sessionId && normalizedPhone) {
      const { data: exactMatch } = await supabaseAdmin
        .from('quote_requests')
        .select('id, created_at')
        .eq('agent_id', agentId)
        .eq('session_id', sessionId)
        .eq('customer_phone', normalizedPhone)
        .gte('created_at', oneMinuteAgo)
        .maybeSingle()

      if (exactMatch) {
        console.log('중복 견적요청 감지 - 세션+전화번호:', sessionId)
        return res.status(200).json({ 
          success: true,
          isDuplicate: true,
          message: 'Duplicate conversion (same session + phone)',
          quoteId: exactMatch.id
        })
      }
    }

    // 2단계: 세션만 (전화번호 없을 때)
    if (sessionId && !normalizedPhone) {
      const { data: sessionMatch } = await supabaseAdmin
        .from('quote_requests')
        .select('id, created_at')
        .eq('agent_id', agentId)
        .eq('session_id', sessionId)
        .gte('created_at', oneMinuteAgo)
        .maybeSingle()

      if (sessionMatch) {
        console.log('중복 견적요청 감지 - 세션:', sessionId)
        return res.status(200).json({ 
          success: true,
          isDuplicate: true,
          message: 'Duplicate conversion (same session)',
          quoteId: sessionMatch.id
        })
      }
    }

    // ====== 중복 체크 통과 - 견적요청 기록 ======

    // ganpoom.com 견적요청 기록
    const { data: quoteData, error: quoteError } = await supabaseAdmin
      .from('quote_requests')
      .insert([
        {
          agent_id: agentId,
          click_id: recentClick?.id || null,
          
          // ganpoom.com 실제 폼 필드들
          svc_type: formData.svc_type || null,
          req_type: formData.req_type || null,
          title: formData.title || null,
          area: formData.area || null,
          phone: formData.phone || null,
          floor: formData.floor ? parseInt(formData.floor) : null,
          setup_date: formData.setup_date || null,
          deadline: formData.deadline || null,
          texture: formData.texture || null,
          comments: formData.comments || null,
          signs: formData.signs ? (typeof formData.signs === 'string' ? JSON.parse(formData.signs) : formData.signs) : null,
          wanted_partner: formData.wanted_partner || null,
          blogo: formData.blogo ? parseInt(formData.blogo) : 0,
          destroy: formData.destroy ? parseInt(formData.destroy) : 0,
          is_direct_call: formData.is_direct_call === '1' || formData.is_direct_call === true,
          recv_req_count: formData.recv_req_count ? parseInt(formData.recv_req_count) : 1,
          safe: formData.safe ? parseInt(formData.safe) : 1,
          event_type: formData.event_type || null,
          need_skb: formData.needSKB ? parseInt(formData.needSKB) : 0,
          
          // 호환성을 위한 기존 필드들
          customer_name: formData.title || formData.name || null,
          customer_phone: normalizedPhone || formData.phone || null, // 정규화된 전화번호 저장
          service_type: formData.svc_type || formData.service || null,
          details: formData.comments || formData.details || null,
          
          // 추적 정보
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: sessionId,
          estimated_value: null, // 예상 금액 계산 안 함 (단순히 견적요청만 추적)
          commission_amount: null, // 커미션은 정산 시 수동으로 처리
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (quoteError) {
      console.error('견적요청 기록 오류:', quoteError)
      return res.status(500).json({ error: 'Failed to record conversion' })
    }

    // 세션 전환 상태 업데이트 (실패해도 계속 진행)
    if (sessionId) {
      const { error: sessionError } = await supabaseAdmin
        .from('user_sessions')
        .update({ 
          converted: true,
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
      
      if (sessionError) {
        console.warn('⚠️ 세션 업데이트 실패 (무시):', sessionError)
      }
    }

    // 실시간 알림 발송 (실패해도 계속 진행)
    try {
      await supabaseAdmin
        .channel('quote_requests')
        .send({
          type: 'broadcast',
          event: 'new_quote',
          payload: {
            agentId: agentId,
            agentName: agent.name,
            customerName: formData.name || formData.title,
            serviceType: formData.service || formData.svc_type,
            timestamp: new Date().toISOString()
          }
        })
    } catch (notifyError) {
      console.warn('⚠️ 실시간 알림 실패 (무시):', notifyError)
    }

    res.status(200).json({
      success: true,
      quoteId: quoteData.id,
      isDuplicate: false
    })

  } catch (error) {
    console.error('전환 추적 오류:', error)
    res.status(500).json({ error: 'Server error occurred' })
  }
}
