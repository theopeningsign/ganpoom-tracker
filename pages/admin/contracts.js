import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import PasswordProtection from '../../components/PasswordProtection'

function fmt(num) {
  if (!num && num !== 0) return ''
  return Number(num).toLocaleString('ko-KR')
}

export default function ManualContracts() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [reqId, setReqId] = useState('')
  const [productCost, setProductCost] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success'|'error', text }

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/contracts/manual')
      const json = await res.json()
      if (json.success) setList(json.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reqId || !productCost) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/contracts/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ req_id: reqId, product_cost: productCost, memo }),
      })
      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: `견적 #${reqId} 계약 등록 완료` })
        setReqId('')
        setProductCost('')
        setMemo('')
        fetchList()
      } else {
        setMessage({ type: 'error', text: json.error || '저장 실패' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: '저장 중 오류 발생' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, reqId) => {
    if (!confirm(`견적 #${reqId} 계약 내역을 삭제할까요?`)) return
    try {
      const res = await fetch(`/api/contracts/manual?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: `견적 #${reqId} 삭제 완료` })
        fetchList()
      }
    } catch (e) {
      setMessage({ type: 'error', text: '삭제 중 오류 발생' })
    }
  }

  return (
    <PasswordProtection>
      <style>{`
        @media (max-width: 768px) {
          .mc-sidebar { display: none !important; }
          .mc-mobile-nav { display: flex !important; }
          .mc-main { margin-left: 0 !important; padding: 12px !important; padding-top: 60px !important; }
        }
        .mc-mobile-nav { display: none; }
      `}</style>

      <div style={{ background: '#f5f6fa', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        {/* 모바일 네비바 */}
        <div className="mc-mobile-nav" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          background: '#1a1d2e', height: 52,
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>✍️ 계약 수기 입력</div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.1)', borderRadius: 20,
              padding: '6px 14px', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600
            }}>
              <span>📊</span><span>대시보드</span>
            </div>
          </Link>
        </div>

        {/* 사이드바 */}
        <div className="mc-sidebar" style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
          background: '#1a1d2e', color: 'white', padding: '24px 0', zIndex: 100,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Ganpoom</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Analytics</div>
          </div>
          <nav style={{ flex: 1, padding: '16px 0' }}>
            {[
              { href: '/', label: '대시보드', icon: '📊' },
              { href: '/channels', label: '채널 분석', icon: '📡' },
              { href: '/adcosts', label: '광고비 입력', icon: '💸' },
              { href: '/admin/agents', label: 'CPA 에이전트', icon: '👥' },
              { href: '/admin/settlement', label: '정산 관리', icon: '💰' },
              { href: '/admin/contracts', label: '계약 수기 입력', icon: '✍️' },
            ].map(({ href, label, icon }) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 20px', fontSize: 14, color: 'rgba(255,255,255,0.75)',
                  background: href === '/admin/contracts' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderLeft: href === '/admin/contracts' ? '3px solid #4facfe' : '3px solid transparent',
                }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* 메인 */}
        <div className="mc-main" style={{ marginLeft: 220, padding: 32, maxWidth: 720 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>계약 수기 입력</h1>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: '#888' }}>
            업체가 견적서 없이 진행한 계약을 직접 등록합니다. 채널 분석 계약현황에 자동 반영됩니다.
          </p>

          {/* 입력 폼 */}
          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>새 계약 등록</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>견적번호 (req_id) *</label>
                  <input
                    type="number"
                    value={reqId}
                    onChange={e => setReqId(e.target.value)}
                    placeholder="예) 41316"
                    required
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: '1 1 180px' }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>공급가액 (원) *</label>
                  <input
                    type="number"
                    value={productCost}
                    onChange={e => setProductCost(e.target.value)}
                    placeholder="예) 700000"
                    required
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: '2 1 200px' }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>메모 (선택)</label>
                  <input
                    type="text"
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    placeholder="예) 간판 교체, 구두 계약"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving || !reqId || !productCost}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: reqId && productCost ? '#27ae60' : '#ccc',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  cursor: reqId && productCost ? 'pointer' : 'default'
                }}
              >
                {saving ? '저장 중...' : '등록'}
              </button>
            </form>

            {message && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
                background: message.type === 'success' ? '#f0fff4' : '#fff5f5',
                color: message.type === 'success' ? '#27ae60' : '#e74c3c',
                border: `1px solid ${message.type === 'success' ? '#b7ebc9' : '#fcd5d5'}`,
              }}>
                {message.type === 'success' ? '✅' : '❌'} {message.text}
              </div>
            )}
          </div>

          {/* 목록 */}
          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>등록된 계약 목록</h2>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>불러오는 중...</div>
            ) : list.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#ccc', fontSize: 14 }}>등록된 계약이 없습니다</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                    {['견적번호', '공급가액', '메모', '등록일', ''].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 12px', fontWeight: 700, fontFamily: 'monospace' }}>#{row.req_id}</td>
                      <td style={{ padding: '12px 12px', fontWeight: 600, color: '#27ae60' }}>{fmt(row.product_cost)}원</td>
                      <td style={{ padding: '12px 12px', color: '#666' }}>{row.memo || '-'}</td>
                      <td style={{ padding: '12px 12px', color: '#aaa', fontSize: 12 }}>
                        {new Date(row.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <button
                          onClick={() => handleDelete(row.id, row.req_id)}
                          style={{
                            padding: '4px 10px', borderRadius: 6, border: '1px solid #fcd5d5',
                            background: '#fff5f5', color: '#e74c3c', fontSize: 12, cursor: 'pointer'
                          }}
                        >삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </PasswordProtection>
  )
}
