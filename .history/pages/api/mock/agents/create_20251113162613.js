// Mock 에이전트 생성 API (로컬 테스트용)
import { mockAgents } from '../../../../lib/mock-data'

// 짧은 ID 생성 함수
function generateShortId() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, memo, email, phone } = req.body

    // 필수 필드 검증
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: '에이전트 이름은 필수입니다' })
    }

    // 고유 ID 생성 (Mock에서는 중복 체크 생략)
    const agentId = generateShortId()

    // Mock 에이전트 생성
    const newAgent = {
      id: agentId,
      name: name.trim(),
      memo: memo?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      commission_per_quote: 10000, // 고정 10,000원
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Mock 데이터에 추가 (메모리 + localStorage에 저장)
    mockAgents.push(newAgent)
    
    // localStorage에도 저장하여 페이지 새로고침 시에도 유지
    if (typeof window !== 'undefined') {
      const existingAgents = JSON.parse(localStorage.getItem('mockAgents') || '[]')
      existingAgents.push(newAgent)
      localStorage.setItem('mockAgents', JSON.stringify(existingAgents))
    }

    // 추적 링크 생성
    const trackingLink = `http://localhost:3000/test-ganpoom?ref=${agentId}`

    console.log('🎯 Mock 에이전트 생성:', newAgent)

    res.status(201).json({
      success: true,
      agent: newAgent,
      trackingLink: trackingLink
    })

  } catch (error) {
    console.error('Mock API 오류:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다' })
  }
}
