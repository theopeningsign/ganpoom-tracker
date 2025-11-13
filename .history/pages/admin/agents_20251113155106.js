import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AgentsPage() {
  const [agents, setAgents] = useState([])
  const [filteredAgents, setFilteredAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [viewMode, setViewMode] = useState('grid')
  const [formData, setFormData] = useState({
    name: '',
    memo: '',
    email: '',
    phone: ''
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadAgents()
  }, [])

  // 검색 및 필터링
  useEffect(() => {
    let filtered = [...agents]
    
    if (searchTerm) {
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.memo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone?.includes(searchTerm) ||
        agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'performance':
          return (b.revenue || 0) - (a.revenue || 0)
        case 'quotes':
          return (b.quotes || 0) - (a.quotes || 0)
        case 'created_at':
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })
    
    setFilteredAgents(filtered)
  }, [agents, searchTerm, sortBy])

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/mock/agents/list')
      if (!response.ok) {
        const { generateMockAgentStats } = await import('../../lib/mock-data')
        const mockAgents = generateMockAgentStats()
        setAgents(mockAgents)
        setFilteredAgents(mockAgents)
        return
      }
      
      const result = await response.json()
      setAgents(result.agents || [])
      setFilteredAgents(result.agents || [])
    } catch (error) {
      console.error('에이전트 로드 오류:', error)
      try {
        const { generateMockAgentStats } = await import('../../lib/mock-data')
        const mockAgents = generateMockAgentStats()
        setAgents(mockAgents)
        setFilteredAgents(mockAgents)
      } catch (mockError) {
        console.error('Mock 데이터 로드 실패:', mockError)
        setAgents([])
        setFilteredAgents([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/mock/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '에이전트 생성 실패')
      }

      alert(`✅ 에이전트가 생성되었습니다!\n\n📋 에이전트: ${result.agent.name}\n🔗 추적 링크: ${result.trackingLink}`)
      
      setFormData({
        name: '',
        memo: '',
        email: '',
        phone: ''
      })
      setShowCreateForm(false)
      loadAgents()

    } catch (error) {
      console.error('에이전트 생성 오류:', error)
      alert('❌ ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      alert('🔗 링크가 복사되었습니다!')
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const getPerformanceColor = (conversionRate) => {
    const rate = parseFloat(conversionRate)
    if (rate >= 10) return 'text-green-600 bg-green-50'
    if (rate >= 5) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getPerformanceBadge = (conversionRate) => {
    const rate = parseFloat(conversionRate)
    if (rate >= 10) return { text: '우수', color: 'bg-green-500' }
    if (rate >= 5) return { text: '보통', color: 'bg-yellow-500' }
    return { text: '개선필요', color: 'bg-red-500' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">에이전트 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">에이전트 관리</h1>
              <p className="mt-1 text-sm text-gray-500">총 {filteredAgents.length}명의 에이전트</p>
            </div>
            
            {/* 메뉴들 - 간격 넓히기 */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors">
                홈
              </Link>
              <Link href="/admin/settlement" className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
                정산 관리
              </Link>
              <Link href="/admin/test" className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                대시보드
              </Link>
              <Link href="/test-ganpoom" className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors">
                테스트
              </Link>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>새 에이전트</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 검색 및 필터 바 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            {/* 검색 */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="이름, 전화번호, 이메일, ID로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            {/* 정렬 및 뷰 모드 */}
            <div className="flex items-center space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="created_at">최신순</option>
                <option value="name">이름순</option>
                <option value="performance">성과순</option>
                <option value="quotes">전환순</option>
              </select>
              
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 에이전트 목록 */}
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '에이전트가 없습니다'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? '다른 검색어를 시도해보세요' : '첫 번째 에이전트를 생성해보세요'}
            </p>
            {!searchTerm && (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                + 에이전트 생성하기
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              /* 그리드 뷰 */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAgents.map((agent) => {
                  const badge = getPerformanceBadge(agent.conversionRate)
                  return (
                    <div key={agent.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                      {/* 카드 헤더 */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {agent.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                              <p className="text-xs text-gray-500">{agent.id}</p>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color} text-white`}>
                            {badge.text}
                          </div>
                        </div>
                        {agent.memo && (
                          <p className="text-sm text-gray-600 mt-2">{agent.memo}</p>
                        )}
                      </div>

                      {/* 성과 지표 */}
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">{agent.clicks || 0}</div>
                            <div className="text-xs text-gray-500">클릭</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary-600">{agent.quotes || 0}</div>
                            <div className="text-xs text-gray-500">전환</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">전환율</span>
                            <span className={`font-medium ${getPerformanceColor(agent.conversionRate)}`}>
                              {agent.conversionRate}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">커미션</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(agent.commission || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => copyLink(agent.trackingLink)}
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>링크 복사</span>
                          </button>
                          <span className="text-xs text-gray-400">
                            {formatDate(agent.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* 리스트 뷰 */
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        에이전트
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        연락처
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        성과
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        커미션
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAgents.map((agent) => {
                      const badge = getPerformanceBadge(agent.conversionRate)
                      return (
                        <tr key={agent.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {agent.name.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color} text-white`}>
                                    {badge.text}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500">{agent.memo || 'N/A'}</div>
                                <div className="text-xs text-gray-400">{agent.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{agent.phone || '-'}</div>
                            <div className="text-xs">{agent.email || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {agent.clicks || 0} 클릭 / {agent.quotes || 0} 전환
                            </div>
                            <div className={`text-sm ${getPerformanceColor(agent.conversionRate)}`}>
                              전환율 {agent.conversionRate}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(agent.commission || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => copyLink(agent.trackingLink)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              링크 복사
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* 에이전트 생성 모달 */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">새 에이전트 생성</h3>
            </div>
            
            <form onSubmit={handleCreateAgent} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    에이전트 이름 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="예: 김철수"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={formData.memo}
                    onChange={(e) => setFormData({...formData, memo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="예: 네이버블로그, 인스타그램"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 (선택사항)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="agent@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호 (선택사항)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="010-1234-5678"
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>💰 커미션 정책:</strong> 견적요청당 고정 10,000원
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    월별로 정산됩니다.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {creating && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{creating ? '생성 중...' : '생성하기'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
