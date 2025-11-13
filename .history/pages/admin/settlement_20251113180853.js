import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SettlementPage() {
  const [currentMonth, setCurrentMonth] = useState('')
  const [settlementMonth, setSettlementMonth] = useState('')
  const [settlementData, setSettlementData] = useState([])
  const [totalCommission, setTotalCommission] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 현재 월과 정산 대상 월 설정
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // 1-based

    setCurrentMonth(`${year}-${month.toString().padStart(2, '0')}`)
    
    // 정산 대상월 = 전월
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    setSettlementMonth(`${prevYear}-${prevMonth.toString().padStart(2, '0')}`)

    loadSettlementData(`${prevYear}-${prevMonth.toString().padStart(2, '0')}`)
  }, [])

  const loadSettlementData = (targetMonth) => {
    try {
      setLoading(true)
      
      // 정산 대상 에이전트들 (실제로는 DB에서 가져올 데이터)
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

      // 정산 대상월의 실적 계산
      const monthNum = parseInt(targetMonth.split('-')[1])
      const settlementList = agents.map(agent => {
        // 해당 월 견적요청 수 계산 (상세통계와 동일한 로직)
        const baseQuotes = agent.name === '류소영' ? 20 :
                          agent.name === '김철수' ? 15 :
                          agent.name === '이영희' ? 12 :
                          agent.name === '임태현' ? 3 :
                          8

        const seed = agent.agentId.charCodeAt(0) + agent.agentId.charCodeAt(1) + monthNum
        const variation = (seed % 7) - 3
        const monthlyQuotes = Math.max(0, baseQuotes + variation)
        // 에이전트별 단가 설정 (실제로는 DB에서 가져올 데이터)
        const unitPrice = agent.name === '류소영' ? 12000 : // 우수 에이전트
                         agent.name === '김철수' ? 11000 : // 베테랑 에이전트
                         agent.name === '임태현' ? 8000 :  // 신입 에이전트
                         10000 // 기본 단가

        const commission = monthlyQuotes * unitPrice

        return {
          agentId: agent.agentId,
          name: agent.name,
          phone: '010-0000-0000', // 실제로는 DB에서 가져올 데이터
          account: '국민은행 123-456-789012', // 실제로는 DB에서 가져올 데이터
          quotes: monthlyQuotes,
          unitPrice: unitPrice,
          commission: commission,
          settlementMonth: targetMonth,
          isSettled: false // 실제로는 DB에서 정산 완료 여부 확인
        }
      }).filter(agent => agent.quotes > 0) // 실적이 있는 에이전트만

      // 커미션 총액 계산
      const total = settlementList.reduce((sum, agent) => sum + agent.commission, 0)
      
      setSettlementData(settlementList)
      setTotalCommission(total)
    } catch (error) {
      console.error('정산 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettlement = (agentId) => {
    if (window.confirm('정산을 완료하시겠습니까?\n\n완료 후에는 되돌릴 수 없습니다.')) {
      // 실제로는 DB 업데이트
      setSettlementData(prev => 
        prev.map(agent => 
          agent.agentId === agentId 
            ? { ...agent, isSettled: true }
            : agent
        )
      )
      alert('✅ 정산이 완료되었습니다.')
    }
  }

  const handleBulkSettlement = () => {
    const unsettledCount = settlementData.filter(agent => !agent.isSettled).length
    if (unsettledCount === 0) {
      alert('정산할 대상이 없습니다.')
      return
    }

    if (window.confirm(`${unsettledCount}명의 에이전트를 일괄 정산하시겠습니까?\n\n총 지급액: ₩${settlementData.filter(agent => !agent.isSettled).reduce((sum, agent) => sum + agent.commission, 0).toLocaleString()}`)) {
      setSettlementData(prev => 
        prev.map(agent => ({ ...agent, isSettled: true }))
      )
      alert('✅ 일괄 정산이 완료되었습니다.')
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
            <h2 style={{ fontSize: '2.5rem', marginBottom: '15px', margin: 0 }}>
              💰 정산 관리
            </h2>
            <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>
              {settlementMonth.split('-')[1]}월 정산 ({settlementMonth.split('-')[0]}년 {settlementMonth.split('-')[1]}월 1일 ~ {settlementMonth.split('-')[1]}월 말일)
            </p>
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
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
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
            </div>

            {/* 정산 목록 */}
            {settlementData.length > 0 ? (
              <div style={{
                overflowX: 'auto',
                border: '1px solid #e9ecef',
                borderRadius: '12px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>에이전트</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>견적요청</th>
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
      `}</style>
    </div>
  )
}
