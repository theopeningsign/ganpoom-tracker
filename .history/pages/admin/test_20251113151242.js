import { useState, useEffect } from 'react'
import { generateMockStats, generateMockAgentStats, mockQuoteRequests } from '../../lib/mock-data'

export default function TestAdminDashboard() {
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalQuotes: 0,
    totalAgents: 0,
    conversionRate: 0,
    totalRevenue: 0,
    totalCommission: 0
  })
  
  const [recentQuotes, setRecentQuotes] = useState([])
  const [topAgents, setTopAgents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMockData()
    
    // 5초마다 데이터 새로고침 (실시간 시뮬레이션)
    const interval = setInterval(loadMockData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadMockData = () => {
    setLoading(true)
    
    try {
      // Mock 통계 데이터
      const mockStats = generateMockStats()
      setStats(mockStats)

      // Mock 최근 견적요청
      const sortedQuotes = [...mockQuoteRequests]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
        .map(quote => ({
          ...quote,
          agents: { name: getAgentName(quote.agent_id) }
        }))
      setRecentQuotes(sortedQuotes)

      // Mock 상위 에이전트
      const agentStats = generateMockAgentStats()
      setTopAgents(agentStats.slice(0, 10))

    } catch (error) {
      console.error('Mock 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAgentName = (agentId) => {
    const agentNames = {
      'Ab3kM9': '김철수',
      'Xy7nP2': '이영희',
      'Qw8rT5': '박민수'
    }
    return agentNames[agentId] || 'Unknown'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">테스트 관리자 대시보드</h1>
              <p className="mt-1 text-sm text-gray-500">Mock 데이터를 사용한 테스트 환경</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                마지막 업데이트: {new Date().toLocaleString('ko-KR')}
              </div>
              <button 
                onClick={loadMockData}
                disabled={loading}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {loading ? '로딩...' : '새로고침'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 테스트 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-medium text-blue-900 mb-2">🧪 테스트 환경</h3>
          <div className="text-blue-800 space-y-2">
            <p>• 이 페이지는 Mock 데이터를 사용하여 실제 시스템과 동일한 기능을 테스트할 수 있습니다.</p>
            <p>• <a href="/admin/agents" className="underline font-medium">에이전트 관리</a>에서 새 에이전트를 생성하고, <a href="/test-ganpoom" className="underline font-medium">테스트 페이지</a>에서 견적요청을 해보세요.</p>
            <p>• 실시간으로 데이터가 업데이트되는 것을 확인할 수 있습니다.</p>
          </div>
        </div>

        {/* 주요 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 에이전트</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAgents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🔗</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 클릭</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">견적요청</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuotes.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">전환율</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">예상 매출</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 커미션</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalCommission)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 최근 견적요청 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">최근 견적요청</h3>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      에이전트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      서비스
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      예상금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시간
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {quote.agents?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {quote.svc_type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(quote.estimated_value || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(quote.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentQuotes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  아직 견적요청이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 상위 에이전트 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">상위 에이전트</h3>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      에이전트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      클릭/전환
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      매출
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      커미션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topAgents.map((agent, index) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                              <span className="text-white text-sm font-bold">#{index + 1}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                            <div className="text-sm text-gray-500">{agent.memo || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.clicks} / {agent.quotes} ({agent.conversionRate}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(agent.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(agent.commission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {topAgents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  아직 에이전트가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 테스트 액션 버튼들 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🧪 테스트 액션</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/agents"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              에이전트 생성하기
            </a>
            <a
              href="/test-ganpoom"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
            >
              테스트 페이지 방문
            </a>
            <button
              onClick={() => {
                const agentId = 'Ab3kM9' // 기본 테스트 에이전트
                const testLink = `${window.location.origin}/test-ganpoom?ref=${agentId}`
                window.open(testLink, '_blank')
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              추적 링크로 테스트
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
