import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AgentManagement() {
  const [agents, setAgents] = useState([])
  const [filteredAgents, setFilteredAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState('grid')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    account: '',
    memo: ''
  })
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' }) // 상태 메시지 추가

  // 상태 메시지 표시 함수
  const showMessage = (type, text) => {
    setStatusMessage({ type, text })
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000) // 5초 후 자동 제거
  }

  // 에이전트 목록 로드
  useEffect(() => {
    loadAgents()
  }, [])

  // 검색 및 정렬 필터링
  useEffect(() => {
    let filtered = [...agents]
    
    // 검색 필터링
    if (searchTerm) {
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone.includes(searchTerm) ||
        (agent.memo && agent.memo.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'revenue':
          return (b.revenue || 0) - (a.revenue || 0)
        case 'quotes':
          return (b.quotes || 0) - (a.quotes || 0)
        default:
          return 0
      }
    })
    
    setFilteredAgents(filtered)
  }, [agents, searchTerm, sortBy])

  const loadAgents = async () => {
    try {
      setLoading(true)
      
      // 실제 API에서 에이전트 목록 가져오기
      const response = await fetch('/api/agents')
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.agents) {
          setAgents(result.agents || [])
        } else {
          throw new Error(result.error || '알 수 없는 오류가 발생했습니다.')
        }
      } else {
        // 에러 응답의 상세 정보 확인
        const errorData = await response.json().catch(() => ({}))
        console.error('API 응답 오류:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.error || errorData.details || `API 호출 실패 (${response.status})`)
      }
    } catch (error) {
      console.error('에이전트 목록 로드 실패:', error)
      const errorMessage = error.message || '에이전트 목록을 불러오는데 실패했습니다.'
      showMessage('error', errorMessage)
      setAgents([]) // 실패시 빈 배열로 설정
    } finally {
      setLoading(false)
    }
  }

  const createAgent = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone || !formData.account) {
      showMessage('error', '이름, 전화번호, 계좌번호를 모두 입력해주세요.')
      return
    }

    try {
      setCreating(true)
      
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || '에이전트 생성 실패')
        }
        
        // 응답 데이터 구조 확인 (agent 객체 또는 전체 응답)
        const newAgent = result.agent || result
        
        // 로컬 상태 업데이트
        setAgents(prev => [...prev, newAgent])
        
        // 폼 초기화
        setFormData({ name: '', phone: '', email: '', account: '', memo: '' })
        setShowCreateForm(false)
        
        // 추적 링크 생성 (응답에 없으면 직접 생성)
        const trackingLink = result.trackingLink || `https://www.ganpoom.com/?ref=${newAgent.id}`
        
        showMessage('success', `✅ ${newAgent.name} 에이전트가 생성되었습니다! 추적 링크: ${trackingLink}`)
        
        // 에이전트 목록 새로고침
        loadAgents()
      } else {
        // 에러 응답의 상세 정보 확인
        const errorData = await response.json().catch(() => ({}))
        console.error('API 응답 오류:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.error || errorData.details || `에이전트 생성 실패 (${response.status})`)
      }
    } catch (error) {
      console.error('에이전트 생성 실패:', error)
      const errorMessage = error.message || '에이전트 생성에 실패했습니다.'
      showMessage('error', errorMessage)
    } finally {
      setCreating(false)
    }
  }

  const deleteAgent = async (agentId, agentName) => {
    if (window.confirm(`정말로 "${agentName}" 에이전트를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        const response = await fetch('/api/agents/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agentId }),
        })

        if (response.ok) {
          // 로컬 상태에서 제거
          setAgents(prev => prev.filter(agent => agent.id !== agentId))
          setFilteredAgents(prev => prev.filter(agent => agent.id !== agentId))
          
          showMessage('success', `✅ "${agentName}" 에이전트가 삭제되었습니다.`)
        } else {
          throw new Error('에이전트 삭제 실패')
        }
      } catch (error) {
        console.error('에이전트 삭제 실패:', error)
        showMessage('error', '에이전트 삭제에 실패했습니다.')
      }
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showMessage('success', '📋 링크가 클립보드에 복사되었습니다!')
    }).catch(() => {
      showMessage('error', '클립보드 복사에 실패했습니다.')
    })
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
              👥 에이전트 관리
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
              
              <Link href="/admin/settlement" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>💰 정산관리</button>
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
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            padding: '40px',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '15px', margin: 0 }}>
              👥 에이전트 관리
            </h2>
            <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>
              총 {filteredAgents.length}명의 에이전트가 활동 중입니다
            </p>
          </div>

          {/* 컨트롤 패널 */}
          <div style={{ padding: '30px' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              {/* 검색 */}
              <input
                type="text"
                placeholder="이름, 전화번호, 메모로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '250px',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />

              {/* 정렬 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="name">이름순</option>
                <option value="revenue">매출순</option>
                <option value="quotes">견적요청순</option>
              </select>

              {/* 에이전트 생성 버튼 */}
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ➕ 새 에이전트 추가
              </button>
            </div>

            {/* 에이전트 목록 */}
            {filteredAgents.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👥</div>
                <h3 style={{ marginBottom: '10px' }}>아직 등록된 에이전트가 없습니다</h3>
                <p>새 에이전트를 추가해보세요!</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                {filteredAgents.map((agent) => (
                  <div
                    key={agent.id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '24px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e9ecef',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* 에이전트 정보 */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.3rem' }}>
                          👤 {agent.name}
                        </h3>
                        <button
                          onClick={() => deleteAgent(agent.id, agent.name)}
                          style={{
                            background: '#ff4757',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                          title="에이전트 삭제"
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                      
                      <div style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        <p style={{ margin: '5px 0' }}>📞 {agent.phone}</p>
                        <p style={{ margin: '5px 0' }}>🏦 {agent.account_number || '계좌번호 미등록'}</p>
                        <p style={{ margin: '5px 0' }}>🆔 {agent.id}</p>
                        {agent.memo && (
                          <p style={{ margin: '5px 0', fontStyle: 'italic' }}>💭 {agent.memo}</p>
                        )}
                      </div>
                    </div>

                    {/* 통계 */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        background: '#f8f9fa',
                        padding: '12px',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4facfe' }}>
                          {agent.clicks || 0}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>접속수</div>
                      </div>
                      
                      <div style={{
                        background: '#f8f9fa',
                        padding: '12px',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00f2fe' }}>
                          {agent.quotes || 0}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>견적요청</div>
                      </div>
                    </div>


                    {/* 추적 링크 */}
                    <div style={{
                      background: '#f8f9fa',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '15px'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}>
                        🔗 추적 링크:
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#2c3e50',
                        wordBreak: 'break-all',
                        marginBottom: '8px'
                      }}>
                        {agent.trackingLink}
                      </div>
                      <button
                        onClick={() => copyToClipboard(agent.trackingLink)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: '#4facfe',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        📋 링크 복사
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '30px', textAlign: 'center', color: '#2c3e50' }}>
              ➕ 새 에이전트 추가
            </h2>
            
            <form onSubmit={createAgent}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                  이름 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="예: 김철수"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                  전화번호 *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="예: 010-1234-5678"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                  이메일 (선택사항)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="예: agent@example.com"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                  계좌번호 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.account}
                  onChange={(e) => setFormData({...formData, account: e.target.value})}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="예: 국민은행 123456-78-901234"
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                  메모 (선택사항)
                </label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData({...formData, memo: e.target.value})}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="예: 네이버 블로그 운영, 인스타그램 마케팅 등"
                />
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
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}