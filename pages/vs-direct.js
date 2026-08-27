/**
 * 간품 vs 간판다이렉트 통합 비교 (2026-08-27)
 *
 * 기존에 엑셀로 손으로 관리하던 월별 비교표를 그대로 옮긴 화면.
 *  - 우리 숫자: /api/stats/monthly-quotes  (events 테이블, 대시보드 '전체 견적요청'과 동일 기준)
 *  - 저쪽 숫자: /api/direct/monthly        (gpdirect 월별 CSV, 카운트만)
 *
 * ⚠️ 두 숫자는 정의가 다르다. 우리 건 이벤트 기반 실측이고,
 *    저쪽 건 공개 게시판에 노출된 분량이라 실제 접수량의 하한선이다.
 *    그래서 화면에서도 '차이' 를 단정적으로 쓰지 않고 하단에 성격을 명시한다.
 */
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts'
import PasswordProtection from '../components/PasswordProtection'
import { DIRECT_COMPARE_FROM, TRACKER_RELIABLE_FROM } from '../lib/constants'

const OURS = '#4472C4'    // 엑셀에서 쓰던 파랑
const THEIRS = '#ED7D31'  // 엑셀에서 쓰던 주황

const NAV = [
  { href: '/', label: '대시보드', icon: '📊' },
  { href: '/channels', label: '채널 분석', icon: '📡' },
  { href: '/vs-direct', label: '간품 vs 다이렉트', icon: '⚔️' },
  { href: '/unconfirmed', label: '미확인 계약', icon: '⚠️' },
  { href: '/adcosts', label: '광고비 입력', icon: '💸' },
  { href: '/admin/agents', label: 'CPA 에이전트', icon: '👥' },
  { href: '/admin/settlement', label: '정산 관리', icon: '💰' },
  { href: '/admin/contracts', label: '계약 수기 입력', icon: '✍️' },
]

function Sidebar({ current }) {
  return (
    <div className="gp-sidebar" style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
      background: '#1a1d2e', color: 'white', padding: '24px 0', zIndex: 100,
      display: 'flex', flexDirection: 'column'
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
              background: href === current ? 'rgba(255,255,255,0.1)' : 'transparent',
              borderLeft: href === current ? '3px solid #4facfe' : '3px solid transparent',
            }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  )
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`)

/** UTC ISO 문자열을 KST 날짜(YYYY-MM-DD)로. 값이 이상하면 null. */
function kstDate(iso) {
  if (typeof iso !== 'string') return null
  const ms = new Date(iso).getTime()
  if (!Number.isFinite(ms)) return null
  return new Date(ms + 9 * 3600 * 1000).toISOString().slice(0, 10)
}

export default function VsDirectPage() {
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const [ours, setOurs] = useState(null)
  const [theirs, setTheirs] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    // 한쪽이 실패해도 나머지는 보여준다.
    const [o, t] = await Promise.all([
      fetch(`/api/stats/monthly-quotes?year=${year}`).then(r => r.json()).catch(() => null),
      fetch(`/api/direct/monthly?year=${year}`).then(r => r.json()).catch(() => null),
    ])
    setOurs(o?.success ? o : null)
    setTheirs(t?.success ? t : (t || null))
    setLoading(false)
  }, [year])

  useEffect(() => { load() }, [load])

  const ourMonthly = Array.isArray(ours?.monthly) ? ours.monthly : []
  const theirMonthly = Array.isArray(theirs?.monthly) ? theirs.monthly : []
  const directConfigured = theirs?.configured !== false

  // ── 어느 달부터 비교해도 되는가 ────────────────────────────────────
  // 네 가지를 함께 보고 '가장 늦은 시점'을 비교 시작 월로 잡는다.
  //   ① DIRECT_COMPARE_FROM  — 저쪽 데이터 신뢰 시작 (운영자 판단, 2026-03)
  //   ② 저쪽 실제 수집 시작일 (firstScrapedAt) — 데이터가 스스로 말해주는 사실
  // 우리 쪽은 여기서 안 막는다. 트래커가 제대로 돌기 전 달은 API 가 엑셀 확정치(MANUAL_QUOTES)로
  // 채워서 내려주고, 그것도 없는 달만 reliable:false 로 표시된다 → 아래에서 그 달만 뺀다.
  // 이렇게 해야 3~5월(우리는 수기값, 저쪽은 정상 수집)이 비교에서 살아남는다.
  // 'YYYY-MM-DD…' 문자열 → 온전히 집계되는 첫 달(YYYY-MM).
  // 1일부터 데이터가 있으면 그 달부터, 아니면 다음 달부터.
  const firstFullMonth = (ymd) => {
    if (typeof ymd !== 'string' || ymd.length < 10) return null
    const y = parseInt(ymd.slice(0, 4), 10)
    const m = parseInt(ymd.slice(5, 7), 10)
    const day = parseInt(ymd.slice(8, 10), 10)
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(day)) return null
    if (day <= 1) return `${y}-${String(m).padStart(2, '0')}`
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
  }

  // 저쪽 수집 시작
  const autoFromDirect = firstFullMonth(theirs?.firstScrapedAt)

  const compareFrom = [DIRECT_COMPARE_FROM, autoFromDirect].filter(Boolean).sort().pop() || null

  const now = new Date()
  const runningMonth = year === now.getFullYear() ? now.getMonth() + 1 : null

  // 표·차트용 행. 양쪽 다 0인 달(아직 안 온 달)은 빼서 빈 막대가 늘어서지 않게 한다.
  const rows = MONTH_LABELS.map((label, i) => {
    const om = ourMonthly[i]
    const a = om?.count ?? 0
    const b = theirMonthly[i]?.count ?? 0
    const m = i + 1
    const key = `${year}-${String(m).padStart(2, '0')}`
    // 우리 쪽 수치를 못 믿는 달(트래커 도입 전 + 수기값도 없음)도 비교에서 뺀다.
    const ourUnreliable = om ? om.reliable === false : false
    return {
      label, month: m, ours: a, theirs: b, diff: a - b,
      manual: om?.source === 'manual',
      excluded: Boolean((compareFrom && key < compareFrom) || ourUnreliable),
      running: runningMonth === m,
    }
  })
  const active = rows.filter(r => r.ours > 0 || r.theirs > 0)

  // 요약·합계는 전부 '비교 구간' 기준으로 통일한다.
  // 제외된 달의 숫자도 표에는 그대로 두되(숨기지 않음) 회색으로 흐리고 합계에서 뺀다.
  const comparable = active.filter(r => !r.excluded && r.ours > 0 && r.theirs > 0)
  const sumOurs = comparable.reduce((s, r) => s + r.ours, 0)
  const sumTheirs = comparable.reduce((s, r) => s + r.theirs, 0)
  const winMonths = comparable.filter(r => r.diff > 0).length
  const cmpDiff = sumOurs - sumTheirs
  const cmpLabel = comparable.length > 0
    ? `${comparable[0].month}~${comparable[comparable.length - 1].month}월 기준`
    : '비교 가능한 달 없음'
  const excludedMonths = active.filter(r => r.excluded).map(r => r.month)

  const years = Array.from({ length: 4 }, (_, i) => thisYear - i)

  return (
    <>
      <style suppressHydrationWarning>{`
        @media (max-width: 768px) {
          .gp-sidebar { display: none !important; }
          .gp-mobile-nav { display: flex !important; }
          .gp-main { margin-left: 0 !important; padding: 12px !important; padding-top: 60px !important; }
          .vs-cards { grid-template-columns: 1fr !important; }
          .vs-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px; }
        }
        .gp-mobile-nav { display: none; }
        .vs-scroll-hint { display: none; }
        @media (max-width: 768px) { .vs-scroll-hint { display: block !important; } }
        .vs-table { border-collapse: collapse; min-width: 760px; }
        .vs-table th, .vs-table td { padding: 10px 12px; text-align: center; font-size: 13px; white-space: nowrap; }
        .vs-table thead th { background: #fafafa; color: #888; font-weight: 600; border-bottom: 1px solid #eee; }
        .vs-table tbody tr { border-bottom: 1px solid #f5f5f5; }
        .vs-table .rowhead { text-align: left; font-weight: 700; color: white; border-radius: 4px; }
      `}</style>

      {/* 모바일 상단 네비바 */}
      <div className="gp-mobile-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: '#1a1d2e', height: 52,
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>⚔️ 간품 vs 다이렉트</div>
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

      <PasswordProtection>
        <div style={{ background: '#f5f6fa', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
          <Sidebar current="/vs-direct" />
          <div className="gp-main" style={{ marginLeft: 220, padding: 32 }}>

            <div className="vs-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>간품 vs 간판다이렉트</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>월별 견적요청 건수 비교</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: 'white' }}>
                  {years.map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
                <button onClick={load} disabled={loading}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: 'white', fontSize: 13, cursor: loading ? 'default' : 'pointer', color: '#666' }}>
                  {loading ? '불러오는 중…' : '↻ 새로고침'}
                </button>
              </div>
            </div>

            {!directConfigured && (
              <div style={{ background: '#fff8e1', border: '1px solid #ffe0a3', color: '#8a6d3b', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 20 }}>
                ⚠️ 다이렉트 데이터를 읽을 토큰(<code>GPDIRECT_GITHUB_TOKEN</code>)이 설정되지 않아 저쪽 숫자가 0으로 표시됩니다. 우리 숫자는 정상입니다.
              </div>
            )}

            {/* 연간 요약 */}
            <div className="vs-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <SummaryCard label={`간판의품격 (${cmpLabel.replace(' 기준', '')})`} value={sumOurs.toLocaleString()} sub={`${comparable.length}개월 누적`} color={OURS} />
              <SummaryCard
                label={`간판다이렉트 (${cmpLabel.replace(' 기준', '')})`}
                value={sumTheirs.toLocaleString()}
                sub="게시판 노출 기준 (하한선)"
                color={THEIRS}
              />
              <SummaryCard
                label="차이"
                value={`${cmpDiff >= 0 ? '+' : ''}${cmpDiff.toLocaleString()}`}
                sub={comparable.length > 0 ? `${comparable.length}개월 중 ${winMonths}개월 우세` : cmpLabel}
                color={cmpDiff >= 0 ? '#27ae60' : '#e74c3c'}
              />
            </div>

            {/* 월별 표 — 엑셀에서 보던 배치 그대로 */}
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 15 }}>
                견적요청 건수
                <span className="vs-scroll-hint" style={{ fontSize: 11, color: '#bbb', fontWeight: 400, marginTop: 4 }}>
                  표를 좌우로 밀어서 나머지 달을 볼 수 있습니다 →
                </span>
              </div>
              <div style={{ overflowX: 'auto', padding: '0 12px 12px' }}>
                <table className="vs-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', minWidth: 110 }}></th>
                      {MONTH_LABELS.map(m => <th key={m}>{m}</th>)}
                      <th style={{ borderLeft: '1px solid #eee' }}>
                        합계
                        <div style={{ fontSize: 10, color: '#bbb', fontWeight: 400 }}>{cmpLabel.replace(' 기준', '')}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left' }}>
                        <span className="rowhead" style={{ background: OURS, padding: '4px 10px', display: 'inline-block' }}>간판의품격</span>
                      </td>
                      {rows.map(r => (
                        <td key={r.month}
                          title={r.manual ? '트래커 도입 전 기간이라 엑셀 확정치를 사용합니다' : undefined}
                          style={{
                            fontWeight: r.ours > 0 && !r.excluded ? 600 : 400,
                            color: r.ours <= 0 ? '#ddd' : r.excluded ? '#c4c9d0' : '#1a1a1a',
                          }}>
                          {r.ours > 0 ? r.ours.toLocaleString() : '-'}
                          {r.manual && r.ours > 0 && <sup style={{ color: '#f39c12', marginLeft: 1 }}>수</sup>}
                        </td>
                      ))}
                      <td style={{ borderLeft: '1px solid #eee', fontWeight: 700 }}>{sumOurs.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left' }}>
                        <span className="rowhead" style={{ background: THEIRS, padding: '4px 10px', display: 'inline-block' }}>간판다이렉트</span>
                      </td>
                      {rows.map(r => (
                        <td key={r.month}
                          title={r.excluded ? '비교 대상에서 제외된 달입니다 (표 아래 설명 참고)' : undefined}
                          style={{
                            fontWeight: r.theirs > 0 && !r.excluded ? 600 : 400,
                            color: r.theirs <= 0 ? '#ddd' : r.excluded ? '#c4c9d0' : '#1a1a1a',
                          }}>
                          {r.theirs > 0 ? r.theirs.toLocaleString() : '-'}
                          {r.excluded && r.theirs > 0 && <sup style={{ color: '#c4c9d0' }}>*</sup>}
                        </td>
                      ))}
                      <td style={{ borderLeft: '1px solid #eee', fontWeight: 700 }}>{sumTheirs.toLocaleString()}</td>
                    </tr>
                    <tr style={{ background: '#fafbfc' }}>
                      <td style={{ textAlign: 'left', fontWeight: 700, color: '#666' }}>차이</td>
                      {rows.map(r => {
                        const ok = r.ours > 0 && r.theirs > 0 && !r.excluded
                        return (
                          <td key={r.month}
                            title={r.excluded ? '비교 대상에서 제외된 달입니다 (표 아래 설명 참고)' : undefined}
                            style={{
                              fontWeight: 700,
                              color: !ok ? '#ddd' : r.diff > 0 ? '#27ae60' : r.diff < 0 ? '#e74c3c' : '#999'
                            }}>
                            {!ok ? '-' : `${r.diff > 0 ? '+' : ''}${r.diff.toLocaleString()}`}
                          </td>
                        )
                      })}
                      <td style={{ borderLeft: '1px solid #eee', fontWeight: 700, color: cmpDiff >= 0 ? '#27ae60' : '#e74c3c' }}>
                        {cmpDiff >= 0 ? '+' : ''}{cmpDiff.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '0 24px 16px', fontSize: 12, color: '#999', lineHeight: 1.7 }}>
                {excludedMonths.length > 0 && (
                  <div>
                    <span style={{ color: '#c4c9d0' }}>*</span> {excludedMonths.join('·')}월은 <b>비교에서 제외</b>했습니다. 숫자는 참고용으로 회색 표시만 해뒀습니다.
                    <div style={{ marginTop: 4, paddingLeft: 12 }}>
                      {compareFrom === DIRECT_COMPARE_FROM && (
                        <div>· 다이렉트 스크래핑 초기 구간 — 1월은 날짜 수집 기능이 없던 시절 자료를 통째로 넣은 것이고, 2월은 수집을 막 시작한 달입니다.</div>
                      )}
                      {autoFromDirect && compareFrom === autoFromDirect && (
                        <div>· 다이렉트 수집이 <b>{String(theirs?.firstScrapedAt).slice(0, 10)}</b>부터 시작돼 그 이전은 저쪽이 부분 집계입니다.</div>
                      )}
                      {rows.some(r => r.excluded && r.ours > 0 && !r.manual && `${year}-${String(r.month).padStart(2, '0')}` >= (compareFrom || '')) && (
                        <div>· 트래커가 제대로 돌기 전({TRACKER_RELIABLE_FROM} 이전)인데 엑셀 확정치도 없는 달입니다.</div>
                      )}
                    </div>
                  </div>
                )}
                {rows.some(r => r.manual && r.ours > 0) && (
                  <div>
                    <span style={{ color: '#f39c12' }}>수</span> 표시는 <b>트래커 도입 전({TRACKER_RELIABLE_FROM} 이전) 기간</b>이라
                    기존에 관리하시던 <b>엑셀 확정치</b>를 쓴 달입니다. {TRACKER_RELIABLE_FROM}부터는 트래커 실측입니다.
                    수치를 고치려면 <code>lib/constants.js</code> 의 <code>MANUAL_QUOTES</code> 표를 수정하세요.
                  </div>
                )}
                <div>· 합계·요약 카드는 모두 <b>{cmpLabel.replace(' 기준', '')} 구간</b>만 더한 값입니다.</div>
                {runningMonth && rows[runningMonth - 1] && (rows[runningMonth - 1].ours > 0 || rows[runningMonth - 1].theirs > 0) && (
                  <div>· {runningMonth}월은 <b>아직 진행 중</b>인 달입니다.</div>
                )}
              </div>
            </div>

            {/* 월별 그래프 */}
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 24, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 20 }}>
                월별 견적요청 건수
                {excludedMonths.length > 0 && (
                  <span style={{ fontSize: 11, color: '#bbb', fontWeight: 400, marginLeft: 8 }}>
                    · {excludedMonths.join('·')}월 제외
                  </span>
                )}
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 80, color: '#bbb', fontSize: 13 }}>불러오는 중…</div>
              ) : active.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 80, color: '#bbb', fontSize: 13 }}>데이터가 없습니다</div>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={comparable.length > 0 ? comparable : active} margin={{ top: 20, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v, name) => [v.toLocaleString() + '건', name]} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="ours" name="간판의품격" fill={OURS} radius={[3, 3, 0, 0]} maxBarSize={38}>
                      <LabelList dataKey="ours" position="top" style={{ fontSize: 10, fill: '#888' }} />
                    </Bar>
                    <Bar dataKey="theirs" name="간판다이렉트" fill={THEIRS} radius={[3, 3, 0, 0]} maxBarSize={38}>
                      <LabelList dataKey="theirs" position="top" style={{ fontSize: 10, fill: '#888' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 이 숫자를 어떻게 읽어야 하는지 */}
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px 24px', fontSize: 13, color: '#666', lineHeight: 1.75 }}>
              <div style={{ fontWeight: 700, color: '#444', marginBottom: 10 }}>이 숫자를 읽을 때</div>
              <div>· <b>간판의품격</b> — {TRACKER_RELIABLE_FROM}부터는 트래커 이벤트 기반 <b>실측치</b>(대시보드 '전체 견적요청'과 같은 기준, 봇·스테이징 제외). 그 이전은 트래커가 제대로 붙기 전이라 <b>엑셀 확정치</b>를 씁니다.</div>
              <div>· <b>간판다이렉트</b> — 경쟁사 공개 게시판에 노출된 분량이라 <b>실제 접수량의 하한선</b>입니다. 게시판 노출이 약 20건이라 4시간 안에 그보다 많이 접수되면 누락됩니다.</div>
              <div>· 저쪽은 접수일자가 제공되지 않아 <b>스크랩시각</b> 기준입니다. 월 단위라 영향은 작지만, 월말 심야 접수분이 다음 달로 넘어갈 수 있습니다.</div>
              <div>· 두 숫자는 <b>정의가 다르므로</b> 절대 건수의 우열보다 <b>추세와 변곡점</b>(저쪽이 광고를 태우면 막대가 튑니다)으로 읽는 편이 안전합니다.</div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #eee', color: '#999', fontSize: 12 }}>
                <div>실제로 데이터가 시작된 시점 (설정값을 교정할 때 참고하세요)</div>
                <div style={{ marginTop: 4 }}>
                  · 우리 트래커 첫 견적요청 이벤트: <b>{kstDate(ours?.firstEventAt) || '알 수 없음'}</b>
                  {' '}— 현재 신뢰 시작 설정: <code>{TRACKER_RELIABLE_FROM}</code> (그 이전은 엑셀 확정치 사용)
                </div>
                <div>
                  · 다이렉트 첫 스크랩: <b>{typeof theirs?.firstScrapedAt === 'string' ? theirs.firstScrapedAt.slice(0, 10) : '알 수 없음'}</b>
                  {' '}— 현재 신뢰 시작 설정: <code>{DIRECT_COMPARE_FROM}</code>
                </div>
                <div style={{ marginTop: 4, color: '#bbb' }}>설정을 바꾸려면 <code>lib/constants.js</code> 의 해당 상수 한 줄만 고치면 됩니다.</div>
                {theirs?.lastScrapedAt && <div style={{ marginTop: 6 }}>다이렉트 데이터 최종 반영: {theirs.lastScrapedAt}</div>}
              </div>
            </div>

          </div>
        </div>
      </PasswordProtection>
    </>
  )
}
