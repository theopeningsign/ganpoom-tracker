// Mock 에이전트 목록 API
import { generateMockAgentStats } from '../../../../lib/mock-data'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const agents = generateMockAgentStats()
    
    res.status(200).json({
      success: true,
      agents: agents,
      total: agents.length
    })
  } catch (error) {
    console.error('Mock 에이전트 목록 오류:', error)
    res.status(500).json({ error: 'Server error occurred' })
  }
}
