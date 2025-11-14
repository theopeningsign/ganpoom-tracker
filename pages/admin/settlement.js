import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function SettlementPage() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState('')
  const [settlementMonth, setSettlementMonth] = useState('')
  const [viewingMonth, setViewingMonth] = useState('') // 현재 보고 있는 정산월
  const [settlementData, setSettlementData] = useState([])
  const [totalCommission, setTotalCommission] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    // 현재 월과 정산 대상 월 설정
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // 1-based

    setCurrentMonth(`${year}-${month.toString().padStart(2, '0')}`)
    
    // 정산 대상월 = 전월
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const defaultTargetMonth = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`
    
    setSettlementMonth(defaultTargetMonth)

    // URL 파라미터에서 month 확인
    const { month: urlMonth } = router.query
    const targetMonth = urlMonth || defaultTargetMonth
    
    setViewingMonth(targetMonth)
    loadSettlementData(targetMonth)
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
      const [currentYear, currentSettlementMonth] = settlementMonth.split('-').map(Number)
      if (year < currentYear || (year === currentYear && month < currentSettlementMonth)) {
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
    loadSettlementData(newViewingMonth)
  }

  const canNavigateNext = () => {
    const [viewYear, viewMonth] = viewingMonth.split('-').map(Number)
    const [settleYear, settleMonth] = settlementMonth.split('-').map(Number)
    
    return viewYear < settleYear || (viewYear === settleYear && viewMonth < settleMonth)
  }

  const canNavigatePrev = () => {
    // 2025년 1월까지만 갈 수 있음 (시스템 시작 시점)
    const [viewYear, viewMonth] = viewingMonth.split('-').map(Number)
    return viewYear > 2025 || (viewYear === 2025 && viewMonth > 1)
  }

  const loadSettlementData = async (targetMonth) => {
    try {
      setLoading(true)
      
      // 실제 API에서 정산 데이터 가져오기
      const response = await fetch(`/api/stats/settlement?month=${targetMonth}`)
      
      if (response.ok) {
        const result = await response.json()
        
        setSettlementData(result.settlementData || [])
        setTotalCommission(result.stats?.totalCommission || 0)
      } else {
        throw new Error('정산 데이터 API 호출 실패')
      }
    } catch (error) {
      console.error('정산 데이터 로드 오류:', error)
      // 실패시 빈 데이터로 설정
      setSettlementData([])
      setTotalCommission(0)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type, text) => {
    setStatusMessage({ type, text })
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000)
  }

  const handleSettlement = async (agentId) => {
    if (window.confirm('정산을 완료하시겠습니까?\n\n완료 후에는 되돌릴 수 없습니다.')) {
      try {
        const response = await fetch('/api/settlement/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId,
            month: viewingMonth,
            isBulk: false
          }),
        })

        if (response.ok) {
          showMessage('success', '✅ 정산이 완료되었습니다.')
          // 데이터 새로고침
          loadSettlementData(viewingMonth)
        } else {
          throw new Error('정산 처리 실패')
        }
      } catch (error) {
        console.error('정산 처리 오류:', error)
        showMessage('error', '정산 처리에 실패했습니다.')
      }
    }
  }

  const handleBulkSettlement = async () => {
    const unsettledCount = settlementData.filter(agent => !agent.isSettled).length
    if (unsettledCount === 0) {
      showMessage('warning', '정산할 대상이 없습니다.')
      return
    }

    const totalAmount = settlementData
      .filter(agent => !agent.isSettled)
      .reduce((sum, agent) => sum + agent.commission, 0)

    if (window.confirm(`${unsettledCount}명의 에이전트를 일괄 정산하시겠습니까?\n\n총 지급액: ₩${totalAmount.toLocaleString()}`)) {
      try {
        // 각 에이전트별로 정산 처리
        const settlementPromises = settlementData
          .filter(agent => !agent.isSettled)
          .map(agent => 
            fetch('/api/settlement/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                agentId: agent.agentId,
                month: viewingMonth,
                isBulk: true
              }),
            })
          )

        const results = await Promise.all(settlementPromises)
        const allSuccess = results.every(r => r.ok)

        if (allSuccess) {
          showMessage('success', `✅ ${unsettledCount}명의 에이전트 일괄 정산이 완료되었습니다.`)
          // 데이터 새로고침
          loadSettlementData(viewingMonth)
        } else {
          throw new Error('일부 정산 처리 실패')
        }
      } catch (error) {
        console.error('일괄 정산 오류:', error)
        showMessage('error', '일괄 정산 처리에 실패했습니다.')
      }
    }
  }

  // 단가 조정 (해당 에이전트의 모든 견적요청의 commission_amount를 일괄 업데이트)
  const handleUnitPriceChange = async (agentId) => {
    const agent = settlementData.find(a => a.agentId === agentId)
    if (!agent) return
    
    const currentAvgPrice = agent.quotes > 0 ? Math.round(agent.commission / agent.quotes) : 10000
    const newPrice = prompt(`${agent.name}의 단가를 입력하세요 (현재 평균: ₩${currentAvgPrice.toLocaleString()})`, currentAvgPrice)
    
    if (newPrice && !isNaN(newPrice) && parseInt(newPrice) > 0) {
      try {
        const updatedPrice = parseInt(newPrice)
        
        // 해당 에이전트의 해당 월 모든 미정산 견적요청의 commission_amount 업데이트
        const [year, monthNum] = viewingMonth.split('-').map(Number)
        const startDate = `${viewingMonth}-01 00:00:00`
        const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0] + ' 23:59:59'
        
        const response = await fetch('/api/settlement/update-commission', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId,
            month: viewingMonth,
            commissionAmount: updatedPrice
          }),
        })

        if (response.ok) {
          showMessage('success', `✅ ${agent.name}의 단가가 ₩${updatedPrice.toLocaleString()}으로 변경되었습니다.`)
          // 데이터 새로고침
          loadSettlementData(viewingMonth)
        } else {
          throw new Error('단가 변경 실패')
        }
      } catch (error) {
        console.error('단가 변경 오류:', error)
        showMessage('error', '단가 변경에 실패했습니다.')
      }
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
          <p>정산 데이터를 불러오는 중...</p>
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
      {/* 네비게이션 헤더 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '20px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '2rem', fontWeight: 'bold' }}>
              💰 정산 관리
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
                }}>👥 에이전트 관리</button>
              </Link>

              <Link href="/admin/analytics" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>📊 상세 통계</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 상태 메시지 */}
      {statusMessage.text && (
        <div style={{
          position: 'fixed',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '15px 25px',
          borderRadius: '10px',
          background: statusMessage.type === 'success' ? 
            'linear-gradient(135deg, #28a745, #20c997)' : 
            statusMessage.type === 'warning' ?
            'linear-gradient(135deg, #ffc107, #ff9800)' :
            'linear-gradient(135deg, #dc3545, #e74c3c)',
          color: 'white',
          fontWeight: 'bold',
          boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {statusMessage.text}
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* 페이지 타이틀 */}
          <div style={{
            background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
            color: 'white',
            padding: '40px',
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
                <h2 style={{ fontSize: '2.5rem', marginBottom: '10px', margin: 0 }}>
                  💰 정산 관리
                </h2>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  {viewingMonth.split('-')[0]}년 {viewingMonth.split('-')[1]}월 정산
                </div>
                <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                  ({viewingMonth.split('-')[0]}년 {viewingMonth.split('-')[1]}월 1일 ~ {viewingMonth.split('-')[1]}월 말일)
                </div>
                {viewingMonth === settlementMonth && (
                  <div style={{ 
                    fontSize: '0.9rem', 
                    marginTop: '8px',
                    padding: '4px 12px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '20px',
                    display: 'inline-block'
                  }}>
                    📍 현재 정산 대상월
                  </div>
                )}
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

          {/* 정산 요약 */}
          <div style={{ padding: '30px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  {settlementData.length}명
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>정산 대상</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  ₩{totalCommission.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>총 지급액</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  {settlementData.filter(agent => agent.isSettled).length}명
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>정산 완료</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  {settlementData.filter(agent => !agent.isSettled).length}명
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>정산 대기</div>
              </div>
            </div>

            {/* 일괄 정산 버튼 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '20px', 
              marginBottom: '30px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleBulkSettlement}
                style={{
                  padding: '15px 40px',
                  background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(253, 121, 168, 0.3)'
                }}
              >
                💰 전체 일괄 정산
              </button>

              <Link href={`/admin/settlement-report?month=${viewingMonth}`} style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    padding: '15px 40px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  📊 정산 실적표
                </button>
              </Link>
            </div>

            {/* 정산 목록 */}
            {settlementData.length > 0 ? (
              <div style={{
                overflowX: 'auto',
                maxHeight: '480px', // 6개 행 정도 높이 (헤더 60px + 6행 × 70px)
                overflowY: 'auto',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                scrollbarWidth: 'thin', // Firefox
                scrollbarColor: '#c1c1c1 #f1f1f1' // Firefox
              }}
              className="custom-scrollbar settlement-table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>에이전트</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>견적요청</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>단가</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>커미션</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>계좌정보</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>상태</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementData.map((agent, index) => (
                      <tr key={agent.agentId} style={{ 
                        borderBottom: '1px solid #e9ecef',
                        background: index % 2 === 0 ? 'white' : '#f8f9fa'
                      }}>
                        <td style={{ padding: '15px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{agent.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>ID: {agent.agentId}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{agent.phone}</div>
                          </div>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {agent.quotes}건
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              background: ((agent.commission / agent.quotes) || 10000) === 10000 ? '#6c757d' : 
                                         ((agent.commission / agent.quotes) || 10000) > 10000 ? '#28a745' : '#fd7e14',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '0.85rem'
                            }}>
                              ₩{((agent.commission / agent.quotes) || 10000).toLocaleString()}
                            </span>
                            {!agent.isSettled && (
                              <button
                                onClick={() => handleUnitPriceChange(agent.agentId)}
                                style={{
                                  padding: '4px 8px',
                                  background: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer'
                                }}
                              >
                                조정
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#28a745', fontSize: '1.1rem' }}>
                          ₩{agent.commission.toLocaleString()}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                          {agent.account}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          {agent.isSettled ? (
                            <span style={{
                              background: '#28a745',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>✓ 완료</span>
                          ) : (
                            <span style={{
                              background: '#ffc107',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>⏳ 대기</span>
                          )}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          {!agent.isSettled && (
                            <button
                              onClick={() => handleSettlement(agent.agentId)}
                              style={{
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              정산하기
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💰</div>
                <h3 style={{ marginBottom: '10px' }}>정산할 대상이 없습니다</h3>
                <p>{settlementMonth} 기간 중 견적요청 실적이 있는 에이전트가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideDown {
          0% { 
            transform: translate(-50%, -20px);
            opacity: 0;
          }
          100% { 
            transform: translate(-50%, 0);
            opacity: 1;
          }
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
