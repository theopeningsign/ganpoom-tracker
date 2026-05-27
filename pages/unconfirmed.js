import { useState, useCallback } from 'react'
import Link from 'next/link'
import PasswordProtection from '../components/PasswordProtection'

const CHANNEL_LABELS = {
  'naver.searchad': 'N(link)',
  'naver_powercontents': 'N(pwc)',
  'google': '구글광고',
  'google.adwords': 'G(앱)',
  'tenping_web': '텐핑',
  'agency': 'CPA',
  'naver_blog_official': 'N(blog)',
  'instagram_official': '인스타그램',
  'unattributed': '자연유입',
}

const CHANNEL_COLORS = {
  'naver.searchad': '#03C75A',
  'naver_powercontents': '#00A0E9',
  'google': '#4285F4',
  'google.adwords': '#34A853',
  'tenping_web': '#FF6B35',
  'agency': '#9B59B6',
  'naver_blog_official': '#00C73C',
  'instagram_official': '#E1306C',
  'unattributed': '#95A5A6',
}

const CONTRACT_STATUS = {
  0: { label: '미제출', color: '#ccc' },
  1: { label: '제출', color: '#4facfe' },
  2: { label: '검토중', color: '#f39c12' },
  3: { label: '계약진행', color: '#27ae60' },
  4: { label: '시공완료', color: '#2980b9' },
}

const NAV = [
  { href: '/', label: '대시보드', icon: '📊' },
  { href: '/channels', label: '채널 분석', icon: '📡' },
  { href: '/unconfirmed', label: '미확인 계약', icon: '⚠️' },
  { href: '/adcosts', label: '광고비 입력', icon: '💸' },
  { href: '/admin/agents', label: 'CPA 에이전트', icon: '👥' },
  { href: '/admin/settlement', label: '정산 관리', icon: '💰' },
  { href: '/admin/contracts', label: '계약 수기 입력', icon: '✍️' },
]

function fmtDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function DaysBadge({ days }) {
  const color = days >= 30 ? '#e74c3c' : days >= 21 ? '#f39c12' : '#4facfe'
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: color + '20', color,
    }}>
      {days}일 경과
    </span>
  )
}

const RECHECK_BADGE = {
  contracted: { label: '⚠️ 계약 진행됨', bg: '#fff3cd', color: '#856404', border: '#ffc107' },
  deleted: { label: '🗑️ 견적 삭제됨', bg: '#f8d7da', color: '#842029', border: '#f5c2c7' },
}

function ContractCard({ item, contacted, onContact, onUndo, recheckStatus }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const chColor = contacted ? '#aaa' : (CHANNEL_COLORS[item.channel] || '#bbb')
  const chLabel = CHANNEL_LABELS[item.channel] || item.channel
  const statusBadge = !contacted && recheckStatus && RECHECK_BADGE[recheckStatus]

  async function copyPhone(e) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(item.customer_phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API 실패 시 fallback
      const el = document.createElement('textarea')
      el.value = item.customer_phone
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleContact(e) {
    e.stopPropagation()
    setSaving(true)
    try {
      const res = await fetch('/api/unconfirmed/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ req_id: item.req_id }),
      })
      if ((await res.json()).success) onContact(item.req_id)
    } finally {
      setSaving(false)
    }
  }

  async function handleUndo(e) {
    e.stopPropagation()
    setSaving(true)
    try {
      const res = await fetch('/api/unconfirmed/status', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ req_id: item.req_id }),
      })
      if ((await res.json()).success) onUndo(item.req_id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: contacted ? '#f5f5f5' : statusBadge ? statusBadge.bg : 'white',
      borderRadius: 12, marginBottom: 10,
      boxShadow: contacted ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
      borderLeft: `5px solid ${statusBadge ? statusBadge.border : chColor}`,
      overflow: 'hidden',
      opacity: contacted ? 0.6 : 1,
      filter: contacted ? 'grayscale(100%)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      {/* 메인 행 */}
      <div
        className="card-inner"
        onClick={() => setOpen(o => !o)}
        style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}
      >
        {/* req_id + 경과일 */}
        <div className="card-id" style={{ minWidth: 90 }}>
          <div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 3 }}>견적번호</div>
            <div className="card-id-num" style={{ fontSize: 16, fontWeight: 800, color: contacted ? '#999' : '#333' }}>#{item.req_id}</div>
          </div>
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {contacted
              ? <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#e8f5e9', color: '#4caf50' }}>✅ 연락완료</span>
              : <DaysBadge days={item.days_since} />
            }
            {statusBadge && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: statusBadge.border + '30', color: statusBadge.color,
                whiteSpace: 'nowrap',
              }}>
                {statusBadge.label}
              </span>
            )}
          </div>
        </div>

        <div className="card-div" style={{ width: 1, background: '#f0f0f0', alignSelf: 'stretch', flexShrink: 0 }} />

        {/* 견적 요청일시 */}
        <div className="card-date" style={{ minWidth: 130 }}>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 3 }}>견적요청일시</div>
          <div style={{ fontSize: 13, color: '#888' }}>{fmtDate(item.created_at)}</div>
        </div>

        <div className="card-div" style={{ width: 1, background: '#f0f0f0', alignSelf: 'stretch', flexShrink: 0 }} />

        {/* 고객 정보 */}
        <div className="card-customer" style={{ minWidth: 160, flex: 1 }}>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 3 }}>고객 정보</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {item.customer_name && (
              <span className="card-customer-name" style={{ fontSize: 14, fontWeight: 700, color: contacted ? '#999' : '#222' }}>{item.customer_name}</span>
            )}
            {item.customer_phone && (
              <button
                className="card-phone-btn"
                onClick={copyPhone}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                  border: `1px solid ${copied ? '#22c55e' : (contacted ? '#ddd' : '#4facfe')}`,
                  background: copied ? '#f0fdf4' : (contacted ? '#f5f5f5' : '#f0f8ff'),
                  color: copied ? '#22c55e' : (contacted ? '#aaa' : '#4facfe'),
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? '✅ 복사됨!' : `📋 ${item.customer_phone}`}
              </button>
            )}
            {!item.customer_name && !item.customer_phone && (
              <span style={{ fontSize: 12, color: '#ccc' }}>정보 없음</span>
            )}
          </div>
          {item.address && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>📍 {item.address}</div>
          )}
          {item.title && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>🏪 {item.title}</div>
          )}
          {/* 모바일에서만 보이는 날짜 + 파트너 수 */}
          <div className="card-meta-mobile" style={{ display: 'none', fontSize: 11, color: '#bbb', marginTop: 6 }}>
            {fmtDate(item.created_at)} · 업체 {item.consultation.length}개
          </div>
        </div>

        <div className="card-div" style={{ width: 1, background: '#f0f0f0', alignSelf: 'stretch', flexShrink: 0 }} />

        {/* 채널 + 액션 버튼 */}
        <div className="card-actions" style={{ minWidth: 110, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: chColor + '20', color: chColor,
          }}>{chLabel}</span>

          <div className="card-partner-count" style={{ fontSize: 12, color: '#aaa' }}>
            업체 {item.consultation.length}개
          </div>

          {/* 연락완료 / 취소 버튼 */}
          {contacted ? (
            <button
              onClick={handleUndo}
              disabled={saving}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 6,
                border: '1px solid #ddd', background: 'white', color: '#999',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {saving ? '...' : '↩ 취소'}
            </button>
          ) : (
            <button
              onClick={handleContact}
              disabled={saving}
              style={{
                fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 6,
                border: 'none', background: saving ? '#ccc' : '#22c55e', color: 'white',
                cursor: saving ? 'default' : 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {saving ? '...' : '✅ 연락완료'}
            </button>
          )}

          <div className="card-detail-toggle" style={{ fontSize: 11, color: '#bbb' }}>{open ? '▲ 접기' : '▼ 상세'}</div>
        </div>
      </div>

      {/* 모바일 전용 상세 보기 바 — 연락완료 버튼과 완전히 분리 */}
      <div
        className="card-detail-mobile-bar"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'none',  /* 모바일 CSS에서 flex로 전환 */
          borderTop: '1px solid #eee',
          padding: '10px 16px',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: '#888',
          cursor: 'pointer',
          userSelect: 'none',
          background: open ? '#f5f5f5' : 'transparent',
        }}
      >
        <span>{open ? '▲' : '▼'}</span>
        <span>{open ? '상세 접기' : `상세 보기 (업체 ${item.consultation.length}개)`}</span>
      </div>

      {/* 상세 패널 — 연락완료 항목도 펼쳐볼 수 있게 */}
      {open && (
        <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', background: contacted ? '#f9f9f9' : '#fafafa' }}>
          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* 제안서 목록 */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 }}>
                📄 제안서 ({item.contractors.length}건)
              </div>
              {item.contractors.length === 0 ? (
                <div style={{ fontSize: 12, color: '#ccc' }}>없음</div>
              ) : item.contractors.map((c, i) => {
                const st = CONTRACT_STATUS[c.status] || { label: `${c.status}`, color: '#aaa' }
                return (
                  <div key={i} style={{
                    padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                    background: 'white', border: '1px solid #eee',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{c.name || '(미확인)'}</div>
                      {c.amount > 0 && (
                        <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{c.amount.toLocaleString()}원</div>
                      )}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      background: st.color + '20', color: st.color,
                    }}>{st.label}</span>
                  </div>
                )
              })}
            </div>

            {/* 상담 기록 */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 }}>
                💬 상담 기록 ({item.consultation.length}건)
              </div>
              {item.consultation.map((c, i) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                  background: 'white', border: '1px solid #eee',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{c.name || '(미확인)'}</span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 12,
                      background: c.is_callclick ? '#e8f9ee' : '#f5f5f5',
                      color: c.is_callclick ? '#27ae60' : '#bbb',
                    }}>
                      {c.is_callclick ? '📞 전화' : '전화없음'}
                    </span>
                  </div>
                  {c.memo && (
                    <div style={{ fontSize: 12, color: '#888', padding: '4px 6px', background: '#f9f9f9', borderRadius: 4, marginTop: 4 }}>
                      {c.memo}
                    </div>
                  )}
                  {c.joined_at && (
                    <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>{fmtDate(c.joined_at)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UnconfirmedPage() {
  const [items, setItems] = useState([])       // 미확인 항목
  const [contacted, setContacted] = useState(new Set()) // 연락완료 req_id 집합
  const [loading, setLoading] = useState(false)
  const [daysBack, setDaysBack] = useState(60)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)
  const [showContacted, setShowContacted] = useState(true)
  const [recheckResults, setRecheckResults] = useState({})  // { [req_id]: 'contracted' | 'deleted' | 'active' }
  const [rechecking, setRechecking] = useState(false)

  async function recheckStatus(pendingIds) {
    if (pendingIds.length === 0) return
    setRechecking(true)
    try {
      const res = await fetch(`/api/unconfirmed/recheck?req_ids=${pendingIds.join(',')}`)
      const data = await res.json()
      if (data.success) setRecheckResults(data.results || {})
    } catch {
      // 실패해도 기존 목록 유지
    } finally {
      setRechecking(false)
    }
  }

  async function fetchData() {
    setLoading(true)
    setError(null)
    setRecheckResults({})
    try {
      const [dataRes, statusRes] = await Promise.all([
        fetch(`/api/unconfirmed?daysBack=${daysBack}`),
        fetch('/api/unconfirmed/status'),
      ])
      const [data, statusData] = await Promise.all([dataRes.json(), statusRes.json()])

      if (!data.success) throw new Error(data.error || '오류 발생')

      setItems(data.items || [])
      setSummary({ total: data.total, scanned: data.scanned })

      // 이번 조회 결과 중 이미 연락완료된 것도 UI에 반영
      const contactedSet = new Set((statusData.req_ids || []).map(Number))
      setContacted(contactedSet)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleContact = useCallback((reqId) => {
    setContacted(prev => new Set([...prev, reqId]))
  }, [])

  const handleUndo = useCallback((reqId) => {
    setContacted(prev => {
      const next = new Set(prev)
      next.delete(reqId)
      return next
    })
  }, [])

  // 미확인(연락 안 한) 항목 / 연락완료 항목 분리
  const pendingItems = items.filter(i => !contacted.has(i.req_id))
  const contactedItems = items.filter(i => contacted.has(i.req_id))

  return (
    <PasswordProtection>
      <style>{`
        @media (max-width: 768px) {
          .uc-sidebar { display: none !important; }
          .uc-main { margin-left: 0 !important; padding: 12px !important; }
          .card-inner { flex-direction: column !important; gap: 10px !important; padding: 14px 14px !important; }
          .card-div { display: none !important; }
          .card-id { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; min-width: unset !important; }
          .card-id-num { font-size: 14px !important; }
          .card-date { display: none !important; }
          .card-customer { min-width: unset !important; width: 100% !important; }
          .card-customer-name { font-size: 17px !important; }
          .card-phone-btn { font-size: 15px !important; padding: 6px 14px !important; }
          .card-actions { flex-direction: row !important; min-width: unset !important; width: 100% !important; justify-content: space-between !important; align-items: center !important; text-align: left !important; }
          .card-detail-toggle { display: none !important; }
          .card-detail-mobile-bar { display: flex !important; }
          .card-partner-count { display: none !important; }
          .card-meta-mobile { display: block !important; }
          .uc-header { flex-direction: column !important; gap: 10px !important; }
          .uc-header-controls { width: 100% !important; }
          .uc-summary-banner { flex-wrap: wrap !important; gap: 12px !important; }
          .summary-divider { display: none !important; }
          .detail-grid { grid-template-columns: 1fr !important; }
          .uc-mobile-nav { display: flex !important; }
          .uc-main { padding-top: 64px !important; }
        }
        .uc-mobile-nav { display: none; }
      `}</style>

      <div style={{ background: '#f5f6fa', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        {/* 모바일 상단 네비바 */}
        <div className="uc-mobile-nav" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          background: '#1a1d2e', height: 52,
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>⚠️ 미확인 계약</div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.1)', borderRadius: 20,
              padding: '6px 14px', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600,
            }}>
              <span>📊</span><span>대시보드</span>
            </div>
          </Link>
        </div>

        {/* 사이드바 */}
        <div className="uc-sidebar" style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
          background: '#1a1d2e', color: 'white', padding: '24px 0', zIndex: 100,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Ganpoom</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Analytics</div>
          </div>
          <nav style={{ flex: 1, padding: '16px 0' }}>
            {NAV.map(({ href, label, icon }) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 20px', fontSize: 14, color: 'rgba(255,255,255,0.75)',
                  background: href === '/unconfirmed' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderLeft: href === '/unconfirmed' ? '3px solid #f97316' : '3px solid transparent',
                }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* 메인 */}
        <div className="uc-main" style={{ marginLeft: 220, padding: 32 }}>

          {/* 헤더 */}
          <div className="uc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>⚠️ 미확인 계약 알림판</h1>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888' }}>
                상담 참여 후 2주 이상 경과했으나 계약이 확인되지 않은 견적 목록
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                value={daysBack}
                onChange={e => setDaysBack(Number(e.target.value))}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: 'white' }}
              >
                <option value={30}>최근 30일</option>
                <option value={60}>최근 60일</option>
                <option value={90}>최근 90일</option>
                <option value={180}>최근 180일</option>
              </select>
              <button
                onClick={fetchData}
                disabled={loading}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: loading ? '#ccc' : '#f97316',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer',
                }}
              >
                {loading ? '⏳ 조회중...' : '🔍 조회'}
              </button>
            </div>
          </div>

          {/* 로딩 */}
          {loading && (
            <div style={{
              background: 'white', borderRadius: 14, padding: 48,
              textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 15, color: '#555', fontWeight: 600 }}>미확인 계약 확인 중...</div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
                백엔드 API 다중 조회로 시간이 걸릴 수 있습니다 (30초 내외)
              </div>
            </div>
          )}

          {/* 에러 */}
          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 12,
              padding: 20, color: '#e74c3c', fontSize: 14,
            }}>
              ❌ {error}
            </div>
          )}

          {/* 초기 안내 */}
          {!loading && items.length === 0 && !error && !summary && (
            <div style={{
              background: 'white', borderRadius: 14, padding: 60,
              textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 8 }}>미확인 계약 알림판</div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>
                상담 참여 후 <strong>2주 이상 경과</strong>했으나 계약이 확인되지 않은 견적을 보여줍니다.
              </div>
              <button
                onClick={fetchData}
                style={{
                  marginTop: 24, padding: '12px 28px', borderRadius: 10, border: 'none',
                  background: '#f97316', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                🔍 조회 시작
              </button>
            </div>
          )}

          {/* 결과 */}
          {summary && !loading && (
            <>
              {/* 요약 배너 */}
              <div className="uc-summary-banner" style={{
                background: 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
                borderRadius: 14, padding: '20px 28px', marginBottom: 24,
                boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0,
              }}>
                <div style={{ marginRight: 36 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>⚠️ 미확인 (이번 조회)</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>연락완료 제외됨</div>
                </div>
                <div className="summary-divider" style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.2)', marginRight: 28 }} />
                <div style={{ marginRight: 36 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>미연락</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>{pendingItems.length}건</div>
                </div>
                <div className="summary-divider" style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.2)', marginRight: 28 }} />
                <div style={{ marginRight: 36 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>이번 조회에서 연락완료</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#bbf7d0' }}>{contactedItems.length}건</div>
                </div>
                <div className="summary-divider" style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.2)', marginRight: 28 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>스캔한 견적 수</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{summary.scanned}건</div>
                </div>
              </div>

              {/* 미연락 항목 */}
              {pendingItems.length === 0 ? (
                <div style={{
                  background: 'white', borderRadius: 14, padding: 48,
                  textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20,
                }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>모든 항목에 연락 완료!</div>
                </div>
              ) : (
                <div style={{ marginBottom: 24 }}>
                  {/* 미연락 섹션 헤더 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, color: '#888' }}>
                      📋 미연락 <strong style={{ color: '#f97316' }}>{pendingItems.length}건</strong>
                      {pendingItems.filter(i => i.days_since >= 30).length > 0 && (
                        <span style={{ marginLeft: 12, color: '#e74c3c', fontWeight: 700 }}>
                          🔴 30일 이상 {pendingItems.filter(i => i.days_since >= 30).length}건
                        </span>
                      )}
                    </div>

                    {/* 상태 재확인 버튼 */}
                    <button
                      onClick={() => recheckStatus(pendingItems.map(i => i.req_id))}
                      disabled={rechecking}
                      style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 6,
                        border: '1px solid #ddd', background: rechecking ? '#f5f5f5' : 'white',
                        color: rechecking ? '#aaa' : '#555',
                        cursor: rechecking ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {rechecking ? '⏳ 확인 중...' : '🔄 상태 재확인'}
                    </button>

                    {/* 재확인 결과 요약 */}
                    {!rechecking && Object.keys(recheckResults).length > 0 && (() => {
                      const contracted = Object.values(recheckResults).filter(v => v === 'contracted').length
                      const deleted = Object.values(recheckResults).filter(v => v === 'deleted').length
                      if (contracted === 0 && deleted === 0) return (
                        <span style={{ fontSize: 12, color: '#27ae60' }}>✅ 변경 없음</span>
                      )
                      return (
                        <span style={{ fontSize: 12, color: '#e74c3c', fontWeight: 700 }}>
                          {contracted > 0 && `⚠️ 계약됨 ${contracted}건`}
                          {contracted > 0 && deleted > 0 && ' · '}
                          {deleted > 0 && `🗑️ 삭제됨 ${deleted}건`}
                        </span>
                      )
                    })()}
                  </div>

                  {pendingItems.map(item => (
                    <ContractCard
                      key={item.req_id}
                      item={item}
                      contacted={false}
                      onContact={handleContact}
                      onUndo={handleUndo}
                      recheckStatus={recheckResults[item.req_id]}
                    />
                  ))}
                </div>
              )}

              {/* 연락완료 항목 (흑백) */}
              {contactedItems.length > 0 && (
                <div>
                  <div
                    onClick={() => setShowContacted(s => !s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 13, color: '#aaa', marginBottom: 10, cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <span>{showContacted ? '▼' : '▶'}</span>
                    <span>✅ 연락완료 <strong>{contactedItems.length}건</strong></span>
                    <span style={{ fontSize: 11, color: '#ccc' }}>(다음 조회부터 자동 제외)</span>
                  </div>
                  {showContacted && contactedItems.map(item => (
                    <ContractCard
                      key={item.req_id}
                      item={item}
                      contacted={true}
                      onContact={handleContact}
                      onUndo={handleUndo}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PasswordProtection>
  )
}
