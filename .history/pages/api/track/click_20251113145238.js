import { supabaseAdmin } from '../../../lib/supabase'

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
  
  // 디바이스 타입 감지
  let deviceType = 'desktop'
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    deviceType = /iPad/.test(ua) ? 'tablet' : 'mobile'
  }
  
  // 브라우저 감지
  let browser = 'Unknown'
  if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Edge')) browser = 'Edge'
  
  // OS 감지
  let os = 'Unknown'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iOS')) os = 'iOS'
  
  return { deviceType, browser, os }
}

export default async function handler(req, res) {
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

    // 필수 필드 검증
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' })
    }

    // 에이전트 존재 확인
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, is_active')
      .eq('id', agentId)
      .eq('is_active', true)
      .single()

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agent not found or inactive' })
    }

    // 클라이언트 정보 수집
    const ipAddress = getClientIP(req)
    const userAgent = req.headers['user-agent'] || ''
    const { deviceType, browser, os } = parseUserAgent(userAgent)

    // 링크 클릭 기록
    const { data: clickData, error: clickError } = await supabaseAdmin
      .from('link_clicks')
      .insert([
        {
          agent_id: agentId,
          ip_address: ipAddress,
          user_agent: userAgent,
          referrer: referrer || null,
          landing_page: landingPage || 'https://www.ganpoom.com',
          session_id: sessionId
        }
      ])
      .select()
      .single()

    if (clickError) {
      console.error('클릭 기록 오류:', clickError)
      return res.status(500).json({ error: 'Failed to record click' })
    }

    // 세션 정보 업데이트 또는 생성
    const { data: existingSession } = await supabaseAdmin
      .from('user_sessions')
      .select('id')
      .eq('id', sessionId)
      .single()

    if (!existingSession) {
      // 새 세션 생성
      await supabaseAdmin
        .from('user_sessions')
        .insert([
          {
            id: sessionId,
            agent_id: agentId,
            first_click_id: clickData.id,
            ip_address: ipAddress,
            user_agent: userAgent,
            device_type: deviceType,
            browser: browser,
            os: os,
            page_views: 1,
            started_at: new Date().toISOString()
          }
        ])
    } else {
      // 기존 세션 업데이트 (페이지뷰 증가)
      await supabaseAdmin
        .from('user_sessions')
        .update({ 
          page_views: supabaseAdmin.rpc('increment_page_views', { session_id: sessionId })
        })
        .eq('id', sessionId)
    }

    // 페이지뷰 기록
    await supabaseAdmin
      .from('page_views')
      .insert([
        {
          session_id: sessionId,
          agent_id: agentId,
          page_url: landingPage || 'https://www.ganpoom.com',
          page_title: 'Ganpoom - 홈페이지'
        }
      ])

    res.status(200).json({
      success: true,
      clickId: clickData.id,
      sessionId: sessionId
    })

  } catch (error) {
    console.error('클릭 추적 오류:', error)
    res.status(500).json({ error: 'Server error occurred' })
  }
}
