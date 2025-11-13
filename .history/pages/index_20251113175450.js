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
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)

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
          svc_type: '간판',
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
          svc_type: '현수막',
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

  // 에이전트 클릭 핸들러
  const handleAgentClick = (agentName) => {
    // 상세통계와 동일한 로직으로 에이전트 정보 생성
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

    const agent = agents.find(a => a.name === agentName)
    if (!agent) return

    // 6개월 통계 생성 (6월~11월)
    const monthlyStats = []
    for (let month = 6; month <= 11; month++) {
      const baseQuotes = agent.name === '류소영' ? 20 :
                        agent.name === '김철수' ? 15 :
                        agent.name === '이영희' ? 12 :
                        agent.name === '임태현' ? 3 :
                        8

      const seed = agent.agentId.charCodeAt(0) + agent.agentId.charCodeAt(1) + month
      const variation = (seed % 7) - 3
      const monthlyQuotes = Math.max(0, baseQuotes + variation)

      monthlyStats.push({
        month: `2025-${month.toString().padStart(2, '0')}`,
        quotes: monthlyQuotes
      })
    }

    // 현재 월 (11월) 성과
    const currentMonthQuotes = monthlyStats[5].quotes // 11월 데이터
    const clickMultiplier = agent.name === '류소영' ? 5 :
                           agent.name === '김철수' ? 7 :
                           agent.name === '임태현' ? 15 :
                           8
    const currentMonthClicks = Math.max(1, currentMonthQuotes * clickMultiplier)

    setSelectedAgent({
      agentId: agent.agentId,
      name: agent.name,
      quotes: currentMonthQuotes,
      clicks: currentMonthClicks,
      commission: currentMonthQuotes * 10000,
      monthlyStats: monthlyStats
    })
    setShowAgentModal(true)
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
                    <tr style={{ background: 'white', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#ffd700' }}>🥇 1위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#4facfe', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>김</div>
                          <span 
                            style={{ fontWeight: 'bold', cursor: 'pointer', color: '#007bff' }}
                            onClick={() => handleAgentClick('김철수')}
                          >김철수</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#28a745' }}>5건</td>
                    </tr>
                    <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#c0c0c0' }}>🥈 2위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#11998e', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>이</div>
                          <span 
                            style={{ fontWeight: 'bold', cursor: 'pointer', color: '#007bff' }}
                            onClick={() => handleAgentClick('이영희')}
                          >이영희</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#28a745' }}>4건</td>
                    </tr>
                    <tr style={{ background: 'white', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#cd7f32' }}>🥉 3위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#667eea', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>류</div>
                          <span 
                            style={{ fontWeight: 'bold', cursor: 'pointer', color: '#007bff' }}
                            onClick={() => handleAgentClick('류소영')}
                          >류소영</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#28a745' }}>3건</td>
                    </tr>
                    <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', color: '#666' }}>4위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#fd79a8', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>박</div>
                          <span 
                            style={{ cursor: 'pointer', color: '#007bff' }}
                            onClick={() => handleAgentClick('박민수')}
                          >박민수</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>2건</td>
                    </tr>
                    <tr style={{ background: 'white', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', color: '#666' }}>5위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#74b9ff', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>정</div>
                          <span>정미영</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>2건</td>
                    </tr>
                    <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', color: '#666' }}>6위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#a29bfe', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>최</div>
                          <span>최동훈</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>1건</td>
                    </tr>
                    <tr style={{ background: 'white', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', color: '#666' }}>7위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#fd79a8', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>한</div>
                          <span>한지수</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>1건</td>
                    </tr>
                    <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', color: '#666' }}>8위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#00b894', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>송</div>
                          <span>송민호</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>1건</td>
                    </tr>
                    <tr style={{ background: 'white', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', color: '#999' }}>9위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#ddd', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#666', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>윤</div>
                          <span style={{ color: '#999' }}>윤서연</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', color: '#999' }}>0건</td>
                    </tr>
                    <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', color: '#999' }}>10위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#ddd', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#666', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>강</div>
                          <span style={{ color: '#999' }}>강혜진</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', color: '#999' }}>0건</td>
                    </tr>
                    <tr style={{ background: 'white', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', color: '#999' }}>11위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#ddd', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#666', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>조</div>
                          <span style={{ color: '#999' }}>조성민</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', color: '#999' }}>0건</td>
                    </tr>
                    <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', color: '#999' }}>12위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#ddd', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#666', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>신</div>
                          <span style={{ color: '#999' }}>신유리</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', color: '#999' }}>0건</td>
                    </tr>
                    <tr style={{ background: 'white', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', color: '#999' }}>13위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#ddd', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#666', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>홍</div>
                          <span style={{ color: '#999' }}>홍준석</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', color: '#999' }}>0건</td>
                    </tr>
                    <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '12px 15px', color: '#999' }}>14위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#ddd', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#666', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>임</div>
                          <span style={{ color: '#999' }}>임태현</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', color: '#999' }}>0건</td>
                    </tr>
                    <tr style={{ background: 'white' }}>
                      <td style={{ padding: '12px 15px', color: '#999' }}>15위</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', background: '#ddd', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#666', fontWeight: 'bold', fontSize: '0.9rem'
                          }}>안</div>
                          <span style={{ color: '#999' }}>안미경</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', color: '#999' }}>0건</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 총합 요약 */}
              <div style={{
                padding: '15px 20px',
                background: '#e3f2fd',
                borderRadius: '0 0 12px 12px',
                textAlign: 'center',
                color: '#1976d2',
                borderTop: '2px solid #bbdefb'
              }}>
                💡 오늘 총 <strong>19건</strong>의 견적요청이 접수되었습니다 (활성 에이전트: 8명)
              </div>
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

      {/* 에이전트 상세 모달 */}
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
        }} onClick={() => setShowAgentModal(false)}>
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
              </div>
            </div>

            {/* 이번 달 성과 */}
            <div style={{
              background: '#e8f5e8',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2e7d32' }}>📊 이번 달 성과 (11월)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4facfe' }}>{selectedAgent.clicks}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>총 접속수</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>{selectedAgent.quotes}건</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>견적요청</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fd79a8' }}>
                    {selectedAgent.clicks > 0 ? ((selectedAgent.quotes / selectedAgent.clicks) * 100).toFixed(1) : '0.0'}%
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>전환율</div>
                </div>
              </div>
            </div>

            {/* 최근 6개월 실적 */}
            <div style={{
              background: '#fff3e0',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#f57c00' }}>📈 최근 6개월 실적</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {selectedAgent.monthlyStats.map((stat) => (
                      <th key={stat.month} style={{ 
                        padding: '10px', 
                        textAlign: 'center', 
                        borderBottom: '2px solid #ffcc02',
                        fontSize: '0.9rem',
                        color: '#e65100'
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
                        padding: '10px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: stat.quotes > 0 ? '#2e7d32' : '#999'
                      }}>
                        {stat.quotes}건
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
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
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

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