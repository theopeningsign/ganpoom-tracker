import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

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
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date()
    return {
      startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0], // 이번 달 1일
      endDate: today.toISOString().split('T')[0] // 오늘
    }
  })
  
  // viewMode 제거 - 불필요한 기능
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
  const monthlyTableRef = useRef(null)

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  // 월별 실적 테이블 최근 달로 스크롤
  useEffect(() => {
    if (monthlyTableRef.current && analytics.monthlyStats.length > 0) {
      setTimeout(() => {
        monthlyTableRef.current.scrollTop = monthlyTableRef.current.scrollHeight
      }, 100)
    }
  }, [analytics.monthlyStats])

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
      // 실제 API에서 통계 데이터 가져오기
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
      
      const response = await fetch(`/api/stats/analytics?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        
        // 실제 API 데이터 설정
        setAnalytics({
          totalQuotes: result.totalQuotes,
          totalCommission: result.totalCommission,
          agentStats: result.agentStats,
          dailyStats: result.dailyStats,
          monthlyStats: result.monthlyStats
        })
        setFilteredAgentStats(result.agentStats)
      } else {
        throw new Error('통계 API 호출 실패')
      }
    } catch (error) {
      console.error('통계 로드 오류:', error)
      
      // 실패시 빈 데이터로 설정
      setAnalytics({
        totalQuotes: 0,
        totalCommission: 0,
        agentStats: [],
        dailyStats: [],
        monthlyStats: []
      })
      setFilteredAgentStats([])
    } finally {
      setLoading(false)
    }
  }


  // 엑셀 다운로드 함수
  const downloadExcel = () => {
    if (!filteredAgentStats || filteredAgentStats.length === 0) {
      alert('다운로드할 데이터가 없습니다.')
      return
    }

    // 엑셀 데이터 준비
    const excelData = filteredAgentStats.map(agent => ({
      '에이전트 ID': agent.agentId,
      '에이전트 이름': agent.name,
      '총 접속수': agent.clicks || 0,
      '견적요청 건수': agent.quotes || 0,
      '전환율(%)': agent.clicks > 0 ? ((agent.quotes / agent.clicks) * 100).toFixed(1) : '0.0',
      '총 커미션(원)': (agent.commission || 0).toLocaleString(),
      '조회 기간': agent.period || `${dateRange.startDate} ~ ${dateRange.endDate}`
    }))

    // 워크북 생성
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    
    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 12 }, // 에이전트 ID
      { wch: 15 }, // 에이전트 이름
      { wch: 12 }, // 총 접속수
      { wch: 14 }, // 견적요청 건수
      { wch: 12 }, // 전환율
      { wch: 15 }, // 총 커미션
      { wch: 25 }  // 조회 기간
    ]

    XLSX.utils.book_append_sheet(wb, ws, '에이전트별 실적')

    // 파일명 생성 (기간 포함)
    const fileName = `에이전트_실적_${dateRange.startDate}_${dateRange.endDate}.xlsx`

    // 다운로드
    XLSX.writeFile(wb, fileName)
  }

  const setQuickDateRange = (type) => {
    // 시간대 문제를 피하기 위해 문자열로 직접 계산
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1 // 1-based로 변환 (11월 = 11)
    const date = today.getDate()
    
    let startDateStr, endDateStr

    switch (type) {
      case 'today':
        // 오늘 하루
        startDateStr = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
        endDateStr = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
        break
      case 'thisWeek':
        // 이번 주 (월요일~오늘)
        const todayObj = new Date(year, month - 1, date)
        const dayOfWeek = todayObj.getDay() // 0=일요일, 1=월요일
        const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1) // 월요일까지의 일수
        const monday = new Date(todayObj)
        monday.setDate(todayObj.getDate() + mondayOffset)
        
        startDateStr = `${monday.getFullYear()}-${(monday.getMonth() + 1).toString().padStart(2, '0')}-${monday.getDate().toString().padStart(2, '0')}`
        endDateStr = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
        break
      case 'thisMonth':
        // 이번 달 1일부터 오늘까지
        startDateStr = `${year}-${month.toString().padStart(2, '0')}-01`
        endDateStr = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
        break
      case 'lastMonth':
        // 지난 달 1일부터 지난 달 말일까지
        const lastMonth = month - 1
        const lastMonthYear = lastMonth <= 0 ? year - 1 : year
        const lastMonthNum = lastMonth <= 0 ? 12 : lastMonth
        
        // 지난 달 마지막 날 계산
        const lastDayOfLastMonth = new Date(year, month - 1, 0).getDate()
        
        startDateStr = `${lastMonthYear}-${lastMonthNum.toString().padStart(2, '0')}-01`
        endDateStr = `${lastMonthYear}-${lastMonthNum.toString().padStart(2, '0')}-${lastDayOfLastMonth.toString().padStart(2, '0')}`
        break
      case 'last3Months':
        // 3개월 전 1일부터 오늘까지
        const threeMonthsAgo = month - 2
        const threeMonthsYear = threeMonthsAgo <= 0 ? year - 1 : year
        const threeMonthsNum = threeMonthsAgo <= 0 ? 12 + threeMonthsAgo : threeMonthsAgo
        
        startDateStr = `${threeMonthsYear}-${threeMonthsNum.toString().padStart(2, '0')}-01`
        endDateStr = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
        break
      case 'thisYear':
        // 올해 1월 1일부터 오늘까지
        startDateStr = `${year}-01-01`
        endDateStr = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
        break
      default:
        return
    }

    // 날짜 범위 설정 완료

    setDateRange({
      startDate: startDateStr,
      endDate: endDateStr
    })
  }

  // 에이전트 클릭 핸들러
  const handleAgentClick = (agent) => {
    // API에서 가져온 실제 데이터 사용 (더미 데이터 생성하지 않음)
    setSelectedAgent(agent)
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
              <Link href="/" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>🏠 홈</button>
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
              { key: 'today', label: '오늘' },
              { key: 'thisWeek', label: '이번 주' },
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

          </div>
        </div>

        {/* 요약 통계 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>👆</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>
              {analytics.agentStats.reduce((sum, agent) => sum + (agent.clicks || 0), 0).toLocaleString()}
            </div>
            <div style={{ color: '#666', fontSize: '1rem' }}>총 접속수</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📋</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
              {analytics.totalQuotes.toLocaleString()}
            </div>
            <div style={{ color: '#666', fontSize: '1rem' }}>총 견적요청</div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>👥 에이전트별 실적</h3>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* 엑셀 다운로드 버튼 */}
              <button
                onClick={downloadExcel}
                disabled={!filteredAgentStats || filteredAgentStats.length === 0}
                style={{
                  padding: '10px 20px',
                  background: filteredAgentStats && filteredAgentStats.length > 0 ? '#28a745' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: filteredAgentStats && filteredAgentStats.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => {
                  if (filteredAgentStats && filteredAgentStats.length > 0) {
                    e.target.style.background = '#218838'
                  }
                }}
                onMouseOut={(e) => {
                  if (filteredAgentStats && filteredAgentStats.length > 0) {
                    e.target.style.background = '#28a745'
                  }
                }}
              >
                📥 엑셀 다운로드
              </button>
              
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
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>총 접속수</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>견적요청</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>전환율</th>
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
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#4facfe' }}>
                        {agent.clicks || 0}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {agent.quotes}건
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>
                        {agent.clicks > 0 ? ((agent.quotes / agent.clicks) * 100).toFixed(1) : '0.0'}%
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', color: '#666' }}>
                        {agent.period}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ 
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


        {/* 간단한 통계 요약 */}
        {analytics.monthlyStats.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>📅 월별 실적 추이</h3>
            
            <div style={{ 
              overflowX: 'auto',
              maxHeight: '400px', // 4개 행 정도의 높이
              overflowY: 'auto',
              border: '1px solid #e9ecef',
              borderRadius: '8px'
            }}
            className="custom-scrollbar"
            ref={monthlyTableRef}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>월</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>견적요청</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>커미션</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>전월 대비</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.monthlyStats.map((month, index) => {
                    const prevMonth = analytics.monthlyStats[index - 1]
                    const growth = prevMonth && prevMonth.quotes > 0 ? ((month.quotes - prevMonth.quotes) / prevMonth.quotes * 100).toFixed(1) : '0'
                    
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
                            color: parseFloat(growth) > 0 ? '#28a745' : parseFloat(growth) < 0 ? '#dc3545' : '#666',
                            fontWeight: 'bold'
                          }}>
                            {parseFloat(growth) > 0 ? '+' : ''}{growth}%
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
                  <strong>전화번호:</strong><br />
                  <span style={{ color: '#666' }}>{selectedAgent.phone || '정보 없음'}</span>
                </div>
                <div>
                  <strong>계좌번호:</strong><br />
                  <span style={{ color: '#666' }}>{selectedAgent.account_number || '정보 없음'}</span>
                </div>
                <div>
                  <strong>이메일:</strong><br />
                  <span style={{ color: '#666' }}>{selectedAgent.email || '정보 없음'}</span>
                </div>
              </div>
              <div style={{ marginTop: '15px' }}>
                <strong>메모:</strong><br />
                <span style={{ color: '#666' }}>{selectedAgent.memo || '정보 없음'}</span>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{selectedAgent.clicks || 0}</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>총 접속수</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{selectedAgent.quotes}건</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>견적요청</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {selectedAgent.clicks > 0 ? ((selectedAgent.quotes / selectedAgent.clicks) * 100).toFixed(1) : '0.0'}%
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>전환율</div>
                </div>
              </div>
            </div>

            {/* 최근 6개월 실적 */}
            {selectedAgent.monthlyStats && selectedAgent.monthlyStats.length > 0 && (
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
                            {parseInt(stat.month.split('-')[1])}월
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {selectedAgent.monthlyStats.map((stat) => {
                          const currentMonth = new Date().getMonth() + 1
                          const currentYear = new Date().getFullYear()
                          const isCurrentMonth = stat.month === `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
                          
                          return (
                            <td key={stat.month} style={{
                              padding: '15px 8px',
                              textAlign: 'center',
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              color: isCurrentMonth ? '#007bff' : '#495057',
                              background: isCurrentMonth ? '#e3f2fd' : 'transparent'
                            }}>
                              {stat.quotes}건
                            </td>
                          )
                        })}
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
                  💡 파란색으로 표시된 월이 현재 월입니다
                </div>
              </div>
            )}

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
