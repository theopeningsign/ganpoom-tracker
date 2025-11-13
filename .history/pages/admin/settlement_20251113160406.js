import { useState, useEffect } from 'react'
import Link from 'next/link'
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

  if (loading) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        padding: '20px',
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
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        {/* 헤더 */}
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '15px', margin: 0 }}>
            💰 정산 관리
          </h1>
          <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>
            에이전트별 견적요청 커미션을 월별로 정산합니다
          </p>
        </div>

        {/* 네비게이션 메뉴 */}
        <div style={{
          padding: '30px',
          borderBottom: '1px solid #eee',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px',
            marginBottom: '25px'
          }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '15px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
              }}>
                🏠 홈
              </div>
            </Link>

            <Link href="/admin/agents" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '15px 20px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                borderRadius: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.3)';
              }}>
                👥 에이전트 관리
              </div>
            </Link>

            <Link href="/admin/test" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '15px 20px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                borderRadius: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(240, 147, 251, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(240, 147, 251, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(240, 147, 251, 0.3)';
              }}>
                📊 대시보드
              </div>
            </Link>

            <Link href="/test-ganpoom" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '15px 20px',
                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                color: '#8B4513',
                borderRadius: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(252, 182, 159, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(252, 182, 159, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(252, 182, 159, 0.3)';
              }}>
                🧪 테스트
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center' }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
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
              style={{
                padding: '12px 20px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {loading ? '로딩...' : '🔄 새로고침'}
            </button>
          </div>
        </div>

        {/* 월별 요약 통계 */}
        <div style={{
          padding: '30px',
          borderBottom: '1px solid #eee'
        }}>
          <h2 style={{
            color: '#333',
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{
              background: '#4facfe',
              color: 'white',
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>📊</span>
            {selectedMonth} 정산 요약
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '25px 15px',
              background: '#e3f2fd',
              borderRadius: '12px',
              border: '2px solid #bbdefb'
            }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#1976d2',
                marginBottom: '8px'
              }}>{settlements.length}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>정산 대상 에이전트</div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '25px 15px',
              background: '#e8f5e8',
              borderRadius: '12px',
              border: '2px solid #c8e6c9'
            }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#388e3c',
                marginBottom: '8px'
              }}>{totalQuotes}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>총 견적요청</div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '25px 15px',
              background: '#fff3e0',
              borderRadius: '12px',
              border: '2px solid #ffcc02'
            }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#f57c00',
                marginBottom: '8px'
              }}>{formatCurrency(totalCommission)}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>총 커미션</div>
            </div>
          </div>
        </div>

        {/* 정산 목록 */}
        <div style={{ padding: '30px' }}>
          <h2 style={{
            color: '#333',
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{
              background: '#4facfe',
              color: 'white',
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>📋</span>
            에이전트별 정산 내역
          </h2>

          {settlements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📊</div>
              <h3 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '10px' }}>
                정산 내역이 없습니다
              </h3>
              <p style={{ color: '#666', marginBottom: '30px' }}>
                선택한 월에 견적요청이 있는 에이전트가 없습니다.
              </p>
            </div>
          ) : (
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderBottom: '1px solid #dee2e6'
              }}>
                <h4 style={{ margin: 0, color: '#495057' }}>💰 정산 대상 목록</h4>
              </div>
              
              {settlements.map((settlement, index) => (
                <div key={settlement.id} style={{
                  padding: '20px',
                  borderBottom: index < settlements.length - 1 ? '1px solid #e9ecef' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'white',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}>
                      {settlement.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{settlement.name}</h3>
                        <div style={{
                          padding: '2px 8px',
                          background: settlement.isSettled ? '#28a745' : '#ffc107',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          {settlement.isSettled ? '정산완료' : '정산대기'}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '3px' }}>
                        {settlement.memo || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#999' }}>
                        견적요청 {settlement.quoteCount}건 × 10,000원
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
                        {formatCurrency(settlement.totalCommission)}
                      </div>
                      {!settlement.isSettled && (
                        <button
                          onClick={() => handleSettle(settlement.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          정산 완료
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 정산 정책 안내 */}
        <div style={{
          margin: '30px',
          background: '#e3f2fd',
          border: '2px solid #bbdefb',
          borderRadius: '12px',
          padding: '25px'
        }}>
          <h3 style={{ fontSize: '1.3rem', color: '#1976d2', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💡 정산 정책
          </h3>
          <div style={{ color: '#1565c0', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 8px 0' }}>• <strong>커미션 금액:</strong> 견적요청당 고정 10,000원</p>
            <p style={{ margin: '0 0 8px 0' }}>• <strong>정산 주기:</strong> 매월 말일 기준으로 정산</p>
            <p style={{ margin: '0 0 8px 0' }}>• <strong>정산 방법:</strong> 에이전트가 제공한 계좌로 이체</p>
            <p style={{ margin: 0 }}>• <strong>정산 기준:</strong> 실제 견적요청이 접수된 건만 인정</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}