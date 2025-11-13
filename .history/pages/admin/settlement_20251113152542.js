import { useState, useEffect } from 'react'
import { generateMockAgentStats, mockQuoteRequests } from '../../lib/mock-data'

export default function SettlementPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSettlementData()
  }, [selectedMonth])

  function getCurrentMonth() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const loadSettlementData = () => {
    setLoading(true)
    
    try {
      // Mock 정산 데이터 생성
      const agents = generateMockAgentStats()
      const monthlySettlements = agents.map(agent => {
        // 해당 월의 견적요청 필터링
        const monthQuotes = mockQuoteRequests.filter(quote => {
          const quoteMonth = quote.created_at.substring(0, 7) // YYYY-MM
          return quote.agent_id === agent.id && quoteMonth === selectedMonth
        })

        const quoteCount = monthQuotes.length
        const totalCommission = quoteCount * 10000 // 건당 10,000원

        return {
          ...agent,
          month: selectedMonth,
          quoteCount,
          totalCommission,
          isSettled: false, // Mock에서는 모두 미정산
          quotes: monthQuotes
        }
      }).filter(settlement => settlement.quoteCount > 0) // 견적요청이 있는 에이전트만

      setSettlements(monthlySettlements)
    } catch (error) {
      console.error('정산 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettle = (agentId) => {
    setSettlements(prev => 
      prev.map(settlement => 
        settlement.id === agentId 
          ? { ...settlement, isSettled: true }
          : settlement
      )
    )
    alert('정산이 완료되었습니다!')
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

  const totalCommission = settlements.reduce((sum, s) => sum + s.totalCommission, 0)
  const totalQuotes = settlements.reduce((sum, s) => sum + s.quoteCount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">월별 정산 관리</h1>
              <p className="mt-1 text-sm text-gray-500">에이전트별 견적요청 커미션 정산</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="2024-01">2024년 1월</option>
                <option value="2024-02">2024년 2월</option>
                <option value="2024-03">2024년 3월</option>
                <option value="2024-04">2024년 4월</option>
                <option value="2024-05">2024년 5월</option>
                <option value="2024-06">2024년 6월</option>
              </select>
              <button 
                onClick={loadSettlementData}
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
        {/* 월별 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">정산 대상 에이전트</p>
                <p className="text-2xl font-bold text-gray-900">{settlements.length}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 견적요청</p>
                <p className="text-2xl font-bold text-gray-900">{totalQuotes}건</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 커미션</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommission)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 정산 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedMonth} 정산 내역
            </h3>
          </div>
          
          {settlements.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">정산 내역이 없습니다</h3>
              <p className="text-gray-500">선택한 월에 견적요청이 있는 에이전트가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      에이전트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      견적요청 수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      커미션 금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settlements.map((settlement) => (
                    <tr key={settlement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {settlement.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{settlement.name}</div>
                            <div className="text-sm text-gray-500">{settlement.memo || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{settlement.quoteCount}건</div>
                        <div className="text-sm text-gray-500">건당 10,000원</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(settlement.totalCommission)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {settlement.isSettled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            정산 완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            정산 대기
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!settlement.isSettled && (
                          <button
                            onClick={() => handleSettle(settlement.id)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            정산 완료
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 정산 정책 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">💡 정산 정책</h3>
          <div className="text-blue-800 space-y-2">
            <p>• <strong>커미션 금액:</strong> 견적요청당 고정 10,000원</p>
            <p>• <strong>정산 주기:</strong> 매월 말일 기준으로 정산</p>
            <p>• <strong>정산 방법:</strong> 에이전트가 제공한 계좌로 이체</p>
            <p>• <strong>정산 기준:</strong> 실제 견적요청이 접수된 건만 인정</p>
          </div>
        </div>
      </main>
    </div>
  )
}
