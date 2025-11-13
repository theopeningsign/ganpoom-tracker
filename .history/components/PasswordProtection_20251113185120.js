import { useState, useEffect } from 'react'

const PasswordProtection = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const CORRECT_PASSWORD = 'dpqmflcl2018#'

  useEffect(() => {
    // 세션 스토리지에서 인증 상태 확인
    const authStatus = sessionStorage.getItem('ganpoom_admin_auth')
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
      setError('')
      // 세션 스토리지에 인증 상태 저장 (브라우저 닫으면 삭제됨)
      sessionStorage.setItem('ganpoom_admin_auth', 'authenticated')
    } else {
      setError('비밀번호가 틀렸습니다.')
      setPassword('')
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>로딩 중...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ 
              fontSize: '2rem', 
              color: '#2c3e50', 
              marginBottom: '10px',
              fontWeight: 'bold'
            }}>
              🔐 Ganpoom Tracker
            </h1>
            <p style={{ 
              color: '#666', 
              fontSize: '1rem',
              margin: 0
            }}>
              관리자 인증이 필요합니다
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                style={{
                  width: '100%',
                  padding: '15px',
                  border: error ? '2px solid #e74c3c' : '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => {
                  if (!error) e.target.style.borderColor = '#4facfe'
                }}
                onBlur={(e) => {
                  if (!error) e.target.style.borderColor = '#e1e5e9'
                }}
                autoFocus
              />
              {error && (
                <div style={{
                  color: '#e74c3c',
                  fontSize: '0.9rem',
                  marginTop: '8px',
                  textAlign: 'left'
                }}>
                  ⚠️ {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
              }}
            >
              🚀 로그인
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#e3f2fd',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#1976d2'
          }}>
            💡 한 번 로그인하면 브라우저를 닫기 전까지 유지됩니다
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default PasswordProtection
