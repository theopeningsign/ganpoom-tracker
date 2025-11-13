import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function TestGanpoomPage() {
  const router = useRouter()
  const { ref } = router.query // URL에서 ref 파라미터 추출
  
  const [formData, setFormData] = useState({
    svc_type: '웹드문제작',
    req_type: '간단제작',
    title: '',
    area: '',
    phone: '',
    floor: 1,
    setup_date: '2주 이내',
    deadline: '1개월 이내',
    texture: '16시~18시',
    comments: ''
  })
  
  const [trackingStatus, setTrackingStatus] = useState('확인 중...')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // 추적 스크립트 동적 로드
    const script = document.createElement('script')
    script.src = '/test-tracker.js'
    script.async = true
    document.body.appendChild(script)

    // ref 파라미터가 있으면 추적 상태 업데이트
    if (ref) {
      setTrackingStatus(`✅ 추적 중 (에이전트: ${ref})`)
    } else {
      setTrackingStatus('❌ 추적 링크로 접속하지 않음')
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [ref])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 실제 ganpoom.com과 동일한 방식으로 폼 제출 시뮬레이션
      console.log('📋 견적요청 폼 제출:', formData)
      
      // 추적 스크립트에서 자동으로 감지하도록 이벤트 발생
      const submitEvent = new Event('submit', { bubbles: true })
      e.target.dispatchEvent(submitEvent)
      
      // 성공 메시지
      alert('견적요청이 완료되었습니다!\n추적 데이터가 기록되었습니다.')
      
      // 폼 초기화
      setFormData({
        svc_type: '웹드문제작',
        req_type: '간단제작',
        title: '',
        area: '',
        phone: '',
        floor: 1,
        setup_date: '2주 이내',
        deadline: '1개월 이내',
        texture: '16시~18시',
        comments: ''
      })
      
    } catch (error) {
      console.error('폼 제출 오류:', error)
      alert('오류가 발생했습니다: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1000px',
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
            🧪 시스템 테스트
          </h1>
          <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>
            실제 ganpoom.com과 동일한 견적요청 폼으로 추적 시스템을 테스트하세요
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

            <Link href="/admin/settlement" style={{ textDecoration: 'none' }}>
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
                💰 정산 관리
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
          </div>

          <div style={{
            padding: '15px 25px',
            background: trackingStatus.includes('✅') ? '#e8f5e8' : '#ffeaa7',
            border: `2px solid ${trackingStatus.includes('✅') ? '#c8e6c9' : '#fdcb6e'}`,
            borderRadius: '12px',
            display: 'inline-block'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '3px' }}>추적 상태</div>
            <div style={{ fontWeight: 'bold', color: trackingStatus.includes('✅') ? '#2e7d32' : '#e17055' }}>
              {trackingStatus}
            </div>
          </div>
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
            🧪 테스트 방법
          </h3>
          <ol style={{ color: '#1565c0', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li style={{ margin: '0 0 8px 0' }}>관리자 페이지에서 에이전트 생성</li>
            <li style={{ margin: '0 0 8px 0' }}>생성된 추적 링크로 이 페이지 접속</li>
            <li style={{ margin: '0 0 8px 0' }}>아래 견적요청 폼 작성 후 제출</li>
            <li style={{ margin: 0 }}>관리자 대시보드에서 추적 결과 확인</li>
          </ol>
        </div>

        {/* 견적요청 폼 */}
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
            견적 요청하기
          </h2>
          
          <form onSubmit={handleSubmit} style={{
            background: '#f8f9fa',
            padding: '30px',
            borderRadius: '12px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  서비스 타입 *
                </label>
                <select
                  name="svc_type"
                  value={formData.svc_type}
                  onChange={handleInputChange}
                  required
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
                >
                  <option value="웹드문제작">웹드문 제작</option>
                  <option value="간판제작">간판 제작</option>
                  <option value="인테리어">인테리어</option>
                  <option value="외관공사">외관 공사</option>
                  <option value="리모델링">리모델링</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  요청 타입 *
                </label>
                <select
                  name="req_type"
                  value={formData.req_type}
                  onChange={handleInputChange}
                  required
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
                >
                  <option value="간단제작">간단 제작</option>
                  <option value="고급제작">고급 제작</option>
                  <option value="프리미엄제작">프리미엄 제작</option>
                </select>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  제목/회사명 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="예: 카페 간판"
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
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  연락처 *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="010-1234-5678"
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
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                주소/지역 *
              </label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                required
                placeholder="서울 강남구 테헤란로 123"
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
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  층수
                </label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleInputChange}
                  min="1"
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
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  설치 희망일
                </label>
                <select
                  name="setup_date"
                  value={formData.setup_date}
                  onChange={handleInputChange}
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
                >
                  <option value="1주 이내">1주 이내</option>
                  <option value="2주 이내">2주 이내</option>
                  <option value="1개월 이내">1개월 이내</option>
                  <option value="협의">협의</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  완료 기한
                </label>
                <select
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
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
                >
                  <option value="2주 이내">2주 이내</option>
                  <option value="1개월 이내">1개월 이내</option>
                  <option value="2개월 이내">2개월 이내</option>
                  <option value="협의">협의</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                상세 요청사항
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows="4"
                placeholder="프로젝트에 대한 상세한 요구사항을 입력해주세요..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4facfe'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '15px 40px',
                  background: isSubmitting ? '#ccc' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: isSubmitting ? 'none' : '0 4px 15px rgba(79, 172, 254, 0.3)'
                }}
                onMouseOver={(e) => {
                  if (!isSubmitting) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSubmitting) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.3)';
                  }
                }}
              >
                {isSubmitting ? '제출 중...' : '💌 견적 요청하기'}
              </button>
            </div>
          </form>
        </div>

        {/* 테스트 링크 생성 도구 */}
        <div style={{
          margin: '30px',
          background: '#fff3e0',
          border: '2px solid #ffcc02',
          borderRadius: '12px',
          padding: '25px'
        }}>
          <h3 style={{ fontSize: '1.3rem', color: '#f57c00', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔗 테스트 링크 생성
          </h3>
          <p style={{ color: '#ef6c00', marginBottom: '15px' }}>
            에이전트 ID를 입력하면 테스트용 추적 링크를 생성합니다.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="에이전트 ID (예: Ab3kM9)"
              id="testAgentId"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #ffcc02',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => {
                const agentId = document.getElementById('testAgentId').value
                if (agentId) {
                  const testLink = `${window.location.origin}/test-ganpoom?ref=${agentId}`
                  navigator.clipboard.writeText(testLink)
                  alert(`테스트 링크가 복사되었습니다!\n${testLink}`)
                } else {
                  alert('에이전트 ID를 입력해주세요.')
                }
              }}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              링크 생성 & 복사
            </button>
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