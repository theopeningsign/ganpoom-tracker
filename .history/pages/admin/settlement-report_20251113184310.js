import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function SettlementReportPage() {
  const router = useRouter()
  const [reportData, setReportData] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [viewingMonth, setViewingMonth] = useState('') // 현재 보고 있는 월
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // URL 파라미터에서 month 가져오기
    const { month } = router.query
    if (month) {
      setSelectedMonth(month)
      setViewingMonth(month)
      loadReportData(month)
    } else {
      // 파라미터가 없으면 기본값 (현재 정산월) 사용
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      const settlementMonth = currentMonth - 1
      const settlementYear = settlementMonth <= 0 ? currentYear - 1 : currentYear
      const adjustedMonth = settlementMonth <= 0 ? settlementMonth + 12 : settlementMonth
      const defaultMonth = `${settlementYear}-${adjustedMonth.toString().padStart(2, '0')}`
      
      setSelectedMonth(defaultMonth)
      setViewingMonth(defaultMonth)
      loadReportData(defaultMonth)
    }
  }, [router.query])

  // 월별 네비게이션 함수들
  const navigateMonth = (direction) => {
    const [year, month] = viewingMonth.split('-').map(Number)
    
    let newYear = year
    let newMonth = month
    
    if (direction === 'prev') {
      newMonth = month - 1
      if (newMonth < 1) {
        newMonth = 12
        newYear = year - 1
      }
    } else if (direction === 'next') {
      // 현재 정산월을 넘어갈 수 없음
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      const maxSettlementMonth = currentMonth - 1
      const maxYear = maxSettlementMonth <= 0 ? currentYear - 1 : currentYear
      const maxMonth = maxSettlementMonth <= 0 ? maxSettlementMonth + 12 : maxSettlementMonth
      
      if (year < maxYear || (year === maxYear && month < maxMonth)) {
        newMonth = month + 1
        if (newMonth > 12) {
          newMonth = 1
          newYear = year + 1
        }
      } else {
        return // 현재 정산월이면 다음으로 갈 수 없음
      }
    }
    
    const newViewingMonth = `${newYear}-${newMonth.toString().padStart(2, '0')}`
    setViewingMonth(newViewingMonth)
    
    // URL도 업데이트
    router.push(`/admin/settlement-report?month=${newViewingMonth}`, undefined, { shallow: true })
    
    loadReportData(newViewingMonth)
  }

  const canNavigateNext = () => {
    const [viewYear, viewMonth] = viewingMonth.split('-').map(Number)
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const maxSettlementMonth = currentMonth - 1
    const maxYear = maxSettlementMonth <= 0 ? currentYear - 1 : currentYear
    const maxMonth = maxSettlementMonth <= 0 ? maxSettlementMonth + 12 : maxSettlementMonth
    
    return viewYear < maxYear || (viewYear === maxYear && viewMonth < maxMonth)
  }

  const canNavigatePrev = () => {
    // 2025년 1월까지만 갈 수 있음 (시스템 시작 시점)
    const [viewYear, viewMonth] = viewingMonth.split('-').map(Number)
    return viewYear > 2025 || (viewYear === 2025 && viewMonth > 1)
  }

  const loadReportData = (targetMonth) => {
    try {
      setLoading(true)
      
      // 선택된 월이 없으면 현재 정산월 사용
      if (!targetMonth) {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1
        const settlementMonth = currentMonth - 1
        const settlementYear = settlementMonth <= 0 ? currentYear - 1 : currentYear
        const adjustedMonth = settlementMonth <= 0 ? settlementMonth + 12 : settlementMonth
        targetMonth = `${settlementYear}-${adjustedMonth.toString().padStart(2, '0')}`
      }

      // 선택된 월 파싱
      const [selectedYear, selectedMonthNum] = targetMonth.split('-').map(Number)
      
      // 1월부터 선택된 월까지 데이터 생성
      const reports = []
      
      for (let month = 1; month <= selectedMonthNum; month++) {
        const monthStr = `${selectedYear}-${month.toString().padStart(2, '0')}`
        
        // 해당 월의 통계 계산
        const monthlyStats = calculateMonthlyStats(month)
        
        reports.push({
          month: monthStr,
          monthName: `${month}월`,
          year: selectedYear,
          isCurrentSettlement: monthStr === targetMonth, // 선택된 월이 현재 보고 있는 정산월
          ...monthlyStats
        })
      }
      
      setReportData(reports)
    } catch (error) {
      console.error('정산 실적표 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyStats = (monthNum) => {
    // 에이전트 목록
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
      { agentId: 'Rt5yU4', name: '안미경' }
    ]

    let totalClicks = 0
    let totalQuotes = 0
    let totalCommission = 0
    let activeAgents = 0

    agents.forEach(agent => {
      // 월별 견적요청 수 계산 (상세통계와 동일한 로직)
      const baseQuotes = agent.name === '류소영' ? 20 :
                        agent.name === '김철수' ? 15 :
                        agent.name === '이영희' ? 12 :
                        agent.name === '임태현' ? 3 :
                        8

      const seed = agent.agentId.charCodeAt(0) + agent.agentId.charCodeAt(1) + monthNum
      const variation = (seed % 7) - 3
      const monthlyQuotes = Math.max(0, baseQuotes + variation)

      if (monthlyQuotes > 0) {
        activeAgents++
        
        // 접속수 계산
        const clickMultiplier = agent.name === '류소영' ? 5 :
                               agent.name === '김철수' ? 7 :
                               agent.name === '임태현' ? 15 :
                               8
        const monthlyClicks = Math.max(1, monthlyQuotes * clickMultiplier)

        // 단가 계산
        const unitPrice = agent.name === '류소영' ? 12000 :
                         agent.name === '김철수' ? 11000 :
                         agent.name === '임태현' ? 8000 :
                         10000

        totalClicks += monthlyClicks
        totalQuotes += monthlyQuotes
        totalCommission += monthlyQuotes * unitPrice
      }
    })

    return {
      totalClicks,
      totalQuotes,
      totalCommission,
      activeAgents,
      conversionRate: totalClicks > 0 ? ((totalQuotes / totalClicks) * 100).toFixed(1) : 0
    }
  }

  if (loading) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>정산 실적표를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const currentReport = reportData.find(r => r.isCurrentSettlement)
  const previousReports = reportData.filter(r => !r.isCurrentSettlement)

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '0'
    }}>
      {/* 네비게이션 헤더 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '20px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* 이전 화면으로 돌아가기 버튼 - 왼쪽에 위치 */}
            <Link href={`/admin/settlement?month=${viewingMonth}`} style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '10px 16px',
                background: 'rgba(108, 92, 231, 0.1)',
                color: '#6c5ce7',
                border: '2px solid #6c5ce7',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#6c5ce7'
                e.target.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(108, 92, 231, 0.1)'
                e.target.style.color = '#6c5ce7'
              }}
              >
                ← 이전 화면
              </button>
            </Link>

            {/* 중앙 제목 */}
            <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '2rem', fontWeight: 'bold' }}>
              📊 정산 실적표
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
              
              <Link href="/admin/settlement" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>💰 정산 관리</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* 현재 정산월 실적 */}
        {currentReport && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '30px'
          }}>
            {/* 현재 정산월 타이틀 */}
            <div style={{
              background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
              color: 'white',
              padding: '30px',
              textAlign: 'center'
            }}>
              {/* 월별 네비게이션 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '20px',
                marginBottom: '20px'
              }}>
                <button 
                  onClick={() => navigateMonth('prev')}
                  disabled={!canNavigatePrev()}
                  style={{
                    padding: '12px 16px',
                    background: canNavigatePrev() ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                    color: canNavigatePrev() ? 'white' : 'rgba(255,255,255,0.5)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    fontSize: '1.5rem',
                    cursor: canNavigatePrev() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (canNavigatePrev()) {
                      e.target.style.background = 'rgba(255,255,255,0.3)'
                      e.target.style.transform = 'scale(1.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canNavigatePrev()) {
                      e.target.style.background = 'rgba(255,255,255,0.2)'
                      e.target.style.transform = 'scale(1)'
                    }
                  }}
                >
                  ‹
                </button>

                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '10px', margin: 0 }}>
                    🎯 {currentReport.year}년 {currentReport.monthName} 정산 실적
                  </h2>
                  <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                    정산 대상월 ({currentReport.month})
                  </div>
                </div>

                <button 
                  onClick={() => navigateMonth('next')}
                  disabled={!canNavigateNext()}
                  style={{
                    padding: '12px 16px',
                    background: canNavigateNext() ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                    color: canNavigateNext() ? 'white' : 'rgba(255,255,255,0.5)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    fontSize: '1.5rem',
                    cursor: canNavigateNext() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (canNavigateNext()) {
                      e.target.style.background = 'rgba(255,255,255,0.3)'
                      e.target.style.transform = 'scale(1.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canNavigateNext()) {
                      e.target.style.background = 'rgba(255,255,255,0.2)'
                      e.target.style.transform = 'scale(1)'
                    }
                  }}
                >
                  ›
                </button>
              </div>
            </div>

            {/* 현재 월 통계 카드 */}
            <div style={{ padding: '30px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    {currentReport.totalClicks.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>총 접속수</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    {currentReport.totalQuotes.toLocaleString()}건
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>총 견적요청</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    ₩{currentReport.totalCommission.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>총 지급액</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    {currentReport.conversionRate}%
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>전환율</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 최근 3개월 추세 분석 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* 추세 분석 타이틀 */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '30px',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '10px', margin: 0 }}>
              📈 {viewingMonth ? viewingMonth.split('-')[0] : '2025'}년 연간 추세 분석
            </h2>
            <p style={{ fontSize: '1.1rem', margin: 0, opacity: 0.9 }}>
              1월~{viewingMonth ? parseInt(viewingMonth.split('-')[1]) : '10'}월 월별 성과 비교 및 트렌드 분석
            </p>
          </div>

          {/* 추세 테이블 */}
          <div style={{ padding: '30px' }}>
            <div style={{
              overflowX: 'auto',
              maxHeight: '320px', // 4개 행 정도 높이 (헤더 60px + 4행 × 65px)
              overflowY: 'auto',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              scrollbarWidth: 'thin', // Firefox
              scrollbarColor: '#c1c1c1 #f1f1f1' // Firefox
            }}
            className="custom-scrollbar">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>월</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>총 접속수</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>총 견적요청</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>전환율</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>총 지급액</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>활성 에이전트</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((report, index) => (
                    <tr key={report.month} style={{ 
                      borderBottom: '1px solid #e9ecef',
                      background: report.isCurrentSettlement ? '#fff3cd' : 
                                 index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      <td style={{ 
                        padding: '15px', 
                        textAlign: 'center', 
                        fontWeight: report.isCurrentSettlement ? 'bold' : 'normal',
                        color: report.isCurrentSettlement ? '#856404' : 'inherit'
                      }}>
                        {report.year}년 {report.monthName}
                        {report.isCurrentSettlement && (
                          <div style={{ fontSize: '0.7rem', color: '#856404' }}>정산 대상</div>
                        )}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#4facfe' }}>
                        {report.totalClicks.toLocaleString()}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#11998e' }}>
                        {report.totalQuotes.toLocaleString()}건
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#a29bfe' }}>
                        {report.conversionRate}%
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#fd79a8' }}>
                        ₩{report.totalCommission.toLocaleString()}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                        {report.activeAgents}명
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 추세 요약 */}
            <div style={{
              marginTop: '30px',
              padding: '20px',
              background: '#e3f2fd',
              borderRadius: '12px',
              border: '1px solid #bbdefb'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>📊 추세 분석 요약</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <strong>평균 전환율:</strong><br />
                  <span style={{ color: '#1976d2' }}>
                    {(reportData.reduce((sum, r) => sum + parseFloat(r.conversionRate), 0) / reportData.length).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <strong>월평균 지급액:</strong><br />
                  <span style={{ color: '#1976d2' }}>
                    ₩{Math.round(reportData.reduce((sum, r) => sum + r.totalCommission, 0) / reportData.length).toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong>총 누적 지급액(1월~{viewingMonth ? viewingMonth.split('-')[1] : '10'}월):</strong><br />
                  <span style={{ color: '#1976d2' }}>
                    ₩{reportData.reduce((sum, r) => sum + r.totalCommission, 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong>평균 활성 에이전트:</strong><br />
                  <span style={{ color: '#1976d2' }}>
                    {Math.round(reportData.reduce((sum, r) => sum + r.activeAgents, 0) / reportData.length)}명
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
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
      `}</style>
    </div>
  )
}
