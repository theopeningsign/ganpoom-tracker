import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AgentsPage() {
  const [agents, setAgents] = useState([])
  const [filteredAgents, setFilteredAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [viewMode, setViewMode] = useState('grid')
  const [formData, setFormData] = useState({
    name: '',
    memo: '',
    email: '',
    phone: ''
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadAgents()
  }, [])

  // 검색 및 필터링
  useEffect(() => {
    let filtered = [...agents]
    
    if (searchTerm) {
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.memo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone?.includes(searchTerm) ||
        agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'performance':
          return (b.revenue || 0) - (a.revenue || 0)
        case 'quotes':
          return (b.quotes || 0) - (a.quotes || 0)
        case 'created_at':
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })
    
    setFilteredAgents(filtered)
  }, [agents, searchTerm, sortBy])

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/mock/agents/list')
      if (!response.ok) {
        const { generateMockAgentStats } = await import('../../lib/mock-data')
        const mockAgents = generateMockAgentStats()
        setAgents(mockAgents)
        setFilteredAgents(mockAgents)
        return
      }
      
      const result = await response.json()
      setAgents(result.agents || [])
      setFilteredAgents(result.agents || [])
    } catch (error) {
      console.error('에이전트 로드 오류:', error)
      try {
        const { generateMockAgentStats } = await import('../../lib/mock-data')
        const mockAgents = generateMockAgentStats()
        setAgents(mockAgents)
        setFilteredAgents(mockAgents)
      } catch (mockError) {
        console.error('Mock 데이터 로드 실패:', mockError)
        setAgents([])
        setFilteredAgents([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/mock/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '에이전트 생성 실패')
      }

      alert(`✅ 에이전트가 생성되었습니다!\n\n📋 에이전트: ${result.agent.name}\n🔗 추적 링크: ${result.trackingLink}`)
      
      setFormData({
        name: '',
        memo: '',
        email: '',
        phone: ''
      })
      setShowCreateForm(false)
      loadAgents()

    } catch (error) {
      console.error('에이전트 생성 오류:', error)
      alert('❌ ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      alert('🔗 링크가 복사되었습니다!')
    })
  }

  const deleteAgent = (agentId, agentName) => {
    if (window.confirm(`정말로 "${agentName}" 에이전트를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
      // Mock 환경에서는 로컬 상태만 업데이트
      setAgents(prev => prev.filter(agent => agent.id !== agentId))
      setFilteredAgents(prev => prev.filter(agent => agent.id !== agentId))
      alert(`✅ "${agentName}" 에이전트가 삭제되었습니다.`)
    }
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

  const getPerformanceColor = (conversionRate) => {
    const rate = parseFloat(conversionRate)
    if (rate >= 10) return 'text-green-600 bg-green-50'
    if (rate >= 5) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getPerformanceBadge = (conversionRate) => {
    const rate = parseFloat(conversionRate)
    if (rate >= 10) return { text: '우수', color: 'bg-green-500' }
    if (rate >= 5) return { text: '보통', color: 'bg-yellow-500' }
    return { text: '개선필요', color: 'bg-red-500' }
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
          <p>에이전트 목록을 불러오는 중...</p>
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
            👥 에이전트 관리
          </h1>
          <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>
            총 {filteredAgents.length}명의 에이전트가 활동 중입니다
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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

            <Link href="/admin/test" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '15px 20px',
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
                📊 월별 통계
              </div>
            </Link>

            <Link href="/test-ganpoom" style={{ textDecoration: 'none' }}>
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
                🧪 테스트
              </div>
            </Link>

          </div>

          <button 
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1.1rem',
              fontWeight: '600',
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
            }}
          >
            ✨ 새 에이전트 생성
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div style={{
          padding: '30px',
          borderBottom: '1px solid #eee'
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
            }}>🔍</span>
            검색 및 필터
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: '15px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="이름, 전화번호, 이메일, ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4facfe'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
            >
              <option value="created_at">최신순</option>
              <option value="name">이름순</option>
              <option value="performance">성과순</option>
              <option value="quotes">전환순</option>
            </select>
            
            <div style={{ display: 'flex', border: '2px solid #e1e5e9', borderRadius: '8px' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: viewMode === 'grid' ? '#4facfe' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                📱 카드
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: viewMode === 'list' ? '#4facfe' : 'transparent',
                  color: viewMode === 'list' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                📋 리스트
              </button>
            </div>
          </div>
        </div>

        {/* 에이전트 목록 */}
        <div style={{ padding: '30px' }}>
          {filteredAgents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👥</div>
              <h3 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '10px' }}>
                {searchTerm ? '검색 결과가 없습니다' : '에이전트가 없습니다'}
              </h3>
              <p style={{ color: '#666', marginBottom: '30px' }}>
                {searchTerm ? '다른 검색어를 시도해보세요' : '첫 번째 에이전트를 생성해보세요'}
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => setShowCreateForm(true)}
                  style={{
                    padding: '15px 30px',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
                  }}
                >
                  ✨ 에이전트 생성하기
                </button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px'
                }}>
                  {filteredAgents.map((agent) => {
                    const badge = getPerformanceBadge(agent.conversionRate)
                    return (
                      <div key={agent.id} style={{
                        background: 'white',
                        border: '1px solid #e9ecef',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                      }}>
                        {/* 카드 헤더 */}
                        <div style={{
                          padding: '20px',
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                          borderBottom: '1px solid #dee2e6'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                                {agent.name.charAt(0)}
                              </div>
                              <div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{agent.name}</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{agent.id}</p>
                              </div>
                            </div>
                            <div style={{
                              padding: '4px 12px',
                              background: badge.color,
                              color: 'white',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>
                              {badge.text}
                            </div>
                          </div>
                          {agent.memo && (
                            <p style={{ margin: '15px 0 0 0', fontSize: '0.9rem', color: '#666' }}>{agent.memo}</p>
                          )}
                        </div>

                        {/* 성과 지표 */}
                        <div style={{ padding: '20px' }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '20px',
                            marginBottom: '20px'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                                {agent.clicks || 0}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>클릭</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4facfe', marginBottom: '5px' }}>
                                {agent.quotes || 0}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>전환</div>
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.9rem', color: '#666' }}>전환율</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#4facfe' }}>
                                {agent.conversionRate}%
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.9rem', color: '#666' }}>커미션</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#28a745' }}>
                                {formatCurrency(agent.commission || 0)}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => copyLink(agent.trackingLink)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            🔗 링크 복사
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* 리스트 뷰 */
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
                    <h4 style={{ margin: 0, color: '#495057' }}>📋 에이전트 목록</h4>
                  </div>
                  
                  {filteredAgents.map((agent, index) => {
                    const badge = getPerformanceBadge(agent.conversionRate)
                    return (
                      <div key={agent.id} style={{
                        padding: '20px',
                        borderBottom: index < filteredAgents.length - 1 ? '1px solid #e9ecef' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'white',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#f8f9fa'}
                      onMouseOut={(e) => e.target.style.background = 'white'}>
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
                            {agent.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{agent.name}</h3>
                              <div style={{
                                padding: '2px 8px',
                                background: badge.color,
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold'
                              }}>
                                {badge.text}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '3px' }}>
                              {agent.memo || 'N/A'} • {agent.id}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#999' }}>
                              {agent.phone || '-'} • {agent.email || '-'}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                              {agent.clicks || 0} / {agent.quotes || 0}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>클릭 / 전환</div>
                            <div style={{ fontSize: '0.8rem', color: '#4facfe', fontWeight: 'bold' }}>
                              {agent.conversionRate}%
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
                              {formatCurrency(agent.commission || 0)}
                            </div>
                            <button
                              onClick={() => copyLink(agent.trackingLink)}
                              style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              링크 복사
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 에이전트 생성 모달 */}
      {showCreateForm && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              padding: '25px',
              borderRadius: '15px 15px 0 0'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>✨ 새 에이전트 생성</h3>
            </div>
            
            <form onSubmit={handleCreateAgent} style={{ padding: '30px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  에이전트 이름 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4facfe'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                  placeholder="예: 김철수"
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  메모 (선택사항)
                </label>
                <input
                  type="text"
                  value={formData.memo}
                  onChange={(e) => setFormData({...formData, memo: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4facfe'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                  placeholder="예: 네이버블로그, 인스타그램"
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  이메일 (선택사항)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4facfe'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                  placeholder="agent@example.com"
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  전화번호 (선택사항)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4facfe'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                  placeholder="010-1234-5678"
                />
              </div>
              
              <div style={{
                background: '#e3f2fd',
                border: '2px solid #bbdefb',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '25px'
              }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#1976d2', fontWeight: 'bold' }}>
                  💰 커미션 정책: 견적요청당 고정 10,000원
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#1565c0' }}>
                  월별로 정산됩니다.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f8f9fa',
                    color: '#666',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: creating ? '#ccc' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: creating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {creating ? '생성 중...' : '생성하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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