import { useState, useEffect } from 'react'
import Link from 'next/link'
import { generateMockStats, generateMockAgentStats, mockQuoteRequests } from '../../lib/mock-data'

export default function TestAdminDashboard() {
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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMockData()
    
    // 5초마다 데이터 새로고침 (실시간 시뮬레이션)
    const interval = setInterval(loadMockData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadMockData = () => {
    setLoading(true)
    
    try {
      // Mock 통계 데이터
      const mockStats = generateMockStats()
      setStats(mockStats)

      // Mock 최근 견적요청
      const sortedQuotes = [...mockQuoteRequests]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
        .map(quote => ({
          ...quote,
          agents: { name: getAgentName(quote.agent_id) }
        }))
      setRecentQuotes(sortedQuotes)

      // Mock 상위 에이전트
      const agentStats = generateMockAgentStats()
      setTopAgents(agentStats.slice(0, 10))

    } catch (error) {
      console.error('Mock 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAgentName = (agentId) => {
    const agentNames = {
      'Ab3kM9': '김철수',
      'Xy7nP2': '이영희',
      'Qw8rT5': '박민수'
    }
    return agentNames[agentId] || 'Unknown'
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
          <p>대시보드 데이터를 불러오는 중...</p>
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
        maxWidth: '1400px',
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
            📊 대시보드
          </h1>
          <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>
            실시간 통계와 성과 분석을 확인하세요
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

          <button 
            onClick={loadMockData}
            disabled={loading}
            style={{
              padding: '12px 20px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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

        {/* 테스트 안내 */}
        <div style={{
          margin: '30px',
          background: '#e3f2fd',
          border: '2px solid #bbdefb',
          borderRadius: '12px',
          padding: '25px'
        }}>
          <h3 style={{ fontSize: '1.3rem', color: '#1976d2', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧪 테스트 환경
          </h3>
          <div style={{ color: '#1565c0', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 8px 0' }}>• 이 페이지는 Mock 데이터를 사용하여 실제 시스템과 동일한 기능을 테스트할 수 있습니다.</p>
            <p style={{ margin: '0 0 8px 0' }}>• <strong>에이전트 관리</strong>에서 새 에이전트를 생성하고, <strong>테스트 페이지</strong>에서 견적요청을 해보세요.</p>
            <p style={{ margin: 0 }}>• 실시간으로 데이터가 업데이트되는 것을 확인할 수 있습니다.</p>
          </div>
        </div>

        {/* 주요 통계 카드 */}
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
            }}>📈</span>
            실시간 통계
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
              }}>{stats.totalAgents}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>총 에이전트</div>
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
              }}>{stats.totalClicks.toLocaleString()}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>총 클릭</div>
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
              }}>{stats.totalQuotes.toLocaleString()}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>견적요청</div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '25px 15px',
              background: '#fce4ec',
              borderRadius: '12px',
              border: '2px solid #f8bbd9'
            }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#c2185b',
                marginBottom: '8px'
              }}>{stats.conversionRate}%</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>전환율</div>
            </div>
          </div>
        </div>

        {/* 최근 견적요청 & 상위 에이전트 */}
        <div style={{
          padding: '30px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px'
        }}>
          {/* 최근 견적요청 */}
          <div>
            <h2 style={{
              color: '#333',
              marginBottom: '20px',
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
              최근 견적요청
            </h2>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                padding: '15px 20px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderBottom: '1px solid #dee2e6'
              }}>
                <h4 style={{ margin: 0, color: '#495057', fontSize: '0.9rem' }}>💌 최근 10건</h4>
              </div>
              
              {recentQuotes.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  아직 견적요청이 없습니다.
                </div>
              ) : (
                recentQuotes.slice(0, 5).map((quote, index) => (
                  <div key={quote.id} style={{
                    padding: '15px 20px',
                    borderBottom: index < 4 ? '1px solid #e9ecef' : 'none',
                    background: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '3px' }}>
                        {quote.agents?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {quote.svc_type || 'N/A'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#28a745' }}>
                        {formatCurrency(quote.estimated_value || 0)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#999' }}>
                        {formatDate(quote.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 상위 에이전트 */}
          <div>
            <h2 style={{
              color: '#333',
              marginBottom: '20px',
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
              }}>🏆</span>
              상위 에이전트
            </h2>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                padding: '15px 20px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderBottom: '1px solid #dee2e6'
              }}>
                <h4 style={{ margin: 0, color: '#495057', fontSize: '0.9rem' }}>👑 성과 순위</h4>
              </div>
              
              {topAgents.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  아직 에이전트가 없습니다.
                </div>
              ) : (
                topAgents.slice(0, 5).map((agent, index) => (
                  <div key={agent.id} style={{
                    padding: '15px 20px',
                    borderBottom: index < 4 ? '1px solid #e9ecef' : 'none',
                    background: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#4facfe',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}>
                        #{index + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '3px' }}>
                          {agent.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {agent.clicks} 클릭 / {agent.quotes} 전환
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#28a745' }}>
                        {formatCurrency(agent.commission)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#4facfe' }}>
                        {agent.conversionRate}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 테스트 액션 버튼들 */}
        <div style={{
          padding: '30px',
          background: '#f8f9fa',
          borderTop: '1px solid #e9ecef'
        }}>
          <h2 style={{
            color: '#333',
            marginBottom: '20px',
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
            }}>🧪</span>
            테스트 액션
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            <Link href="/admin/agents" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '20px',
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
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>👥</div>
                <div style={{ fontWeight: 'bold' }}>에이전트 생성하기</div>
              </div>
            </Link>

            <Link href="/test-ganpoom" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                borderRadius: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(17, 153, 142, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(17, 153, 142, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(17, 153, 142, 0.3)';
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🌐</div>
                <div style={{ fontWeight: 'bold' }}>테스트 페이지 방문</div>
              </div>
            </Link>

            <button
              onClick={() => {
                const agentId = 'Ab3kM9' // 기본 테스트 에이전트
                const testLink = `${window.location.origin}/test-ganpoom?ref=${agentId}`
                window.open(testLink, '_blank')
              }}
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                border: 'none',
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
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔗</div>
              <div style={{ fontWeight: 'bold' }}>추적 링크로 테스트</div>
            </button>
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