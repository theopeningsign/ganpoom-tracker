import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // 이번 달 1일
    endDate: new Date().toISOString().split('T')[0] // 오늘
  })
  
  const [viewMode, setViewMode] = useState('monthly') // 'monthly', 'daily', 'custom'
  const [analytics, setAnalytics] = useState({
    totalQuotes: 0,
    totalCommission: 0,
    agentStats: [],
    dailyStats: [],
    monthlyStats: []
  })
  
  const [loading, setLoading] = useState(false)
  const [agentSearchTerm, setAgentSearchTerm] = useState('')
  const [filteredAgentStats, setFilteredAgentStats] = useState([])

  useEffect(() => {
    loadAnalytics()
  }, [dateRange, viewMode])

  // 에이전트 검색 필터링
  useEffect(() => {
    if (!agentSearchTerm) {
      setFilteredAgentStats(analytics.agentStats)
    } else {
      const filtered = analytics.agentStats.filter(agent =>
        agent.name.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
        agent.agentId.toLowerCase().includes(agentSearchTerm.toLowerCase())
      )
      setFilteredAgentStats(filtered)
    }
  }, [analytics.agentStats, agentSearchTerm])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Mock 데이터로 시뮬레이션 (실제로는 API에서 가져올 예정)
      const mockData = generateAnalyticsData()
      setAnalytics(mockData)
      setFilteredAgentStats(mockData.agentStats)
    } catch (error) {
      console.error('통계 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAnalyticsData = () => {
    // 실제로는 API에서 가져올 데이터 (localStorage에서 실제 에이전트들 불러오기)
    const savedAgents = JSON.parse(localStorage.getItem('mockAgents') || '[]')
    
    // 실제 에이전트가 있으면 사용, 없으면 더미 데이터
    const agentStats = savedAgents.length > 0 ? 
      savedAgents.map(agent => ({
        agentId: agent.id,
        name: agent.name,
        quotes: Math.floor(Math.random() * 25) + 5, // 실제로는 DB에서 조회
        commission: (Math.floor(Math.random() * 25) + 5) * 10000,
        period: '2024-11'
      })) :
      [
        { agentId: 'Ab3kM9', name: '김철수', quotes: 23, commission: 230000, period: '2024-11' },
        { agentId: 'Xy7nP2', name: '이영희', quotes: 18, commission: 180000, period: '2024-11' },
        { agentId: 'Mn8kL4', name: '박민수', quotes: 15, commission: 150000, period: '2024-11' },
        { agentId: 'Qw9rT5', name: '정미영', quotes: 12, commission: 120000, period: '2024-11' },
        { agentId: 'Er6yU8', name: '최동훈', quotes: 20, commission: 200000, period: '2024-11' },
        { agentId: 'Ty3iO1', name: '한지수', quotes: 16, commission: 160000, period: '2024-11' },
        { agentId: 'Ui7pA4', name: '송민호', quotes: 14, commission: 140000, period: '2024-11' },
        { agentId: 'Op2sD6', name: '윤서연', quotes: 19, commission: 190000, period: '2024-11' },
        { agentId: 'As5dF7', name: '강혜진', quotes: 22, commission: 220000, period: '2024-11' },
        { agentId: 'Gh8jK2', name: '조성민', quotes: 17, commission: 170000, period: '2024-11' },
        { agentId: 'Lm4nB9', name: '신유리', quotes: 21, commission: 210000, period: '2024-11' },
        { agentId: 'Cv6xZ3', name: '홍준석', quotes: 13, commission: 130000, period: '2024-11' },
        { agentId: 'Bn7mQ1', name: '류소영', quotes: 25, commission: 250000, period: '2024-11' },
        { agentId: 'Wq2eR8', name: '임태현', quotes: 11, commission: 110000, period: '2024-11' },
        { agentId: 'Rt5yU4', name: '안미경', quotes: 24, commission: 240000, period: '2024-11' },
        { agentId: 'Pl9oI6', name: '서준호', quotes: 16, commission: 160000, period: '2024-11' },
        { agentId: 'Zx3cV0', name: '김나연', quotes: 18, commission: 180000, period: '2024-11' },
        { agentId: 'Nm1bG5', name: '박상우', quotes: 20, commission: 200000, period: '2024-11' },
        { agentId: 'Hj8kL7', name: '이수진', quotes: 14, commission: 140000, period: '2024-11' },
        { agentId: 'Fd4sA2', name: '최민재', quotes: 19, commission: 190000, period: '2024-11' }
      ]

    const dailyStats = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString().split('T')[0],
        quotes: Math.floor(Math.random() * 10) + 1,
        commission: (Math.floor(Math.random() * 10) + 1) * 10000
      }
    }).reverse()

    const monthlyStats = [
      { month: '2024-09', quotes: 45, commission: 450000 },
      { month: '2024-10', quotes: 52, commission: 520000 },
      { month: '2024-11', quotes: 56, commission: 560000 }
    ]

    return {
      totalQuotes: agentStats.reduce((sum, agent) => sum + agent.quotes, 0),
      totalCommission: agentStats.reduce((sum, agent) => sum + agent.commission, 0),
      agentStats,
      dailyStats,
      monthlyStats
    }
  }

  const setQuickDateRange = (type) => {
    const today = new Date()
    let startDate, endDate

    switch (type) {
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = today
        break
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case 'last3Months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1)
        endDate = today
        break
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1)
        endDate = today
        break
      default:
        return
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    })
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
            <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '2rem', fontWeight: 'bold' }}>
              📊 상세 통계 분석
            </h1>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <Link href="/admin" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>대시보드</button>
              </Link>
              
              <Link href="/admin/agents" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>에이전트 관리</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* 기간 선택 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>📅 기간 선택</h3>
          
          {/* 빠른 선택 버튼들 */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { key: 'thisMonth', label: '이번 달' },
              { key: 'lastMonth', label: '지난 달' },
              { key: 'last3Months', label: '최근 3개월' },
              { key: 'thisYear', label: '올해' }
            ].map(option => (
              <button
                key={option.key}
                onClick={() => setQuickDateRange(option.key)}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 커스텀 날짜 선택 */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>시작일:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>종료일:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>보기 방식:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="monthly">월별</option>
                <option value="daily">일별</option>
                <option value="custom">기간별</option>
              </select>
            </div>
          </div>
        </div>

        {/* 요약 통계 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📋</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>
              {analytics.totalQuotes.toLocaleString()}
            </div>
            <div style={{ color: '#666', fontSize: '1rem' }}>총 견적요청</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💰</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
              ₩{analytics.totalCommission.toLocaleString()}
            </div>
            <div style={{ color: '#666', fontSize: '1rem' }}>총 커미션</div>
          </div>
        </div>

        {/* 에이전트별 상세 통계 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>👥 에이전트별 실적</h3>
            
            {/* 검색창 */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="에이전트 이름 또는 ID 검색..."
                value={agentSearchTerm}
                onChange={(e) => setAgentSearchTerm(e.target.value)}
                style={{
                  padding: '10px 40px 10px 15px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '25px',
                  fontSize: '14px',
                  width: '250px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4facfe'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
              <div style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666',
                fontSize: '16px'
              }}>🔍</div>
            </div>
          </div>
          
          {/* 검색 결과 표시 */}
          {agentSearchTerm && (
            <div style={{ 
              marginBottom: '15px', 
              padding: '10px 15px', 
              background: '#f8f9fa', 
              borderRadius: '8px',
              fontSize: '14px',
              color: '#666'
            }}>
              "{agentSearchTerm}" 검색 결과: {filteredAgentStats.length}명
            </div>
          )}
          
          <div style={{ 
            overflowX: 'auto',
            maxHeight: '600px', // 약 10명 정도가 보이는 높이
            overflowY: 'auto',
            border: '1px solid #e9ecef',
            borderRadius: '8px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>에이전트</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>견적요청</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>커미션</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>기간</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgentStats.length > 0 ? (
                  filteredAgentStats.map((agent, index) => (
                    <tr key={agent.agentId} style={{ 
                      borderBottom: '1px solid #e9ecef',
                      background: index % 2 === 0 ? 'white' : '#f8f9fa',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{agent.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>ID: {agent.agentId}</div>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {agent.quotes}건
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>
                        ₩{agent.commission.toLocaleString()}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', color: '#666' }}>
                        {agent.period}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ 
                      padding: '40px', 
                      textAlign: 'center', 
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 시계열 차트 (간단한 테이블 형태) */}
        {viewMode === 'daily' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>📈 일별 실적 추이</h3>
            
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>날짜</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>견적요청</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>커미션</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.dailyStats.slice(-14).map((day, index) => (
                    <tr key={day.date} style={{ 
                      borderBottom: '1px solid #e9ecef',
                      background: index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      <td style={{ padding: '12px' }}>{day.date}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{day.quotes}건</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#28a745', fontWeight: 'bold' }}>
                        ₩{day.commission.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'monthly' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>📅 월별 실적 추이</h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>월</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>견적요청</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>커미션</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>전월 대비</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.monthlyStats.map((month, index) => {
                    const prevMonth = analytics.monthlyStats[index - 1]
                    const growth = prevMonth ? ((month.quotes - prevMonth.quotes) / prevMonth.quotes * 100).toFixed(1) : 0
                    
                    return (
                      <tr key={month.month} style={{ 
                        borderBottom: '1px solid #e9ecef',
                        background: index % 2 === 0 ? 'white' : '#f8f9fa'
                      }}>
                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{month.month}</td>
                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {month.quotes}건
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>
                          ₩{month.commission.toLocaleString()}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span style={{ 
                            color: growth > 0 ? '#28a745' : growth < 0 ? '#dc3545' : '#666',
                            fontWeight: 'bold'
                          }}>
                            {growth > 0 ? '+' : ''}{growth}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
