import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-mock'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalQuotes: 0,
    totalAgents: 0,
    conversionRate: 0,
    totalCommission: 0
  })
  
  const [recentQuotes, setRecentQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  // 데이터 로드
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Mock 데이터에서 통계 생성
      const { generateMockStats, generateMockAgentStats, mockQuoteRequests } = await import('../../lib/mock-data')
      
      const mockStats = generateMockStats()
      setStats(mockStats)

      // 최근 견적요청 (최신순 3개)
      const sortedQuotes = [...mockQuoteRequests]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3)
      setRecentQuotes(sortedQuotes)

    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '0'
    }}>
      {/* 헤더 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '20px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '2rem', fontWeight: 'bold' }}>
              🚀 Ganpoom 관리자 대시보드
            </h1>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <Link href="/admin/agents" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>에이전트 관리</button>
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
                }}>상세 통계</button>
              </Link>
              
              <Link href="/test-ganpoom" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>테스트 페이지</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px',
            color: 'white',
            fontSize: '1.2rem'
          }}>
            로딩 중...
          </div>
        ) : (
          <>
            {/* 통계 카드들 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '25px',
              marginBottom: '40px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}>
                  {stats.totalAgents}
                </div>
                <div style={{ color: '#666', fontSize: '1rem' }}>총 에이전트</div>
              </div>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🖱️</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}>
                  {stats.totalClicks}
                </div>
                <div style={{ color: '#666', fontSize: '1rem' }}>총 클릭</div>
              </div>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}>
                  {stats.totalQuotes}
                </div>
                <div style={{ color: '#666', fontSize: '1rem' }}>견적 요청</div>
              </div>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💰</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745', marginBottom: '8px' }}>
                  ₩{stats.totalCommission?.toLocaleString() || 0}
                </div>
                <div style={{ color: '#666', fontSize: '1rem' }}>총 커미션</div>
              </div>
            </div>

            {/* 최근 견적요청 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.5rem' }}>📋 최근 견적요청</h3>
              
              {recentQuotes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {recentQuotes.map((quote, index) => (
                    <div key={quote.id || index} style={{
                      padding: '20px',
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '5px' }}>
                          {quote.customer_name || '고객명 없음'}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                          {quote.svc_type || '서비스 없음'} • {new Date(quote.created_at).toLocaleString('ko-KR')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                          ₩{quote.estimated_value ? quote.estimated_value.toLocaleString() : 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          커미션: ₩{quote.commission_amount ? quote.commission_amount.toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: '#666'
                }}>
                  아직 견적요청이 없습니다.
                </div>
              )}
            </div>

            {/* 빠른 액션 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '25px',
              marginTop: '40px'
            }}>
              <Link href="/admin/agents" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  borderRadius: '16px',
                  padding: '30px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '8px' }}>에이전트 관리</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>새 에이전트 생성 및 관리</div>
                </div>
              </Link>

              <Link href="/admin/analytics" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  borderRadius: '16px',
                  padding: '30px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 8px 32px rgba(17, 153, 142, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '8px' }}>상세 통계</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>월별/일별 상세 분석</div>
                </div>
              </Link>

              <Link href="/test-ganpoom" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '16px',
                  padding: '30px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🧪</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '8px' }}>테스트 페이지</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>링크 추적 테스트</div>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}