import { useState, useEffect } from 'react'
// Mock 데이터 사용 (테스트용)
// import { supabase } from '../../lib/supabase-mock'

export default function AgentsPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    memo: '',
    email: '',
    phone: '',
    commissionRate: 10
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select(`
          *,
          link_clicks (id),
          quote_requests (id, estimated_value, commission_amount)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedAgents = data.map(agent => ({
        ...agent,
        clicks: agent.link_clicks?.length || 0,
        quotes: agent.quote_requests?.length || 0,
        revenue: agent.quote_requests?.reduce((sum, q) => sum + (q.estimated_value || 0), 0) || 0,
        commission: agent.quote_requests?.reduce((sum, q) => sum + (q.commission_amount || 0), 0) || 0,
        conversionRate: agent.link_clicks?.length > 0 ? 
          ((agent.quote_requests?.length || 0) / agent.link_clicks.length * 100).toFixed(1) : 0,
        trackingLink: `https://www.ganpoom.com/?ref=${agent.id}`
      }))

      setAgents(processedAgents)
    } catch (error) {
      console.error('에이전트 로드 오류:', error)
      alert('에이전트 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/agents/create', {
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

      alert(`에이전트가 생성되었습니다!\n추적 링크: ${result.trackingLink}`)
      
      // 폼 초기화
      setFormData({
        name: '',
        memo: '',
        email: '',
        phone: '',
        commissionRate: 10
      })
      setShowCreateForm(false)
      
      // 목록 새로고침
      loadAgents()

    } catch (error) {
      console.error('에이전트 생성 오류:', error)
      alert(error.message)
    } finally {
      setCreating(false)
    }
  }

  const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      alert('링크가 복사되었습니다!')
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
              <p className="mt-1 text-sm text-gray-500">에이전트 생성 및 성과 관리</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                + 새 에이전트 생성
              </button>
              <button 
                onClick={loadAgents}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 에이전트 생성 폼 */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">새 에이전트 생성</h3>
                <form onSubmit={handleCreateAgent}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      커미션율 (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({...formData, commissionRate: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
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
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {creating ? '생성 중...' : '생성하기'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 에이전트 목록 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              전체 에이전트 ({agents.length}명)
            </h3>
          </div>
          
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">에이전트가 없습니다</h3>
              <p className="text-gray-500 mb-4">첫 번째 에이전트를 생성해보세요.</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                + 에이전트 생성하기
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {agents.map((agent) => (
                <li key={agent.id} className="px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {agent.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-lg font-medium text-gray-900">{agent.name}</p>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {agent.id}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{agent.memo || '메모 없음'}</p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>생성일: {formatDate(agent.created_at)}</span>
                          <span className="mx-2">•</span>
                          <span>커미션: {agent.commission_rate}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      {/* 성과 통계 */}
                      <div className="text-right">
                        <div className="text-sm text-gray-500">클릭 / 전환</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {agent.clicks} / {agent.quotes}
                        </div>
                        <div className="text-sm text-gray-500">
                          전환율: {agent.conversionRate}%
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500">예상 매출</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(agent.revenue)}
                        </div>
                        <div className="text-sm text-gray-500">
                          커미션: {formatCurrency(agent.commission)}
                        </div>
                      </div>
                      
                      {/* 추적 링크 */}
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-2">추적 링크</div>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded max-w-xs truncate">
                            {agent.trackingLink}
                          </code>
                          <button
                            onClick={() => copyLink(agent.trackingLink)}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            복사
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
