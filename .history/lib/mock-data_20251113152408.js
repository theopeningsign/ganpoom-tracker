// 로컬 테스트용 Mock 데이터
export const mockAgents = [
  {
    id: 'Ab3kM9',
    name: '김철수',
    memo: '네이버 블로그',
    email: 'kimcs@example.com',
    phone: '010-1234-5678',
    commission_per_quote: 10000,
    is_active: true,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: 'Xy7nP2',
    name: '이영희',
    memo: '인스타그램',
    email: 'leeyh@example.com',
    phone: '010-2345-6789',
    commission_rate: 12.0,
    is_active: true,
    created_at: '2024-01-16T10:30:00Z',
    updated_at: '2024-01-16T10:30:00Z'
  },
  {
    id: 'Qw8rT5',
    name: '박민수',
    memo: '유튜브',
    email: 'parkms@example.com',
    phone: '010-3456-7890',
    commission_rate: 20.0,
    is_active: true,
    created_at: '2024-01-17T14:15:00Z',
    updated_at: '2024-01-17T14:15:00Z'
  }
]

export const mockLinkClicks = [
  {
    id: 1,
    agent_id: 'Ab3kM9',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    referrer: 'https://blog.naver.com/kimcs',
    landing_page: 'https://www.ganpoom.com/?ref=Ab3kM9',
    session_id: 'sess_1705395600_abc123',
    clicked_at: '2024-01-16T09:00:00Z'
  },
  {
    id: 2,
    agent_id: 'Ab3kM9',
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    referrer: 'https://blog.naver.com/kimcs',
    landing_page: 'https://www.ganpoom.com/?ref=Ab3kM9',
    session_id: 'sess_1705396200_def456',
    clicked_at: '2024-01-16T09:10:00Z'
  },
  {
    id: 3,
    agent_id: 'Xy7nP2',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    referrer: 'https://www.instagram.com/',
    landing_page: 'https://www.ganpoom.com/?ref=Xy7nP2',
    session_id: 'sess_1705396800_ghi789',
    clicked_at: '2024-01-16T09:20:00Z'
  }
]

export const mockQuoteRequests = [
  {
    id: 1,
    agent_id: 'Ab3kM9',
    click_id: 1,
    svc_type: '웹드문제작',
    req_type: '간단제작',
    title: '카페 간판',
    area: '서울 강남구 테헤란로 123',
    phone: '010-9876-5432',
    floor: 1,
    setup_date: '2주 이내',
    deadline: '1개월 이내',
    texture: '16시~18시',
    comments: '깔끔한 디자인으로 부탁드립니다.',
    signs: {
      type: '전면간판',
      texture: '재날간판',
      construct_type: '프레임 바',
      size: '300*200',
      big_cnt: 3,
      small_cnt: 5,
      outside_lights: 1,
      title: '333',
      sub_title: '32342'
    },
    customer_name: '홍길동',
    customer_phone: '010-9876-5432',
    service_type: '웹드문제작',
    details: '깔끔한 디자인으로 부탁드립니다.',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    session_id: 'sess_1705395600_abc123',
    estimated_value: 5600000,
    commission_amount: 840000,
    status: 'pending',
    created_at: '2024-01-16T09:15:00Z',
    updated_at: '2024-01-16T09:15:00Z'
  },
  {
    id: 2,
    agent_id: 'Xy7nP2',
    click_id: 3,
    svc_type: '간판제작',
    req_type: '고급제작',
    title: '레스토랑 간판',
    area: '서울 서초구 강남대로 456',
    phone: '010-8765-4321',
    floor: 2,
    setup_date: '1주 이내',
    deadline: '2주 이내',
    texture: '14시~16시',
    comments: '고급스러운 느낌으로 제작해주세요.',
    signs: {
      type: '돌출간판',
      texture: 'LED간판',
      construct_type: '스테인리스',
      size: '400*300',
      big_cnt: 2,
      small_cnt: 8,
      outside_lights: 2,
      title: '맛있는집',
      sub_title: 'Delicious Restaurant'
    },
    customer_name: '김영수',
    customer_phone: '010-8765-4321',
    service_type: '간판제작',
    details: '고급스러운 느낌으로 제작해주세요.',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    session_id: 'sess_1705396800_ghi789',
    estimated_value: 4500000,
    commission_amount: 540000,
    status: 'contacted',
    created_at: '2024-01-16T09:25:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  }
]

export const mockUserSessions = [
  {
    id: 'sess_1705395600_abc123',
    agent_id: 'Ab3kM9',
    first_click_id: 1,
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    device_type: 'desktop',
    browser: 'Chrome',
    os: 'Windows',
    page_views: 5,
    session_duration: 900,
    bounce: false,
    converted: true,
    started_at: '2024-01-16T09:00:00Z',
    ended_at: '2024-01-16T09:15:00Z'
  },
  {
    id: 'sess_1705396200_def456',
    agent_id: 'Ab3kM9',
    first_click_id: 2,
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    device_type: 'mobile',
    browser: 'Safari',
    os: 'iOS',
    page_views: 2,
    session_duration: 120,
    bounce: true,
    converted: false,
    started_at: '2024-01-16T09:10:00Z',
    ended_at: '2024-01-16T09:12:00Z'
  },
  {
    id: 'sess_1705396800_ghi789',
    agent_id: 'Xy7nP2',
    first_click_id: 3,
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    device_type: 'desktop',
    browser: 'Chrome',
    os: 'Windows',
    page_views: 8,
    session_duration: 1200,
    bounce: false,
    converted: true,
    started_at: '2024-01-16T09:20:00Z',
    ended_at: '2024-01-16T09:40:00Z'
  }
]

// Mock API 응답 생성 함수들
export function generateMockStats() {
  const totalAgents = mockAgents.length
  const totalClicks = mockLinkClicks.length
  const totalQuotes = mockQuoteRequests.length
  const conversionRate = totalClicks > 0 ? ((totalQuotes / totalClicks) * 100).toFixed(1) : 0
  const totalRevenue = mockQuoteRequests.reduce((sum, quote) => sum + (quote.estimated_value || 0), 0)
  const totalCommission = mockQuoteRequests.reduce((sum, quote) => sum + (quote.commission_amount || 0), 0)

  return {
    totalAgents,
    totalClicks,
    totalQuotes,
    conversionRate,
    totalRevenue,
    totalCommission
  }
}

export function generateMockAgentStats() {
  return mockAgents.map(agent => {
    const clicks = mockLinkClicks.filter(click => click.agent_id === agent.id)
    const quotes = mockQuoteRequests.filter(quote => quote.agent_id === agent.id)
    const revenue = quotes.reduce((sum, quote) => sum + (quote.estimated_value || 0), 0)
    const commission = quotes.reduce((sum, quote) => sum + (quote.commission_amount || 0), 0)
    const conversionRate = clicks.length > 0 ? ((quotes.length / clicks.length) * 100).toFixed(1) : 0

    return {
      ...agent,
      link_clicks: clicks,
      quote_requests: quotes,
      clicks: clicks.length,
      quotes: quotes.length,
      revenue,
      commission,
      conversionRate,
      trackingLink: `https://www.ganpoom.com/?ref=${agent.id}`
    }
  })
}
