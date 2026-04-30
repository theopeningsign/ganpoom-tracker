import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import PasswordProtection from '../components/PasswordProtection'

const CHANNELS = [
  { key: 'naver_search',  label: '네이버 검색광고',   color: '#03C75A' },
  { key: 'naver_power',   label: '네이버 파워컨텐츠', color: '#00B050' },
  { key: 'google_app',    label: '구글 앱광고',        color: '#34A853' },
  { key: 'google',        label: '구글광고',           color: '#4285F4' },
  { key: 'tenping',       label: '텐핑',               color: '#FF6B35', vat: 1.1 },
]

const COL_COUNT = CHANNELS.length // 5 editable columns

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function fmt(num) {
  if (!num && num !== 0) return ''
  return Number(num).toLocaleString('ko-KR')
}

export default function AdCosts() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [costs, setCosts] = useState({})       // { 'YYYY-MM-DD|channel': number }
  const [editing, setEditing] = useState({})   // { 'YYYY-MM-DD|channel': string } raw input while editing
  const [saveStatus, setSaveStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const cellRefs = useRef({})
  const saveTimer = useRef(null)

  const daysInMonth = getDaysInMonth(year, month)
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2, '0')
    const m = String(month).padStart(2, '0')
    return `${year}-${m}-${d}`
  })

  // 데이터 로드
  useEffect(() => {
    setLoading(true)
    setCosts({})
    fetch(`/api/adcosts?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const map = {}
          data.costs.forEach(c => { map[`${c.date}|${c.channel}`] = c.amount })
          setCosts(map)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [year, month])

  const getVal = (date, ch) => costs[`${date}|${ch}`] || 0
  const getEditing = (date, ch) => editing[`${date}|${ch}`]

  // 셀 포커스
  const focusCell = useCallback((rowIdx, colIdx) => {
    if (rowIdx < 0) return
    if (rowIdx >= days.length) return
    if (colIdx < 0) { focusCell(rowIdx - 1, COL_COUNT - 1); return }
    if (colIdx >= COL_COUNT) { focusCell(rowIdx + 1, 0); return }
    const el = cellRefs.current[`${rowIdx}-${colIdx}`]
    if (el) { el.focus(); el.select() }
  }, [days.length])

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e, rowIdx, colIdx) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      e.shiftKey ? focusCell(rowIdx, colIdx - 1) : focusCell(rowIdx, colIdx + 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      focusCell(rowIdx + 1, colIdx)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusCell(rowIdx - 1, colIdx)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusCell(rowIdx + 1, colIdx)
    }
  }, [focusCell])

  const handleFocus = (date, ch) => {
    const key = `${date}|${ch}`
    setEditing(prev => ({ ...prev, [key]: String(costs[key] || '') }))
  }

  const handleChange = (date, ch, value) => {
    const raw = value.replace(/[^0-9]/g, '')
    const key = `${date}|${ch}`
    setEditing(prev => ({ ...prev, [key]: raw }))
  }

  const handleBlur = (date, ch) => {
    const key = `${date}|${ch}`
    const raw = editing[key] ?? ''
    const amount = raw === '' ? 0 : Number(raw)

    setCosts(prev => ({ ...prev, [key]: amount }))
    setEditing(prev => { const next = { ...prev }; delete next[key]; return next })

    // 저장
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaveStatus('saving')
      fetch('/api/adcosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, channel: ch, amount }),
      })
        .then(r => r.json())
        .then(() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus(''), 2000) })
        .catch(() => setSaveStatus('error'))
    }, 200)
  }

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  // 합계
  const totals = {}
  CHANNELS.forEach(ch => {
    totals[ch.key] = days.reduce((s, date) => s + (getVal(date, ch.key) || 0), 0)
  })

  const s = {
    wrap: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#0f1117', minHeight: '100vh', color: 'white' },
    nav: { background: '#1a1d2e', borderBottom: '1px solid #2d3148', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 100 },
    navLink: { textDecoration: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5 },
    navActive: { color: 'white', background: 'rgba(255,255,255,0.1)' },
    content: { padding: '24px 16px', maxWidth: 960, margin: '0 auto' },
    monthNav: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
    monthBtn: { background: '#2d3148', border: 'none', color: 'white', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    monthLabel: { fontSize: 20, fontWeight: 700 },
    tableWrap: { overflowX: 'auto', borderRadius: 10, border: '1px solid #2d3148' },
    table: { borderCollapse: 'collapse', width: '100%', minWidth: 720 },
    th: { background: '#1a1d2e', padding: '10px 8px', fontSize: 12, fontWeight: 700, textAlign: 'center', borderBottom: '2px solid #2d3148', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.7)' },
    thDate: { background: '#1a1d2e', padding: '10px 12px', fontSize: 12, fontWeight: 700, textAlign: 'center', borderBottom: '2px solid #2d3148', color: 'rgba(255,255,255,0.5)', width: 60 },
    td: { padding: '2px 4px', borderBottom: '1px solid #1e2235', textAlign: 'right' },
    tdDate: { padding: '0 12px', fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
    tdApplied: { padding: '4px 10px', fontSize: 12, color: '#aaa', textAlign: 'right', whiteSpace: 'nowrap' },
    tdTotal: { padding: '10px 10px', fontSize: 13, fontWeight: 700, textAlign: 'right', background: '#1a1d2e', borderTop: '2px solid #2d3148', whiteSpace: 'nowrap' },
    input: {
      background: 'transparent', border: 'none', color: 'white', textAlign: 'right',
      fontSize: 13, width: '100%', padding: '6px 8px', outline: 'none',
      fontVariantNumeric: 'tabular-nums', borderRadius: 4,
    },
  }

  return (
    <PasswordProtection>
      <div style={s.wrap}>
        {/* 네비게이션 */}
        <div style={s.nav}>
          <Link href="/" style={{ ...s.navLink }}>📊 대시보드</Link>
          <Link href="/channels" style={{ ...s.navLink }}>📡 채널분석</Link>
          <Link href="/adcosts" style={{ ...s.navLink, ...s.navActive }}>💸 광고비</Link>
          <Link href="/admin/agents" style={{ ...s.navLink }}>👥 CPA에이전트</Link>
          <Link href="/admin/settlement" style={{ ...s.navLink }}>💰 정산</Link>
        </div>

        <div style={s.content}>
          {/* 월 네비게이션 */}
          <div style={s.monthNav}>
            <button style={s.monthBtn} onClick={prevMonth}>‹</button>
            <span style={s.monthLabel}>{year}년 {month}월 광고비</span>
            <button style={s.monthBtn} onClick={nextMonth}>›</button>
            <span style={{ fontSize: 12, marginLeft: 8 }}>
              {saveStatus === 'saving' && <span style={{ color: '#888' }}>저장 중...</span>}
              {saveStatus === 'saved' && <span style={{ color: '#52c41a' }}>✓ 저장됨</span>}
              {saveStatus === 'error' && <span style={{ color: '#ff4d4f' }}>저장 실패</span>}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>불러오는 중...</div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.thDate}>날짜</th>
                    {CHANNELS.map(ch => (
                      <th key={ch.key} style={{ ...s.th, color: ch.color }}>
                        {ch.label}{ch.vat ? ' (입력)' : ''}
                      </th>
                    ))}
                    <th style={{ ...s.th, color: '#FF6B35' }}>텐핑 (적용)</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((date, rowIdx) => {
                    const dayNum = date.slice(5)
                    const d = new Date(date)
                    const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6
                    const tenping = getVal(date, 'tenping')
                    const tenpingApplied = tenping ? Math.round(tenping * 1.1) : 0
                    return (
                      <tr key={date} style={{ background: rowIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ ...s.tdDate, color: isWeekend ? '#ff7875' : 'rgba(255,255,255,0.4)' }}>
                          {dayNum} ({dow})
                        </td>
                        {CHANNELS.map((ch, colIdx) => {
                          const key = `${date}|${ch.key}`
                          const isEditing = key in editing
                          const displayVal = isEditing ? editing[key] : (getVal(date, ch.key) || '')
                          return (
                            <td key={ch.key} style={s.td}>
                              <input
                                ref={el => { cellRefs.current[`${rowIdx}-${colIdx}`] = el }}
                                value={isEditing ? displayVal : (displayVal ? fmt(displayVal) : '')}
                                placeholder="0"
                                onChange={e => handleChange(date, ch.key, e.target.value)}
                                onFocus={() => handleFocus(date, ch.key)}
                                onBlur={() => handleBlur(date, ch.key)}
                                onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                                style={{
                                  ...s.input,
                                  color: displayVal ? 'white' : 'rgba(255,255,255,0.15)',
                                }}
                              />
                            </td>
                          )
                        })}
                        <td style={s.tdApplied}>
                          {tenpingApplied ? fmt(tenpingApplied) : <span style={{ color: 'rgba(255,255,255,0.1)' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                  {/* 합계 행 */}
                  <tr>
                    <td style={{ ...s.tdDate, ...s.tdTotal, color: 'rgba(255,255,255,0.6)' }}>합계</td>
                    {CHANNELS.map(ch => (
                      <td key={ch.key} style={{ ...s.td, ...s.tdTotal, color: ch.color }}>
                        {fmt(totals[ch.key]) || '—'}
                      </td>
                    ))}
                    <td style={{ ...s.tdApplied, ...s.tdTotal, color: '#FF6B35' }}>
                      {fmt(Math.round(totals.tenping * 1.1)) || '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 안내 */}
          <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.8 }}>
            💡 셀 클릭 후 숫자 입력 → Tab: 오른쪽 이동 · Enter / ↓: 아래 이동 · ↑: 위 이동 · 자동저장
            <br />
            💡 텐핑 입력값에 VAT 10% 자동 적용 (입력 × 1.1 = 적용 광고비)
          </div>
        </div>
      </div>
    </PasswordProtection>
  )
}
