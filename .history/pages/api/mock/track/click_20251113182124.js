// Mock 클릭 추적 API (로컬 테스트용)
import { mockLinkClicks, mockUserSessions, mockAgents } from '../../../../lib/mock-data'

// IP 주소 추출 함수
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         '127.0.0.1'
}

// User Agent 파싱 함수
function parseUserAgent(userAgent) {
  const ua = userAgent || ''
  
  let deviceType = 'desktop'
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    deviceType = /iPad/.test(ua) ? 'tablet' : 'mobile'
  }
  
  let browser = 'Unknown'
  if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Edge')) browser = 'Edge'
  
  let os = 'Unknown'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iOS')) os = 'iOS'
  
  return { deviceType, browser, os }
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      agentId, 
      sessionId, 
      referrer, 
      landingPage 
    } = req.body

    console.log('🔗 Mock 클릭 추적 요청:', { agentId, sessionId, referrer, landingPage })

    // 필수 필드 검증
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' })
    }

    // 에이전트 존재 확인
    const agent = mockAgents.find(a => a.id === agentId && a.is_active)
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found or inactive' })
    }

    // 클라이언트 정보 수집
    const ipAddress = getClientIP(req)
    const userAgent = req.headers['user-agent'] || ''
    const { deviceType, browser, os } = parseUserAgent(userAgent)

    // Mock 링크 클릭 기록
    const clickData = {
      id: mockLinkClicks.length + 1,
      agent_id: agentId,
      ip_address: ipAddress,
      user_agent: userAgent,
      referrer: referrer || null,
      landing_page: landingPage || 'https://www.ganpoom.com',
      session_id: sessionId,
      clicked_at: new Date().toISOString()
    }

    mockLinkClicks.push(clickData)

    // Mock 세션 정보 확인/생성
    let existingSession = mockUserSessions.find(s => s.id === sessionId)
    
    if (!existingSession) {
      // 새 세션 생성
      const newSession = {
        id: sessionId,
        agent_id: agentId,
        first_click_id: clickData.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        browser: browser,
        os: os,
        page_views: 1,
        session_duration: null,
        bounce: false,
        converted: false,
        started_at: new Date().toISOString(),
        ended_at: null
      }
      mockUserSessions.push(newSession)
    } else {
      // 기존 세션 업데이트
      existingSession.page_views += 1
    }

    console.log('✅ Mock 클릭 추적 완료:', clickData)

    res.status(200).json({
      success: true,
      clickId: clickData.id,
      sessionId: sessionId,
      message: 'Mock 클릭 추적 완료'
    })

  } catch (error) {
    console.error('Mock 클릭 추적 오류:', error)
    res.status(500).json({ error: 'Server error occurred' })
  }
}
