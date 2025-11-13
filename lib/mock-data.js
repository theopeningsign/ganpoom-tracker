// 로컬 테스트용 Mock 데이터
export const mockAgents = [
  // 빈 배열 - 사용자가 직접 생성한 에이전트만 표시
]

export const mockLinkClicks = [
  // 빈 배열 - 실제 클릭 데이터만 표시
]

export const mockQuoteRequests = [
  // 빈 배열 - 실제 견적요청 데이터만 표시
]

export const mockUserSessions = [
  // 빈 배열 - 실제 세션 데이터만 표시
]

// 통계 생성 함수들
export function generateMockStats() {
  return {
    totalAgents: mockAgents.length,
    totalClicks: mockLinkClicks.length,
    totalQuotes: mockQuoteRequests.length,
    conversionRate: mockLinkClicks.length > 0 ? 
      ((mockQuoteRequests.length / mockLinkClicks.length) * 100).toFixed(1) : 0,
    totalRevenue: mockQuoteRequests.reduce((sum, quote) => sum + (quote.estimated_value || 0), 0),
    totalCommission: mockQuoteRequests.reduce((sum, quote) => sum + (quote.commission_amount || 10000), 0)
  }
}

export function generateMockAgentStats() {
  return mockAgents.map(agent => {
    const agentClicks = mockLinkClicks.filter(click => click.agent_id === agent.id)
    const agentQuotes = mockQuoteRequests.filter(quote => quote.agent_id === agent.id)
    const clicks = agentClicks.length
    const quotes = agentQuotes.length
    const conversionRate = clicks > 0 ? ((quotes / clicks) * 100).toFixed(1) : 0
    const revenue = agentQuotes.reduce((sum, quote) => sum + (quote.estimated_value || 0), 0)
    const commission = agentQuotes.reduce((sum, quote) => sum + (quote.commission_amount || 10000), 0)
    
    return {
      ...agent,
      clicks,
      quotes,
      conversionRate,
      revenue,
      commission,
      trackingLink: `http://localhost:3000/test-ganpoom?ref=${agent.id}`
    }
  })
}

// ID 생성 함수
export function generateShortId() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}