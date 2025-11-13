import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase-mock'

export default function AdminDashboard() {
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
  const [loading, setLoading] = useState(true)

  // 데이터 로드
  useEffect(() => {
    loadDashboardData()
    
    // Mock 환경에서는 실시간 구독 불필요
    // 실제 배포 시에는 Supabase 실시간 구독 기능 사용
  }, [])

  const loadDashboardData = async () => {
    try {
      // 기본 통계
      const [clicksRes, quotesRes, agentsRes] = await Promise.all([
        supabase.from('link_clicks').select('id', { count: 'exact' }),
        supabase.from('quote_requests').select('id, estimated_value, commission_amount', { count: 'exact' }),
        supabase.from('agents').select('id', { count: 'exact' })
      ])

      const totalClicks = clicksRes.count || 0
      const totalQuotes = quotesRes.count || 0
      const totalAgents = agentsRes.count || 0
      const conversionRate = totalClicks > 0 ? ((totalQuotes / totalClicks) * 100).toFixed(1) : 0
      
      const totalRevenue = quotesRes.data?.reduce((sum, quote) => sum + (quote.estimated_value || 0), 0) || 0
      const totalCommission = quotesRes.data?.reduce((sum, quote) => sum + (quote.commission_amount || 0), 0) || 0

      setStats({
        totalClicks,
        totalQuotes,
        totalAgents,
        conversionRate,
        totalRevenue,
        totalCommission
      })

      // 최근 견적요청
      const { data: quotes } = await supabase
        .from('quote_requests')
        .select(`
          id,
          svc_type,
          title,
          area,
          estimated_value,
          commission_amount,
          created_at,
          agents (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentQuotes(quotes || [])

      // 상위 에이전트
      const { data: agentStats } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          memo,
          commission_rate,
          link_clicks (id),
          quote_requests (id, estimated_value, commission_amount)
        `)

      const processedAgents = agentStats?.map(agent => ({
        ...agent,
        clicks: agent.link_clicks?.length || 0,
        quotes: agent.quote_requests?.length || 0,
        revenue: agent.quote_requests?.reduce((sum, q) => sum + (q.estimated_value || 0), 0) || 0,
        commission: agent.quote_requests?.reduce((sum, q) => sum + (q.commission_amount || 0), 0) || 0,
        conversionRate: agent.link_clicks?.length > 0 ? 
          ((agent.quote_requests?.length || 0) / agent.link_clicks.length * 100).toFixed(1) : 0
      })).sort((a, b) => b.revenue - a.revenue) || []

      setTopAgents(processedAgents.slice(0, 10))

    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '0'
    }}>
      {/* 헤더 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '20px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ganpoom 관리자 대시보드</h1>
              <p className="mt-1 text-sm text-gray-500">에이전트 링크 성과 실시간 모니터링</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                마지막 업데이트: {new Date().toLocaleString('ko-KR')}
              </div>
              <button 
                onClick={loadDashboardData}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  )
}
