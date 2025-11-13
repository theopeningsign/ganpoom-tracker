import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AnalyticsPage() {
  // 커스텀 스크롤바 스타일
  const customScrollbarStyle = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `
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
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [showAgentModal, setShowAgentModal] = useState(false)

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

  // 20명 에이전트의 1월~11월 실제 데이터 생성
  const generateRealisticAgentData = () => {
    const agents = [
      { agentId: 'Ab3kM9', name: '김철수' },
      { agentId: 'Xy7nP2', name: '이영희' },
      { agentId: 'Mn8kL4', name: '박민수' },
      { agentId: 'Qw9rT5', name: '정미영' },
      { agentId: 'Er6yU8', name: '최동훈' },
      { agentId: 'Ty3iO1', name: '한지수' },
      { agentId: 'Ui7pA4', name: '송민호' },
      { agentId: 'Op2sD6', name: '윤서연' },
      { agentId: 'As5dF7', name: '강혜진' },
      { agentId: 'Gh8jK2', name: '조성민' },
      { agentId: 'Lm4nB9', name: '신유리' },
      { agentId: 'Cv6xZ3', name: '홍준석' },
      { agentId: 'Bn7mQ1', name: '류소영' },
      { agentId: 'Wq2eR8', name: '임태현' },
      { agentId: 'Rt5yU4', name: '안미경' },
      { agentId: 'Pl9oI6', name: '서준호' },
      { agentId: 'Zx3cV0', name: '김나연' },
      { agentId: 'Nm1bG5', name: '박상우' },
      { agentId: 'Hj8kL7', name: '이수진' },
      { agentId: 'Fd4sA2', name: '최민재' }
    ]

    return agents.map(agent => {
      // 각 에이전트별로 1월~11월 월별 실적 생성
      const monthlyData = {}
      let totalQuotes = 0
      
      for (let month = 1; month <= 11; month++) {
        // 월별로 0~30건 사이의 랜덤 견적요청 (현실적인 범위)
        // 일부 에이전트는 실적이 좋고, 일부는 보통
        const baseQuotes = agent.name === '류소영' ? 20 : // 최고 실적자
                          agent.name === '김철수' ? 15 :
                          agent.name === '이영희' ? 12 :
                          agent.name === '임태현' ? 3 :  // 신입 에이전트
                          8 // 평균
        
        // 에이전트ID와 월을 기반으로 고정된 값 생성 (매번 같은 결과)
        const seed = agent.agentId.charCodeAt(0) + agent.agentId.charCodeAt(1) + month
        const variation = (seed % 7) - 3 // -3 ~ +3 범위의 고정된 변동
        const monthlyQuotes = Math.max(0, baseQuotes + variation)
        monthlyData[`2025-${month.toString().padStart(2, '0')}`] = monthlyQuotes
        totalQuotes += monthlyQuotes
      }
      
      return {
        agentId: agent.agentId,
        name: agent.name,
        quotes: monthlyData['2025-11'], // 11월 실적
        commission: monthlyData['2025-11'] * 10000,
        period: '2025-11',
        totalYearQuotes: totalQuotes,
        monthlyData: monthlyData
      }
    })
  }

  const generateAnalyticsData = () => {
    // 실제로는 API에서 가져올 데이터 (localStorage에서 실제 에이전트들 불러오기)
    const savedAgents = JSON.parse(localStorage.getItem('mockAgents') || '[]')
    
    // 실제 에이전트가 있으면 사용, 없으면 현실적인 더미 데이터
    const agentStats = savedAgents.length > 0 ? 
      savedAgents.map(agent => ({
        agentId: agent.id,
        name: agent.name,
        quotes: Math.floor(Math.random() * 25) + 5, // 실제로는 DB에서 조회
        commission: (Math.floor(Math.random() * 25) + 5) * 10000,
        period: '2025-11'
      })) :
      generateRealisticAgentData()

    const dailyStats = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      // 날짜를 기반으로 고정된 값 생성
      const dayOfMonth = date.getDate()
      const quotes = Math.max(1, (dayOfMonth % 12) + 2) // 3~14 범위의 고정값
      return {
        date: date.toISOString().split('T')[0],
        quotes: quotes,
        commission: quotes * 10000
      }
    }).reverse()

    // 월별 전체 통계 계산 (모든 에이전트 합계)
    const monthlyStats = []
    for (let month = 9; month <= 11; month++) {
      const monthKey = `2025-${month.toString().padStart(2, '0')}`
      const monthlyTotal = agentStats.reduce((sum, agent) => {
        return sum + (agent.monthlyData ? (agent.monthlyData[monthKey] || 0) : 0)
      }, 0)
      
      monthlyStats.push({
        month: monthKey,
        quotes: monthlyTotal,
        commission: monthlyTotal * 10000
      })
    }

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

  // 에이전트 클릭 핸들러
  const handleAgentClick = (agent) => {
    // 에이전트 상세 정보 생성 (실제로는 API에서 가져올 데이터)
    const agentDetails = {
      ...agent,
      email: `${agent.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      memo: `${agent.name} 에이전트 - 네이버 블로그 활동`,
      monthlyStats: agent.monthlyData ? 
        // 실제 월별 데이터가 있으면 사용
        Object.entries(agent.monthlyData)
          .filter(([month]) => parseInt(month.split('-')[1]) >= 6) // 6월부터만
          .map(([month, quotes]) => ({ month, quotes })) :
        // 없으면 랜덤 생성
        [
          { month: '2025-06', quotes: Math.floor(Math.random() * 15) + 1 },
          { month: '2025-07', quotes: Math.floor(Math.random() * 15) + 1 },
          { month: '2025-08', quotes: Math.floor(Math.random() * 15) + 1 },
          { month: '2025-09', quotes: Math.floor(Math.random() * 15) + 1 },
          { month: '2025-10', quotes: Math.floor(Math.random() * 15) + 1 },
          { month: '2025-11', quotes: agent.quotes }
        ]
    }
    
    setSelectedAgent(agentDetails)
    setShowAgentModal(true)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customScrollbarStyle }} />
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
            maxHeight: '650px', // 헤더(60px) + 10명(60px×10) = 약 650px
            overflowY: 'auto',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            scrollbarWidth: 'thin', // Firefox
            scrollbarColor: '#c1c1c1 #f1f1f1' // Firefox
          }}
          className="custom-scrollbar">
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
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleAgentClick(agent)}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#2c3e50' }}>{agent.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>ID: {agent.agentId}</div>
                        <div style={{ fontSize: '0.7rem', color: '#007bff', marginTop: '2px' }}>클릭하여 상세보기 →</div>
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

      {/* 에이전트 상세 정보 모달 */}
      {showAgentModal && selectedAgent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowAgentModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}>
            
            {/* 모달 헤더 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #f1f3f4'
            }}>
              <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.5rem' }}>
                👤 {selectedAgent.name} 상세 정보
              </h2>
              <button
                onClick={() => setShowAgentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px'
                }}
              >✕</button>
            </div>

            {/* 기본 정보 */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📋 기본 정보</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>에이전트 ID:</strong><br />
                  <span style={{ color: '#666' }}>{selectedAgent.agentId}</span>
                </div>
                <div>
                  <strong>이름:</strong><br />
                  <span style={{ color: '#666' }}>{selectedAgent.name}</span>
                </div>
                <div>
                  <strong>이메일:</strong><br />
                  <span style={{ color: '#666' }}>{selectedAgent.email}</span>
                </div>
                <div>
                  <strong>전화번호:</strong><br />
                  <span style={{ color: '#666' }}>{selectedAgent.phone}</span>
                </div>
              </div>
              <div style={{ marginTop: '15px' }}>
                <strong>메모:</strong><br />
                <span style={{ color: '#666' }}>{selectedAgent.memo}</span>
              </div>
            </div>

            {/* 현재 실적 */}
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <h3 style={{ margin: '0 0 15px 0' }}>📊 2025년 11월 실적</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{selectedAgent.quotes}</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>견적요청</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>₩{selectedAgent.commission.toLocaleString()}</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>커미션</div>
                </div>
              </div>
            </div>

            {/* 최근 5개월 실적 */}
            <div style={{
              background: '#fff',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>📈 최근 6개월 실적</h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {selectedAgent.monthlyStats.map((stat) => (
                        <th key={stat.month} style={{
                          padding: '12px 8px',
                          textAlign: 'center',
                          borderBottom: '2px solid #dee2e6',
                          fontSize: '0.9rem',
                          color: '#495057'
                        }}>
                          {stat.month.split('-')[1]}월
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {selectedAgent.monthlyStats.map((stat) => (
                        <td key={stat.month} style={{
                          padding: '15px 8px',
                          textAlign: 'center',
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          color: stat.month === '2025-11' ? '#007bff' : '#495057',
                          background: stat.month === '2025-11' ? '#e3f2fd' : 'transparent'
                        }}>
                          {stat.quotes}건
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                background: '#f8f9fa', 
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#666',
                textAlign: 'center'
              }}>
                💡 파란색으로 표시된 11월이 현재 월입니다
              </div>
            </div>

            {/* 닫기 버튼 */}
            <div style={{ textAlign: 'center', marginTop: '25px' }}>
              <button
                onClick={() => setShowAgentModal(false)}
                style={{
                  padding: '12px 30px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  )
}
