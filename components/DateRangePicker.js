import { useState, useRef, useEffect } from 'react'

/**
 * 기간 선택 달력 (2026-08-03)
 * 달력 하나에서 시작일→종료일 연속 클릭으로 범위 선택.
 * 하루만 조회하려면 날짜 한 번 클릭 후 바로 적용 (종료일 = 시작일).
 * 기존 방식(입력창 2개 × 달력 2번 오픈)의 불편 해소용.
 */

const pad = n => String(n).padStart(2, '0')
const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseYmd = s => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd) }
const display = s => s ? s.replace(/-/g, '.') : ''

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export default function DateRangePicker({ value, onApply, accent = '#4facfe', placeholder = '기간 선택' }) {
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState(null)  // 'YYYY-MM-DD'
  const [end, setEnd] = useState(null)
  const [month, setMonth] = useState(() => new Date())
  const ref = useRef(null)

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const toggle = () => {
    if (!open) {
      setStart(value?.startDate || null)
      setEnd(value?.endDate || null)
      const base = value?.startDate ? parseYmd(value.startDate) : new Date()
      setMonth(new Date(base.getFullYear(), base.getMonth(), 1))
    }
    setOpen(o => !o)
  }

  // 날짜 클릭: 시작 → 종료 순서로 채움. 종료가 시작보다 앞이면 자동 스왑
  const clickDay = ds => {
    if (!start || (start && end)) { setStart(ds); setEnd(null) }
    else if (ds < start) { setEnd(start); setStart(ds) }
    else setEnd(ds)
  }

  const apply = () => {
    if (!start) return
    onApply({ startDate: start, endDate: end || start })
    setOpen(false)
  }

  // 달력 그리드 생성
  const y = month.getFullYear(), m = month.getMonth()
  const firstDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(fmt(new Date(y, m, d)))
  const todayStr = fmt(new Date())
  const rangeEnd = end || start

  const label = value?.startDate
    ? (value.startDate === value.endDate ? display(value.startDate) : `${display(value.startDate)} ~ ${display(value.endDate)}`)
    : placeholder

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={toggle} style={{
        padding: '8px 14px', borderRadius: 8, border: '1px solid',
        borderColor: open ? accent : '#ddd', background: 'white',
        color: value?.startDate ? '#333' : '#aaa',
        fontSize: 13, cursor: 'pointer', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        📅 {label}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 1100,
          background: 'white', borderRadius: 12, padding: 14, width: 268,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #eee',
        }}>
          {/* 월 이동 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button onClick={() => setMonth(new Date(y, m - 1, 1))}
              style={{ border: 'none', background: '#f5f6fa', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 13 }}>◀</button>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{y}년 {m + 1}월</div>
            <button onClick={() => setMonth(new Date(y, m + 1, 1))}
              style={{ border: 'none', background: '#f5f6fa', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 13 }}>▶</button>
          </div>

          {/* 요일 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DAY_NAMES.map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: i === 0 ? '#e74c3c' : i === 6 ? '#4facfe' : '#999', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((ds, i) => {
              if (!ds) return <div key={`e${i}`} />
              const isStart = ds === start
              const isEnd = ds === rangeEnd
              const inRange = start && rangeEnd && ds > start && ds < rangeEnd
              const isToday = ds === todayStr
              return (
                <button key={ds} onClick={() => clickDay(ds)} style={{
                  border: 'none', cursor: 'pointer',
                  height: 32, borderRadius: 8, fontSize: 12,
                  fontWeight: isStart || isEnd ? 800 : isToday ? 700 : 500,
                  background: isStart || isEnd ? accent : inRange ? `${accent}22` : 'transparent',
                  color: isStart || isEnd ? 'white' : inRange ? accent : '#333',
                  outline: isToday && !isStart && !isEnd ? `1.5px solid ${accent}` : 'none',
                }}>{Number(ds.slice(8))}</button>
              )
            })}
          </div>

          {/* 선택 상태 + 적용 */}
          <div style={{ marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8, textAlign: 'center' }}>
              {!start ? '시작일을 클릭하세요'
                : !end ? `${display(start)} — 종료일 클릭 또는 바로 적용 (하루 조회)`
                : `${display(start)} ~ ${display(end)}`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setStart(null); setEnd(null) }} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #ddd',
                background: 'white', color: '#888', fontSize: 12, cursor: 'pointer', fontWeight: 600
              }}>초기화</button>
              <button onClick={apply} disabled={!start} style={{
                flex: 2, padding: '8px 0', borderRadius: 8, border: 'none',
                background: start ? accent : '#e0e0e0', color: 'white',
                fontSize: 12, cursor: start ? 'pointer' : 'default', fontWeight: 700
              }}>적용</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
