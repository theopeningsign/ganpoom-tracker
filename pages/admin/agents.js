import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import Link from 'next/link'

export default function AgentManagement() {
  const initialFormState = {
    name: '',
    phone: '',
    email: '',
    account: '',
    memo: ''
  }

  const [agents, setAgents] = useState([])
  const [filteredAgents, setFilteredAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [viewMode, setViewMode] = useState('grid')
  const [formData, setFormData] = useState(initialFormState)
  const [editingAgent, setEditingAgent] = useState(null)
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 상태 메시지 표시 함수
  const showMessage = (type, text) => {
    setStatusMessage({ type, text })
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000) // 5초 후 자동 제거
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setEditingAgent(null)
  }

  const openCreateForm = () => {
    resetForm()
    setShowCreateForm(true)
  }

  const openEditForm = (agent) => {
    setFormData({
      name: agent.name || '',
      phone: agent.phone || '',
      email: agent.email || '',
      account: agent.account_number || '',
      memo: agent.memo || ''
    })
    setEditingAgent(agent)
    setShowCreateForm(true)
  }

  const closeFormModal = () => {
    setShowCreateForm(false)
    resetForm()
  }

  const isEditing = Boolean(editingAgent)
  const listHeaderStyle = {
    padding: '14px',
    textAlign: 'left',
    fontSize: '0.9rem',
    color: '#495057',
    borderBottom: '2px solid #dee2e6'
  }
  const listCellStyle = {
    padding: '14px',
    fontSize: '0.9rem',
    color: '#495057'
  }
  const listActionButtonStyle = (bg) => ({
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.8rem',
    padding: '6px 10px',
    cursor: 'pointer',
    fontWeight: 'bold'
  })

  const downloadAgentExcel = () => {
    if (!filteredAgents.length) {
      showMessage('error', '다운로드할 에이전트가 없습니다.')
      return
    }

    const data = filteredAgents.map((agent) => ({
      '에이전트명': agent.name,
      '전화번호': agent.phone,
      '이메일': agent.email || '',
      '계좌번호': agent.account_number || '',
      '에이전트 ID': agent.id,
      '접속수': agent.clicks || 0,
      '견적요청': agent.quotes || 0,
      '가입일': agent.created_at ? new Date(agent.created_at).toLocaleString('ko-KR') : ''
    }))

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 15 },
      { wch: 22 },
      { wch: 20 },
      { wch: 14 },
      { wch: 8 },
      { wch: 10 },
      { wch: 19 }
    ]
    XLSX.utils.book_append_sheet(workbook, worksheet, '에이전트 목록')
    XLSX.writeFile(workbook, `에이전트_관리_${new Date().toISOString().slice(0, 10)}.xlsx`)
    showMessage('success', '📁 에이전트 목록 엑셀 다운로드가 완료되었습니다.')
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
        case 'quotes':
          return (b.quotes || 0) - (a.quotes || 0)
        case 'created_at':
          // 가입날짜순 (가장 최근 가입자가 처음)
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          if (dateB !== dateA) return dateB - dateA
          // 날짜가 같으면 id 오름차순 (gp001, gp002...)
          return a.id.localeCompare(b.id, undefined, { numeric: true })
        default:
          return 0
      }
    })
    
    setFilteredAgents(filtered)
  }, [agents, searchTerm, sortBy])

  const loadAgents = async (sd = startDate, ed = endDate) => {
    try {
      setLoading(true)

      // 날짜 필터 쿼리 파라미터 구성
      const params = new URLSearchParams()
      if (sd) params.append('startDate', sd)
      if (ed) params.append('endDate', ed)
      const queryString = params.toString() ? '?' + params.toString() : ''

      // 실제 API에서 에이전트 목록 가져오기
      const response = await fetch('/api/agents' + queryString)
      
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

  const handleAgentSave = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone || !formData.account) {
      showMessage('error', '이름, 전화번호, 계좌번호를 모두 입력해주세요.')
      return
    }

    try {
      setSaving(true)
      const isEditing = Boolean(editingAgent)
      const endpoint = isEditing ? '/api/agents/update' : '/api/agents/create'
      const method = isEditing ? 'PATCH' : 'POST'
      const payload = isEditing ? { ...formData, agentId: editingAgent.id } : formData
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || '에이전트 생성 실패')
        }
        
        const apiAgent = result.agent || result
        
        if (isEditing) {
          setAgents((prev) =>
            prev.map((agent) => (agent.id === apiAgent.id ? apiAgent : agent))
          )
        } else {
          setAgents(prev => [...prev, apiAgent])
        }
        
        closeFormModal()
        
        // 추적 링크 생성 (응답에 없으면 직접 생성)
        const trackingLink = result.trackingLink || `https://www.ganpoom.com/?ref=${apiAgent.id}`
        
        showMessage(
          'success',
          isEditing
            ? `✏️ ${apiAgent.name} 에이전트 정보가 수정되었습니다.`
            : `✅ ${apiAgent.name} 에이전트가 생성되었습니다! 추적 링크: ${trackingLink}`
        )
        
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
        throw new Error(
          errorData.error ||
            errorData.details ||
            `에이전트 ${editingAgent ? '수정' : '생성'} 실패 (${response.status})`
        )
      }
    } catch (error) {
      console.error('에이전트 저장 실패:', error)
      const errorMessage = error.message || '에이전트 저장에 실패했습니다.'
      showMessage('error', errorMessage)
    } finally {
      setSaving(false)
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
              {/* 기간 필터 */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '12px 10px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <span style={{ color: '#666' }}>~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '12px 10px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => loadAgents(startDate, endDate)}
                  style={{
                    padding: '12px 18px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔍 조회
                </button>
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); loadAgents('', '') }}
                    style={{
                      padding: '12px 14px',
                      background: '#f8f9fa',
                      color: '#666',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    전체
                  </button>
                )}
              </div>

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
                <option value="created_at">가입날짜순</option>
                <option value="name">이름순</option>
                <option value="quotes">견적요청순</option>
              </select>

              {/* 보기 전환 */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { key: 'grid', label: '카드형' },
                  { key: 'list', label: '목록형' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: viewMode === key ? '#4facfe' : '#e1e5e9',
                      background: viewMode === key ? 'rgba(79, 172, 254, 0.15)' : 'white',
                      color: viewMode === key ? '#0b5ed7' : '#333',
                      fontWeight: viewMode === key ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 엑셀 다운로드 */}
              <button
                onClick={downloadAgentExcel}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                📥 엑셀 다운로드
              </button>

              {/* 에이전트 생성 버튼 */}
              <button
                onClick={openCreateForm}
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
            <div
              style={{
                maxHeight: viewMode === 'grid' ? '1100px' : '900px',
                overflowY: 'auto',
                paddingRight: '6px'
              }}
              className="custom-scrollbar agent-scroll"
            >
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
              ) : viewMode === 'grid' ? (
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
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* 에이전트 정보 */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' }}>
                        <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.3rem' }}>
                          👤 {agent.name}
                        </h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => openEditForm(agent)}
                            style={{
                              background: '#6c5ce7',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                            title="에이전트 수정"
                          >
                            ✏️ 수정
                          </button>
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
                      </div>
                      
                      <div style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        <p style={{ margin: '5px 0' }}>📞 {agent.phone}</p>
                        {agent.email && (
                          <p style={{ margin: '5px 0' }}>📧 {agent.email}</p>
                        )}
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
              ) : (
                <div style={{ minWidth: '600px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={listHeaderStyle}>에이전트</th>
                        <th style={listHeaderStyle}>연락처</th>
                        <th style={listHeaderStyle}>계좌번호</th>
                        <th style={listHeaderStyle}>접속수</th>
                        <th style={listHeaderStyle}>견적요청</th>
                        <th style={listHeaderStyle}>액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgents.map((agent, index) => (
                        <tr key={agent.id} style={{
                          borderBottom: '1px solid #e9ecef',
                          background: index % 2 === 0 ? 'white' : '#fcfcff'
                        }}>
                          <td style={listCellStyle}>
                            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{agent.name}</div>
                            <div style={{ color: '#6c757d', fontSize: '0.85rem' }}>{agent.id}</div>
                            {agent.memo && (
                              <div style={{ color: '#999', fontSize: '0.8rem', marginTop: '4px' }}>{agent.memo}</div>
                            )}
                          </td>
                          <td style={listCellStyle}>
                            <div>📞 {agent.phone}</div>
                            {agent.email && <div>📧 {agent.email}</div>}
                          </td>
                          <td style={listCellStyle}>{agent.account_number || '계좌번호 미등록'}</td>
                          <td style={{ ...listCellStyle, textAlign: 'center', fontWeight: 'bold' }}>{agent.clicks || 0}</td>
                          <td style={{ ...listCellStyle, textAlign: 'center', fontWeight: 'bold' }}>{agent.quotes || 0}</td>
                          <td style={{ ...listCellStyle, minWidth: '160px' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => openEditForm(agent)}
                                style={listActionButtonStyle('#6c5ce7')}
                              >
                                ✏️ 수정
                              </button>
                              <button
                                onClick={() => deleteAgent(agent.id, agent.name)}
                                style={listActionButtonStyle('#ff4757')}
                              >
                                🗑️ 삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 에이전트 생성 모달 */}
      {showCreateForm && (
        <div
          onClick={closeFormModal}
          style={{
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
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '30px', textAlign: 'center', color: '#2c3e50' }}>
              {isEditing ? '✏️ 에이전트 정보 수정' : '➕ 새 에이전트 추가'}
            </h2>
            
            <form onSubmit={handleAgentSave}>
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
                  onClick={closeFormModal}
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
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: saving ? '#ccc' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? '저장 중...' : isEditing ? '정보 수정' : '생성하기'}
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