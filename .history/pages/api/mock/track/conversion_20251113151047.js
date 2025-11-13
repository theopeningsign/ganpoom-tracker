// Mock 전환 추적 API (로컬 테스트용)
import { mockQuoteRequests, mockUserSessions, mockAgents, mockLinkClicks } from '../../../../lib/mock-data'

// IP 주소 추출 함수
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         '127.0.0.1'
}

export default function handler(req, res) {
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

    console.log('💌 Mock 전환 추적 요청:', { agentId, sessionId, formData, estimatedValue })

    // 필수 필드 검증
    if (!agentId || !formData) {
      return res.status(400).json({ error: 'Agent ID and form data are required' })
    }

    // 에이전트 정보 조회
    const agent = mockAgents.find(a => a.id === agentId && a.is_active)
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found or inactive' })
    }

    // 최근 클릭 정보 조회
    const recentClick = mockLinkClicks
      .filter(click => click.agent_id === agentId && click.session_id === sessionId)
      .sort((a, b) => new Date(b.clicked_at) - new Date(a.clicked_at))[0]

    // 클라이언트 정보 수집
    const ipAddress = getClientIP(req)
    const userAgent = req.headers['user-agent'] || ''

    // 예상 계약 금액 및 커미션 계산
    const contractValue = estimatedValue || 0
    const commissionAmount = contractValue * (agent.commission_rate / 100)

    // Mock 견적요청 기록
    const quoteData = {
      id: mockQuoteRequests.length + 1,
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
      customer_phone: formData.phone || null,
      service_type: formData.svc_type || formData.service || null,
      details: formData.comments || formData.details || null,
      
      // 추적 정보
      ip_address: ipAddress,
      user_agent: userAgent,
      session_id: sessionId,
      estimated_value: contractValue,
      commission_amount: commissionAmount,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockQuoteRequests.push(quoteData)

    // 세션 전환 상태 업데이트
    const session = mockUserSessions.find(s => s.id === sessionId)
    if (session) {
      session.converted = true
      session.ended_at = new Date().toISOString()
    }

    console.log('✅ Mock 전환 추적 완료:', quoteData)

    res.status(200).json({
      success: true,
      quoteId: quoteData.id,
      commissionAmount: commissionAmount,
      message: 'Mock 전환 추적 완료'
    })

  } catch (error) {
    console.error('Mock 전환 추적 오류:', error)
    res.status(500).json({ error: 'Server error occurred' })
  }
}
