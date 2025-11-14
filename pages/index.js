import Link from 'next/link'
import { useState, useEffect } from 'react'
import PasswordProtection from '../components/PasswordProtection'

export default function HomePage({
  initialStats,
  initialRecentQuotes,
  initialTodayQuotes
}) {
  const defaultStats = initialStats || {
    totalAgents: 0,
    totalClicks: 0,
    totalQuotes: 0,
    conversionRate: 0
  }

  const [stats, setStats] = useState(defaultStats)
  const [recentQuotes, setRecentQuotes] = useState(initialRecentQuotes || [])
  const [todayQuotes, setTodayQuotes] = useState(initialTodayQuotes || [])
  const [agentModal, setAgentModal] = useState({
    open: false,
    loading: false,
    data: null,
    error: ''
  })
  const [loading, setLoading] = useState(!initialStats)

  useEffect(() => {
    loadRealTimeStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 빈 배열로 한 번만 실행

  const loadRealTimeStats = async () => {
    try {
      // 실제 API에서 대시보드 통계 가져오기
      const response = await fetch('/api/stats/dashboard')
      
      if (response.ok) {
        const result = await response.json()
        
        // 실제 통계 데이터 설정
        setStats({
          totalAgents: result.stats.totalAgents,
          totalClicks: result.stats.totalClicks,
          totalQuotes: result.stats.totalQuotes,
          conversionRate: result.stats.conversionRate
        })
        
        // 최근 견적요청, 오늘 견적요청 설정
        setRecentQuotes(result.recentQuotes || [])
        setTodayQuotes(result.todayQuotes || [])
        
        setLoading(false)
        return
      } else {
        // API 호출 실패시 빈 데이터로 설정
        throw new Error('Dashboard API 호출 실패')
      }

    } catch (error) {
      console.error('통계 로드 오류:', error)
      // 에러 시 0으로 초기화
      setStats({ totalAgents: 0, totalClicks: 0, totalQuotes: 0, conversionRate: 0 })
      setRecentQuotes([])
      setTodayQuotes([])
    } finally {
      setLoading(false)
    }
  }

  const openAgentModal = async (agentId) => {
    setAgentModal({ open: true, loading: true, data: null, error: '' })
    try {
      const response = await fetch(`/api/agents/detail?id=${agentId}`)
      if (!response.ok) {
        throw new Error('에이전트 정보를 불러오는데 실패했습니다.')
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '에이전트 정보를 찾을 수 없습니다.')
      }
      setAgentModal({ open: true, loading: false, data: result.agent, error: '' })
    } catch (error) {
      console.error('에이전트 모달 로드 실패:', error)
      setAgentModal({ open: true, loading: false, data: null, error: error.message || '에러가 발생했습니다.' })
    }
  }

  const closeAgentModal = () => {
    setAgentModal({ open: false, loading: false, data: null, error: '' })
  }


  return (
    <PasswordProtection>
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
            🚀 Ganpoom Tracker
          </h1>
          <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>
            에이전트 링크 성과를 실시간으로 추적하고 자동 정산까지 관리하세요
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginTop: '20px'
          }}>
            <Link href="/admin/agents" style={{ 
              textDecoration: 'none',
              display: 'block',
              padding: '40px',
              background: '#4facfe',
              color: 'white',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '8px' }}>에이전트 관리</div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>새 에이전트 생성 및 관리</div>
            </Link>

            <Link href="/admin/analytics" style={{ 
              textDecoration: 'none',
              display: 'block',
              padding: '40px',
              background: '#11998e',
              color: 'white',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '8px' }}>상세 통계</div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>월별/일별 상세 분석</div>
            </Link>

            <Link href="/admin/settlement" style={{ 
              textDecoration: 'none',
              display: 'block',
              padding: '40px',
              background: '#fd79a8',
              color: 'white',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💰</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '8px' }}>정산 관리</div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>월별 커미션 정산</div>
            </Link>


          </div>
        </div>

        {/* 실시간 통계 */}
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
            이번 달 통계 ({new Date().toLocaleDateString('ko-KR', { month: 'long' })})
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            marginTop: '20px'
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
              <div style={{ fontSize: '0.9rem', color: '#666' }}>총 접속</div>
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
              }}>{stats.totalQuotes}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>견적 요청</div>
            </div>

          </div>
        </div>

        {/* 최근 활동 */}
        <div style={{
          padding: '30px'
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
            오늘의 견적요청 건수
          </h2>

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
              <h4 style={{ margin: 0, color: '#495057' }}>📊 에이전트별 견적요청 건수</h4>
            </div>

            <div style={{ padding: '0' }}>
              {/* 스크롤 가능한 테이블 영역 */}
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #e9ecef',
                borderRadius: '0 0 12px 12px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '0.9rem', color: '#666' }}>순위</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '0.9rem', color: '#666' }}>에이전트</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '0.9rem', color: '#666' }}>견적요청</th>
                    </tr>
                  </thead>
                  <tbody>
                      {todayQuotes.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ 
                        padding: '40px', 
                        textAlign: 'center', 
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        아직 오늘 접수된 견적요청이 없습니다.<br/>
                        에이전트를 통해 견적요청이 들어오면 자동으로 표시됩니다.
                      </td>
                    </tr>
                    ) : (
                      todayQuotes.map((agent, index) => (
                        <tr
                          key={agent.agentId}
                          style={{ cursor: 'pointer' }}
                          onClick={() => openAgentModal(agent.agentId)}
                        >
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>{index + 1}</td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', color: '#007bff', fontWeight: 'bold' }}>{agent.name}</td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', textAlign: 'center', fontWeight: 'bold' }}>
                            {agent.quotes}
                      </td>
                    </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 총합 요약 - 실제 데이터 기반 */}
              {todayQuotes.length > 0 && (
                <div style={{
                  padding: '15px 20px',
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                  borderTop: '2px solid #28a745',
                  borderRadius: '0 0 12px 12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontWeight: 'bold',
                    color: '#155724',
                    fontSize: '1rem'
                  }}>
                    <span>💡</span>
                    <span>
                      오늘 총 {todayQuotes.reduce((sum, agent) => sum + agent.quotes, 0)}건의 견적요청이 접수되었습니다
                      (참여 에이전트: {todayQuotes.length}명)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 빠른 액션 버튼 */}
        <div style={{
          padding: '30px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            <Link href="/admin/agents" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                border: '1px solid rgba(79, 172, 254, 0.2)'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '15px'
                }}>👥</div>
                <h3 style={{
                  margin: '0 0 10px 0',
                  color: '#2c3e50',
                  fontSize: '1.3rem'
                }}>에이전트 관리</h3>
                <p style={{
                  margin: 0,
                  color: '#7f8c8d',
                  fontSize: '0.9rem'
                }}>새 에이전트 생성 및 관리</p>
              </div>
            </Link>

            <Link href="/admin/analytics" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                border: '1px solid rgba(17, 153, 142, 0.2)'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '15px'
                }}>📊</div>
                <h3 style={{
                  margin: '0 0 10px 0',
                  color: '#2c3e50',
                  fontSize: '1.3rem'
                }}>상세 통계</h3>
                <p style={{
                  margin: 0,
                  color: '#7f8c8d',
                  fontSize: '0.9rem'
                }}>월별/일별 상세 분석</p>
              </div>
            </Link>

            <Link href="/admin/settlement" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                border: '1px solid rgba(253, 121, 168, 0.2)'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '15px'
                }}>💰</div>
                <h3 style={{
                  margin: '0 0 10px 0',
                  color: '#2c3e50',
                  fontSize: '1.3rem'
                }}>정산 관리</h3>
                <p style={{
                  margin: 0,
                  color: '#7f8c8d',
                  fontSize: '0.9rem'
                }}>월별 커미션 정산</p>
            </div>
            </Link>
          </div>

          {stats.totalAgents === 0 && (
            <div style={{
              marginTop: '40px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '2px dashed #4facfe'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '20px'
              }}>🚀</div>
              <h2 style={{
                margin: '0 0 15px 0',
                color: '#2c3e50',
                fontSize: '1.8rem'
              }}>Ganpoom 트래킹 시작하기</h2>
              <p style={{
                margin: '0 0 30px 0',
                color: '#7f8c8d',
                fontSize: '1rem',
                lineHeight: 1.6
              }}>
                아직 등록된 에이전트가 없습니다.<br/>
                첫 번째 에이전트를 생성해서 추적을 시작하세요!
              </p>
            <Link href="/admin/agents" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '15px 40px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)'
              }}>
                ✨ 첫 에이전트 생성하기
              </button>
            </Link>
          </div>
          )}
        </div>
      </div>


      <style jsx>{`
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
      {agentModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={closeAgentModal}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
              maxWidth: '500px',
            width: '90%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h3 style={{ marginTop: 0, color: '#333', marginBottom: '20px' }}>에이전트 상세 정보</h3>
            {agentModal.loading ? (
              <p>불러오는 중...</p>
            ) : agentModal.error ? (
              <p style={{ color: 'red' }}>{agentModal.error}</p>
            ) : agentModal.data ? (
              <>
                <div style={{ marginBottom: '15px' }}>
                  <strong>이름:</strong> {agentModal.data.name}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>전화번호:</strong> {agentModal.data.phone}
                </div>
                {agentModal.data.email && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>이메일:</strong> {agentModal.data.email}
                  </div>
                )}
                <div style={{ marginBottom: '15px' }}>
                  <strong>계좌번호:</strong> {agentModal.data.account_number || '미등록'}
                </div>
                {agentModal.data.memo && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>메모:</strong> {agentModal.data.memo}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    flex: 1,
                    background: '#e3f2fd',
                    borderRadius: '12px',
                    padding: '15px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
                      {agentModal.data.totalClicks || 0}
                </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>총 접속수</div>
              </div>
                  <div style={{
                    flex: 1,
                    background: '#fff3e0',
                    borderRadius: '12px',
                    padding: '15px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f57c00' }}>
                      {agentModal.data.totalQuotes || 0}
              </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>총 견적요청</div>
            </div>
            <div style={{
                    flex: 1,
              background: '#e8f5e8',
              borderRadius: '12px',
                    padding: '15px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
                      {agentModal.data.todayQuotes || 0}
                </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>오늘 견적요청</div>
                  </div>
                </div>
              <button
                  onClick={closeAgentModal}
                style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </PasswordProtection>
  )
}

export async function getServerSideProps(context) {
  const protocol = context.req.headers['x-forwarded-proto'] || 'http'
  const host = context.req.headers['host']

  try {
    const response = await fetch(`${protocol}://${host}/api/stats/dashboard`, {
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Dashboard API 호출 실패')
    }

    const result = await response.json()

    return {
      props: {
        initialStats: result.stats || null,
        initialRecentQuotes: result.recentQuotes || [],
        initialTodayQuotes: result.todayQuotes || []
      }
    }
  } catch (error) {
    console.error('SSR 대시보드 로드 오류:', error)
    return {
      props: {
        initialStats: null,
        initialRecentQuotes: [],
        initialTodayQuotes: []
      }
    }
  }
}