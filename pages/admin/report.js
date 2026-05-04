import { useState, useEffect } from 'react'
import Link from 'next/link'

// gp001 → CPA01, gp024 → CPA24
function toCPALabel(agentId) {
  if (!agentId) return agentId
  const num = parseInt(agentId.replace(/^gp/i, ''), 10)
  if (isNaN(num)) return agentId
  return 'CPA' + String(num).padStart(2, '0')
}

function toYMD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getLastMonth() {
  const today = new Date()
  const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const last  = new Date(today.getFullYear(), today.getMonth(), 0)
  return { startDate: toYMD(first), endDate: toYMD(last) }
}

function periodLabel(startDate, endDate) {
  if (!startDate || !endDate) return ''
  const s = new Date(startDate)
  const e = new Date(endDate)
  const sLabel = `${s.getFullYear()}년 ${s.getMonth() + 1}월 ${s.getDate()}일`
  const eLabel = `${e.getFullYear()}년 ${e.getMonth() + 1}월 ${e.getDate()}일`
  if (startDate === endDate) return sLabel
  return `${sLabel} ~ ${eLabel}`
}

export default function ReportPage() {
  const [dates, setDates] = useState(getLastMonth)
  const [inputDates, setInputDates] = useState(getLastMonth)
  const [agentStats, setAgentStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [screenshotMode, setScreenshotMode] = useState(false)

  const loadStats = async (d) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate: d.startDate, endDate: d.endDate })
      const res = await fetch(`/api/stats/analytics?${params}`)
      if (res.ok) {
        const result = await res.json()
        setAgentStats(result.agentStats || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats(dates) }, [dates])

  const presets = [
    { label: '지난달', fn: () => getLastMonth() },
    { label: '이번달', fn: () => {
      const t = new Date()
      return { startDate: toYMD(new Date(t.getFullYear(), t.getMonth(), 1)), endDate: toYMD(t) }
    }},
    { label: '오늘', fn: () => { const s = toYMD(new Date()); return { startDate: s, endDate: s } }},
  ]

  const totalClicks = agentStats.reduce((s, a) => s + (a.clicks || 0), 0)
  const totalQuotes = agentStats.reduce((s, a) => s + (a.quotes || 0), 0)

  // 견적요청 내림차순 정렬
  const sorted = [...agentStats].sort((a, b) => (b.quotes || 0) - (a.quotes || 0))

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #0f1117 !important; }
        }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
        background: '#0f1117',
        minHeight: '100vh',
        color: 'white',
      }}>

        {/* 컨트롤 패널 (스크린샷 모드에서 숨김) */}
        {!screenshotMode && (
          <div className="no-print" style={{
            background: '#1a1d2e',
            borderBottom: '1px solid #2d3148',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <Link href="/admin/analytics" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>← 상세통계</span>
            </Link>

            <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {presets.map(p => (
                <button key={p.label} onClick={() => {
                  const r = p.fn()
                  setDates(r)
                  setInputDates(r)
                }} style={{
                  padding: '6px 14px', borderRadius: 6, border: '1px solid #2d3148',
                  background: '#2d3148', color: 'rgba(255,255,255,0.8)',
                  fontSize: 12, cursor: 'pointer', fontWeight: 600,
                }}>{p.label}</button>
              ))}

              <input type="date" value={inputDates.startDate}
                onChange={e => setInputDates(p => ({ ...p, startDate: e.target.value }))}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #2d3148', background: '#1e2235', color: 'white', fontSize: 12 }} />
              <span style={{ color: '#666' }}>~</span>
              <input type="date" value={inputDates.endDate}
                onChange={e => setInputDates(p => ({ ...p, endDate: e.target.value }))}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #2d3148', background: '#1e2235', color: 'white', fontSize: 12 }} />

              <button onClick={() => setDates({ ...inputDates })} style={{
                padding: '6px 16px', borderRadius: 6, border: 'none',
                background: '#4facfe', color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 700,
              }}>조회</button>
            </div>

            <button onClick={() => setScreenshotMode(true)} style={{
              padding: '8px 18px', borderRadius: 6, border: '1px solid #4facfe',
              background: 'transparent', color: '#4facfe',
              fontSize: 12, cursor: 'pointer', fontWeight: 700,
            }}>📸 스크린샷 모드</button>
          </div>
        )}

        {/* 리포트 본문 */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: screenshotMode ? '40px 40px 48px' : '36px 24px 48px' }}>

          {/* 헤더 */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                  borderRadius: 8, padding: '6px 12px',
                  fontSize: 13, fontWeight: 800, letterSpacing: 1,
                }}>GANPOOM</div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Analytics</span>
              </div>
              {screenshotMode && (
                <button onClick={() => setScreenshotMode(false)} className="no-print" style={{
                  padding: '5px 12px', borderRadius: 5, border: '1px solid #2d3148',
                  background: 'transparent', color: 'rgba(255,255,255,0.4)',
                  fontSize: 11, cursor: 'pointer',
                }}>✕ 모드 해제</button>
              )}
            </div>

            <h1 style={{ margin: '20px 0 6px', fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
              CPA 에이전트 실적 리포트
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
              조회 기간: {periodLabel(dates.startDate, dates.endDate)}
            </p>
          </div>

          {/* 요약 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            {[
              { label: '총 접속수', value: totalClicks.toLocaleString(), color: '#4facfe', icon: '👆' },
              { label: '총 견적요청', value: totalQuotes.toLocaleString(), color: '#00f2fe', icon: '📋' },
            ].map(c => (
              <div key={c.label} style={{
                background: '#1a1d2e', borderRadius: 12,
                padding: '22px 24px', border: '1px solid #2d3148',
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{c.label}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* 에이전트 테이블 */}
          <div style={{
            background: '#1a1d2e', borderRadius: 12,
            border: '1px solid #2d3148', overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #2d3148',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>에이전트별 상세 실적</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>총 {sorted.length}명</span>
            </div>

            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>불러오는 중...</div>
            ) : sorted.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>데이터가 없습니다</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['순위', '에이전트', '총 접속수', '견적요청', '전환율'].map((h, i) => (
                      <th key={h} style={{
                        padding: '12px 20px',
                        textAlign: i === 0 ? 'center' : i <= 1 ? 'left' : 'right',
                        fontSize: 11, fontWeight: 700,
                        color: 'rgba(255,255,255,0.35)',
                        letterSpacing: 0.5, textTransform: 'uppercase',
                        borderBottom: '1px solid #2d3148',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((agent, i) => {
                    const convRate = agent.clicks > 0
                      ? ((agent.quotes / agent.clicks) * 100).toFixed(1)
                      : '0.0'
                    const isTop = i === 0 && agent.quotes > 0
                    return (
                      <tr key={agent.agentId} style={{
                        borderBottom: '1px solid rgba(45,49,72,0.6)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                      }}>
                        {/* 순위 */}
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          {i === 0 && agent.quotes > 0 ? (
                            <span style={{ fontSize: 16 }}>🥇</span>
                          ) : i === 1 && agent.quotes > 0 ? (
                            <span style={{ fontSize: 16 }}>🥈</span>
                          ) : i === 2 && agent.quotes > 0 ? (
                            <span style={{ fontSize: 16 }}>🥉</span>
                          ) : (
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{i + 1}</span>
                          )}
                        </td>
                        {/* 에이전트 ID (CPA 표기) */}
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontSize: 14, fontWeight: 700,
                            color: isTop ? '#4facfe' : 'rgba(255,255,255,0.85)',
                          }}>{toCPALabel(agent.agentId)}</span>
                        </td>
                        {/* 접속수 */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                            {(agent.clicks || 0).toLocaleString()}
                          </span>
                        </td>
                        {/* 견적요청 */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <span style={{
                            fontSize: 16, fontWeight: 800,
                            color: agent.quotes > 0 ? '#00f2fe' : 'rgba(255,255,255,0.2)',
                          }}>
                            {agent.quotes}건
                          </span>
                        </td>
                        {/* 전환율 */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <span style={{
                            fontSize: 13, fontWeight: 600,
                            color: parseFloat(convRate) >= 5 ? '#52c41a'
                              : parseFloat(convRate) >= 2 ? '#faad14'
                              : 'rgba(255,255,255,0.35)',
                          }}>{convRate}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* 푸터 */}
          <div style={{
            marginTop: 28, textAlign: 'center',
            fontSize: 11, color: 'rgba(255,255,255,0.2)',
          }}>
            Ganpoom Analytics · {dates.startDate} ~ {dates.endDate}
          </div>

        </div>
      </div>
    </>
  )
}
