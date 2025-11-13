import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalClicks: 0,
    totalQuotes: 0,
    conversionRate: 0
  })
  const [recentQuotes, setRecentQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRealTimeStats()
  }, [])

  const loadRealTimeStats = async () => {
    try {
      // localStorage에서 실제 에이전트 데이터 가져오기
      const savedAgents = JSON.parse(localStorage.getItem('mockAgents') || '[]')
      
      // 11월 통계 계산을 위한 더미 데이터 생성 (상세통계와 동일한 로직)
      const generateNovemberStats = () => {
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

        let totalQuotes = 0
        let totalClicks = 0

        agents.forEach(agent => {
          // 11월 견적요청 수 계산 (상세통계와 동일한 로직)
          const baseQuotes = agent.name === '류소영' ? 20 :
                            agent.name === '김철수' ? 15 :
                            agent.name === '이영희' ? 12 :
                            agent.name === '임태현' ? 3 :
                            8

          const seed = agent.agentId.charCodeAt(0) + agent.agentId.charCodeAt(1) + 11 // 11월
          const variation = (seed % 7) - 3
          const monthlyQuotes = Math.max(0, baseQuotes + variation)

          // 접속수 계산
          const clickMultiplier = agent.name === '류소영' ? 5 :
                                 agent.name === '김철수' ? 7 :
                                 agent.name === '임태현' ? 15 :
                                 8
          const monthlyClicks = Math.max(1, monthlyQuotes * clickMultiplier)

          totalQuotes += monthlyQuotes
          totalClicks += monthlyClicks
        })

        return {
          totalAgents: Math.max(savedAgents.length, agents.length),
          totalClicks,
          totalQuotes,
          conversionRate: totalClicks > 0 ? ((totalQuotes / totalClicks) * 100).toFixed(1) : 0
        }
      }

      const novemberStats = generateNovemberStats()
      setStats(novemberStats)

      // 최근 견적요청 예시 데이터 (실제 견적이 들어왔을 때 모습)
      const sampleQuotes = [
        {
          id: 'quote_001',
          customer_name: '김민수',
          customer_phone: '010-1234-5678',
          svc_type: '간판제작',
          area: '서울 강남구',
          agent_id: 'Ab3kM9',
          agent_name: '김철수',
          created_at: new Date().toISOString(), // 방금 전
          estimated_value: 850000
        },
        {
          id: 'quote_002', 
          customer_name: '박영희',
          customer_phone: '010-9876-5432',
          svc_type: '네온사인',
          area: '부산 해운대구',
          agent_id: 'Xy7nP2',
          agent_name: '이영희',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
          estimated_value: 1200000
        }
      ]
      setRecentQuotes(sampleQuotes)

    } catch (error) {
      console.error('11월 통계 로드 오류:', error)
      // 에러 시 0으로 초기화
      setStats({ totalAgents: 0, totalClicks: 0, totalQuotes: 0, conversionRate: 0 })
      setRecentQuotes([])
    } finally {
      setLoading(false)
    }
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
            이번 달 통계 (11월)
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
            }}>🕒</span>
            최근 견적요청
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
              <h4 style={{ margin: 0, color: '#495057' }}>📋 오늘의 견적요청</h4>
            </div>

            <div style={{ padding: '0' }}>
              {recentQuotes.length > 0 ? (
                recentQuotes.map((quote, index) => (
                  <div key={quote.id} style={{
                    padding: '20px',
                    borderBottom: index < recentQuotes.length - 1 ? '1px solid #e9ecef' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'white',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
                        {quote.customer_name ? quote.customer_name[0] : '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>
                          {quote.customer_name || '이름 없음'}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                          {quote.svc_type || '서비스 없음'} • {quote.area || '지역 미상'}
                        </div>
                        <div style={{ color: '#007bff', fontSize: '0.8rem', marginTop: '2px' }}>
                          👤 {quote.agent_name || '에이전트 미상'} • {new Date(quote.created_at).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  아직 견적요청이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* CTA 버튼 */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link href="/admin/agents" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '15px 40px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
                marginRight: '15px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.3)';
              }}>
                ✨ 첫 에이전트 생성하기
              </button>
            </Link>

            <Link href="/test-ganpoom" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '15px 40px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                fontSize: '1.1rem',
                fontWeight: '600',
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
                🧪 시스템 테스트하기
              </button>
            </Link>
          </div>
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
  )
}