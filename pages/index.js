import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import * as XLSX from 'xlsx'
import PasswordProtection from '../components/PasswordProtection'
import DateRangePicker from '../components/DateRangePicker'

const CHANNEL_LABELS = {
  'naver.searchad': '네이버 검색광고',
  'naver_powercontents': '네이버 파워컨텐츠',
  'naver_powerlink_sublink': '네이버 서브링크',
  'naver_gfa': '네이버 GFA',
  'google': '구글 광고',
  'google.adwords': '구글 앱 프로모션',
  'tenping_web': '텐핑',
  'tenping': '텐핑 (구)',
  'facebook.business': '페이스북',
  'kakao': '카카오 검색광고',
  'agency': 'CPA 에이전시',
  'naver_powercontents': '네이버 파워컨텐츠',
  'naver_blog_official': '네이버 블로그',
  'instagram_official': '인스타그램',
  'unattributed': '자연유입',
}

const CHANNEL_COLORS = {
  'naver.searchad': '#03C75A',
  'naver_powercontents': '#00B050',
  'naver_powerlink_sublink': '#1DB954',
  'naver_gfa': '#57C278',
  'google': '#4285F4',
  'google.adwords': '#34A853',
  'tenping_web': '#FF6B35',
  'tenping': '#FF8C5A',
  'facebook.business': '#1877F2',
  'kakao': '#FEE500',
  'agency': '#9B59B6',
  'naver_blog_official': '#00C73C',
  'instagram_official': '#E1306C',
  'unattributed': '#95A5A6',
}

const TYPE_BADGE = {
  paid: { label: '유료', bg: '#fff3cd', color: '#856404' },
  organic: { label: '오가닉', bg: '#d1ecf1', color: '#0c5460' },
  cpa: { label: 'CPA', bg: '#f8d7da', color: '#721c24' },
}

const EVENT_LABELS = {
  'session.start': '세션 시작',
  'comparison.request': '비교견적 요청',
  'simple.request': '간단 견적',
  'airbridge.ecommerce.order.completed': '스타일시공 요청',
  'order.complete': '주문 완료',
  'airbridge.user.signup': '회원가입',
  'comparison.contract': '계약 완료',
  'comparison.consult': '상담 요청',
  'consult.chat': '채팅 상담',
  'phone.click': '전화 클릭',
  'event.conversion': '이벤트 전환',
}

function shortReferrer(url) {
  if (!url) return ''
  try {
    const u = new URL(url)
    const path = u.pathname + (u.search ? '?' + u.searchParams.toString().slice(0, 30) : '')
    const full = u.hostname.replace('www.', '') + path
    return full.length > 45 ? full.slice(0, 42) + '…' : full
  } catch {
    return url.length > 45 ? url.slice(0, 42) + '…' : url
  }
}

// 엑셀 내보내기용 Event Category 표기 (Airbridge 형식)
const CATEGORY_EXPORT_LABELS = {
  'comparison.request': 'ganpoomclient.comparison.request',
  'simple.request': 'ganpoomclient.simple.request',
  'airbridge.ecommerce.order.completed': 'Order Complete',
  'airbridge.user.signup': 'Sign-up',
  'airbridge.user.signin': 'Sign-in',
  'order.complete': 'Order Complete',
  'comparison.contract': 'ganpoomclient.comparison.contract',
  'comparison.consult': 'ganpoomclient.comparison.consult',
  'consult.chat': 'ganpoomclient.consult.chat',
  'phone.click': 'ganpoomclient.phone.click',
  'event.conversion': 'ganpoomclient.event.conversion',
}

function formatEventCategory(eventCategory, platform) {
  const label = CATEGORY_EXPORT_LABELS[eventCategory] || eventCategory
  const suffix = platform === 'app' ? '(App)' : '(Web)'
  return `${label} ${suffix}`
}

const CATEGORY_LABELS = {
  'comparison.request': '비교견적 요청',
  'order.complete': '주문 완료',
  'simple.request': '간단 견적요청',
  'home.screen': '홈화면 조회',
  'airbridge.user.signup': '회원가입',
  'airbridge.user.signin': '로그인',
  'airbridge.ecommerce.order.completed': '스타일시공 요청',
}

// gp001 → CPA_01, gp024 → CPA_24
function agentIdToCPA(agentId) {
  if (!agentId) return ''
  const num = parseInt(agentId.replace(/^gp/i, ''), 10)
  if (isNaN(num)) return agentId
  return 'CPA_' + String(num).padStart(2, '0')
}

function fmtDatetime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${day} ${h}:${mi}`
}

// Excel 진짜 날짜값으로 내보내기 (텍스트 나누기 없이 바로 인식)
// SheetJS는 로컬 시간(KST) 기준으로 직렬화하므로 추가 보정 없이 그대로 전달
function toExcelDate(iso) {
  if (!iso) return ''
  return { t: 'd', v: new Date(iso), z: 'yyyy-mm-dd hh:mm' }
}

function toYMD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDateRange(preset) {
  const today = new Date()
  switch (preset) {
    case 'today': {
      const s = toYMD(today)
      return { startDate: s, endDate: s }
    }
    case 'yesterday': {
      const yest = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
      const s = toYMD(yest)
      return { startDate: s, endDate: s }
    }
    case 'thisMonth': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      return { startDate: toYMD(first), endDate: toYMD(today) }
    }
    case 'lastMonth': {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const last = new Date(today.getFullYear(), today.getMonth(), 0) // 이번달 0일 = 지난달 말일
      return { startDate: toYMD(first), endDate: toYMD(last) }
    }
    default:
      return { startDate: toYMD(today), endDate: toYMD(today) }
  }
}

function getDefaultDates() {
  return getDateRange('today')
}

// 증감 배지 (기간 비교용, 2026-08-03)
function DeltaBadge({ cur, prev, suffix = '' }) {
  if (prev === null || prev === undefined) return null
  const diff = (cur || 0) - (prev || 0)
  const pct = prev > 0 ? ((diff / prev) * 100).toFixed(1) : null
  const color = diff > 0 ? '#27ae60' : diff < 0 ? '#e74c3c' : '#999'
  const arrow = diff > 0 ? '\u25b2' : diff < 0 ? '\u25bc' : '\u2014'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color }}>
      {arrow} {Math.abs(diff).toLocaleString()}{suffix}{pct !== null ? ` (${diff >= 0 ? '+' : ''}${pct}%)` : ''}
    </span>
  )
}

function mergeDaily(ourDaily, directDaily) {
  const ours = Array.isArray(ourDaily) ? ourDaily : []
  const theirs = Array.isArray(directDaily) ? directDaily : []
  const directMap = new Map(theirs.map(d => [d.date, d.count]))
  const dates = [...new Set([...ours.map(d => d.date), ...directMap.keys()])].sort()
  return dates.map(date => ({
    date,
    total: ours.find(d => d.date === date)?.total ?? 0,
    direct: directMap.get(date) ?? 0,
  }))
}

function StatCard({ label, value, sub, color, onClick, delta }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white', borderRadius: 12, padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.14)' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a' }}>{value?.toLocaleString() ?? 0}</div>
      {sub && <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{sub}</div>}
      {delta && <div style={{ marginTop: 4 }}>{delta}</div>}
      {onClick && <div style={{ fontSize: 11, color: color, marginTop: 6, fontWeight: 600 }}>채널별 보기 →</div>}
    </div>
  )
}

// 간판다이렉트(경쟁사) 접수 카드 (2026-08-27)
// 값은 카운트뿐이다. 이름·상호·지역 같은 세부정보는 트래커로 가져오지 않는다.
function DirectStatCard({ data, loading, delta, onRefresh, refreshing, refreshMsg }) {
  const configured = data?.configured !== false
  const value = Number.isFinite(data?.total) ? data.total : 0

  // '몇 시 기준 숫자인가' = 스크래핑이 마지막으로 돌아 확인한 시각.
  //
  // 주의: lastScrapedAt(마지막으로 새 건이 들어온 시각)을 쓰면 안 된다.
  // 신규 접수가 없으면 그 값이 안 움직여서, ↻ 를 눌러도 시각이 그대로라
  // "지금 확인한 게 맞나?" 를 알 수 없다. lastCheckedAt 은 돌 때마다 갱신된다.
  const checkedMs = (() => {
    const ms = new Date(data?.lastCheckedAt ?? NaN).getTime()   // ISO(UTC)
    return Number.isFinite(ms) ? ms : null
  })()

  // KST 로 'MM-DD HH:mm'
  const checkedLabel = checkedMs
    ? new Date(checkedMs + 9 * 3600 * 1000).toISOString().slice(5, 16).replace('T', ' ')
    : null

  // 4시간 간격 + 스케줄 지연(최대 3h)이라 5시간 넘게 확인이 없으면 이상 신호다.
  const stale = (() => {
    if (!checkedMs) return null
    const diffH = (Date.now() - checkedMs) / 3600000
    return diffH >= 5 ? Math.floor(diffH) : null
  })()

  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #7f8c8d',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#888' }}>다이렉트 접수</span>
        <button
          onClick={onRefresh}
          disabled={refreshing || !configured}
          title={refreshing ? '스크래핑 실행 중' : '지금 스크래핑을 돌려 최신 건수로 갱신 (하루 12회)'}
          style={{
            border: '1px solid #ddd', background: refreshing ? '#f0f0f0' : 'white',
            borderRadius: 6, width: 24, height: 24, lineHeight: '20px', padding: 0,
            fontSize: 12, color: refreshing ? '#bbb' : '#7f8c8d',
            cursor: refreshing || !configured ? 'default' : 'pointer',
          }}
        >{refreshing ? '⏳' : '↻'}</button>
      </div>

      <div style={{ fontSize: 32, fontWeight: 700, color: configured ? '#1a1a1a' : '#ccc' }}>
        {loading ? '…' : configured ? value.toLocaleString() : '\u2014'}
      </div>

      <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
        {!configured ? '토큰 미설정'
          : refreshMsg ? <span style={{ color: '#7f8c8d' }}>{refreshMsg}</span>
          : stale ? <span style={{ color: '#e67e22' }} title={checkedLabel ? `마지막 확인 ${checkedLabel}` : undefined}>⚠ {stale}시간째 확인 안 됨</span>
          : checkedLabel ? <span title={data?.lastScrapedAt ? `마지막 신규 접수: ${data.lastScrapedAt}` : undefined}>{checkedLabel} 확인</span>
          : '간판다이렉트'}
      </div>

      {delta && <div style={{ marginTop: 4 }}>{delta}</div>}
      <div style={{ fontSize: 11, color: '#c0c0c0', marginTop: 6 }}
           title="간판다이렉트 공개 게시판에 노출된 건만 집계합니다. 접수일자가 제공되지 않아 '스크랩시각' 기준이라 일 단위로는 ±1일 오차가 있고, 게시판 노출 한도(약 20건) 때문에 실제 접수량의 하한선입니다.">
        게시판 노출 기준 ⓘ
      </div>
    </div>
  )
}

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

const DATE_PRESETS = [
  { key: 'today', label: '오늘' },
  { key: 'yesterday', label: '어제' },
  { key: 'thisMonth', label: '이번달' },
  { key: 'lastMonth', label: '지난달' },
]

export default function Dashboard() {
  const [dates, setDates] = useState(getDefaultDates)       // 실제 조회 기간
  const [inputDates, setInputDates] = useState(getDefaultDates) // 날짜 input 표시값
  const [compareMode, setCompareMode] = useState(false)              // 비교 모드 (2026-08-03)
  const [compareInput, setCompareInput] = useState(getDefaultDates)  // 비교 기간 입력값
  const [compareDates, setCompareDates] = useState(null)             // 실제 비교 조회 기간
  const [compareData, setCompareData] = useState(null)               // 비교 기간 통계
  const [compareLoading, setCompareLoading] = useState(false)
  const [activePreset, setActivePreset] = useState('today')
  const [platform, setPlatform] = useState('all')
  const [showStaging, setShowStaging] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [categoryModal, setCategoryModal] = useState(null) // { category, label, data }
  const [modalLoading, setModalLoading] = useState(false)
  const [chModal, setChModal] = useState(null) // { channel, label }
  const [chDetail, setChDetail] = useState(null)
  const [chDetailLoading, setChDetailLoading] = useState(false)
  const [chDetailTab, setChDetailTab] = useState('events')
  // 간판다이렉트(경쟁사) 접수 건수 (2026-08-27)
  const [directData, setDirectData] = useState(null)
  const [directLoading, setDirectLoading] = useState(true)
  const [directCompare, setDirectCompare] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState('')
  const fetchSeq = useRef(0)
  const directSeq = useRef(0)

  const openChannelModal = useCallback(async (channel, label) => {
    setChDetail(null)
    setChDetailTab('events')
    setChModal({ channel, label })
    setChDetailLoading(true)
    try {
      const params = new URLSearchParams({ channel, startDate: dates.startDate, endDate: dates.endDate, platform, staging: showStaging ? 'true' : 'false' })
      const res = await fetch(`/api/events/channel-detail?${params}`)
      const json = await res.json()
      if (json.success) setChDetail(json)
    } catch (e) { console.error(e) }
    finally { setChDetailLoading(false) }
  }, [dates, platform, showStaging])

  const openCategoryModal = useCallback(async (category, label) => {
    setModalLoading(true)
    setCategoryModal({ category, label, data: null })
    try {
      const params = new URLSearchParams({ category, startDate: dates.startDate, endDate: dates.endDate, platform, staging: showStaging ? 'true' : 'false' })
      const res = await fetch(`/api/events/category-detail?${params}`)
      const json = await res.json()
      if (json.success) setCategoryModal({ category, label, data: json })
    } catch (e) { console.error(e) }
    finally { setModalLoading(false) }
  }, [dates, platform, showStaging])

  // 비교 기간 통계 조회 (2026-08-03): 봇 제외 기준은 본 조회와 동일
  useEffect(() => {
    if (!compareDates) { setCompareData(null); return }
    let cancelled = false
    ;(async () => {
      setCompareLoading(true)
      try {
        const params = new URLSearchParams({ startDate: compareDates.startDate, endDate: compareDates.endDate, platform, staging: showStaging ? 'true' : 'false' })
        const res = await fetch(`/api/events/stats?${params}`)
        const json = await res.json()
        if (!cancelled && json.success) setCompareData(json)
      } catch (e) { console.error(e) }
      finally { if (!cancelled) setCompareLoading(false) }
    })()
    return () => { cancelled = true }
  }, [compareDates, platform, showStaging])

  const fetchStats = useCallback(async () => {
    const seq = ++fetchSeq.current
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate: dates.startDate, endDate: dates.endDate, platform, staging: showStaging ? 'true' : 'false' })
      const res = await fetch(`/api/events/stats?${params}`)
      const json = await res.json()
      if (json.success && seq === fetchSeq.current) setData(json)
    } catch (e) { console.error(e) }
    finally { if (seq === fetchSeq.current) setLoading(false) }
  }, [dates, platform, showStaging])

  useEffect(() => { fetchStats() }, [fetchStats])

  // 간판다이렉트 접수 건수 조회 (2026-08-27)
  // 대시보드 기간과 완전히 같은 startDate/endDate 를 쓴다. platform/staging 은
  // 남의 사이트 데이터라 적용 대상이 아니므로 의존성에 넣지 않는다.
  const fetchDirect = useCallback(async ({ fresh = false } = {}) => {
    const seq = ++directSeq.current
    setDirectLoading(true)
    try {
      const params = new URLSearchParams({ startDate: dates.startDate, endDate: dates.endDate })
      if (fresh) params.set('fresh', '1')
      const res = await fetch(`/api/direct/stats?${params}`)
      const json = await res.json()
      if (seq === directSeq.current) setDirectData(json)
    } catch (e) {
      console.error(e)
      if (seq === directSeq.current) setDirectData({ success: false, error: String(e) })
    } finally {
      if (seq === directSeq.current) setDirectLoading(false)
    }
  }, [dates])

  useEffect(() => { fetchDirect() }, [fetchDirect])

  // 비교 기간의 다이렉트 건수
  useEffect(() => {
    if (!compareDates) { setDirectCompare(null); return }
    let cancelled = false
    ;(async () => {
      try {
        const params = new URLSearchParams({ startDate: compareDates.startDate, endDate: compareDates.endDate })
        const res = await fetch(`/api/direct/stats?${params}`)
        const json = await res.json()
        if (!cancelled && json.success) setDirectCompare(json)
      } catch (e) { console.error(e) }
    })()
    return () => { cancelled = true }
  }, [compareDates])

  // '지금 갱신' — GitHub Action 을 띄우고 끝날 때까지 폴링한 뒤 다시 읽는다.
  // 액션은 보통 2분 내외. 4분(=48회 x 5초)이 지나면 폴링을 접고 안내만 남긴다.
  const refreshDirect = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    setRefreshMsg('실행 요청 중…')
    try {
      const res = await fetch('/api/direct/refresh', { method: 'POST' })
      const json = await res.json()

      if (!json.success) {
        setRefreshMsg(json.error || '갱신에 실패했습니다')
        setRefreshing(false)
        setTimeout(() => setRefreshMsg(''), 8000)
        return
      }

      const since = json.dispatchedAt || json.run?.createdAt || new Date().toISOString()
      setRefreshMsg(json.reused ? '이미 실행 중… 기다리는 중' : '스크래핑 중… (약 2분)')

      for (let i = 0; i < 48; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const st = await fetch(`/api/direct/refresh?since=${encodeURIComponent(since)}`).then(r => r.json()).catch(() => null)
        const run = st?.run
        if (run && run.status === 'completed') {
          if (run.conclusion === 'success') {
            setRefreshMsg('갱신 완료 — 다시 읽는 중')
            await fetchDirect({ fresh: true })   // 캐시 우회
            setRefreshMsg('')
          } else {
            setRefreshMsg(`실행 실패 (${run.conclusion})`)
            setTimeout(() => setRefreshMsg(''), 8000)
          }
          setRefreshing(false)
          return
        }
        setRefreshMsg(`스크래핑 중… ${(i + 1) * 5}초`)
      }

      setRefreshMsg('아직 진행 중 — 잠시 후 새로고침')
      setRefreshing(false)
      setTimeout(() => setRefreshMsg(''), 10000)
    } catch (e) {
      console.error(e)
      setRefreshMsg('갱신 중 오류')
      setRefreshing(false)
      setTimeout(() => setRefreshMsg(''), 8000)
    }
  }, [refreshing, fetchDirect])

  const exportCSV = useCallback(async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ startDate: dates.startDate, endDate: dates.endDate, platform })
      const res = await fetch(`/api/events/export?${params}`)
      const json = await res.json()
      if (!json.success) return
      const header = ['Event Category', 'Event Datetime', 'Channel', 'Campaign', 'Platform', 'Client IP City']
      const rows = json.events.map(e => ({
        'Event Category': e.event_category || '',
        'Event Datetime': toExcelDate(e.created_at),
        'Channel': e.channel || 'unattributed',
        'Campaign': e.campaign || '',
        'Platform': e.device_type === 'mobile' ? (e.os_name || 'Mobile') : 'Desktop',
        'Client IP City': e.client_ip_city || '',
      }))
      const csv = [header.join(','), ...rows.map(r => header.map(h => `"${(r[h]||'').replace(/"/g,'""')}"`).join(','))].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `ganpoom_${dates.startDate}_${dates.endDate}.csv`
      a.click()
    } catch (e) { console.error(e) }
    finally { setExporting(false) }
  }, [dates, platform])

  const exportCPAExcel = useCallback(async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ startDate: dates.startDate, endDate: dates.endDate, platform })
      const res = await fetch(`/api/events/export?${params}`)
      const json = await res.json()
      if (!json.success) return
      const CPA_HEADERS = ['Event Category', 'Event Datetime', 'Channel', 'Campaign', 'Ad Group', 'Ad Creative', 'Browser Referrer', 'Device Type', 'OS Name', 'Client IP', 'Client IP City', 'Client IP Subdivision']
      const cpaRows = json.events.map(e => {
        return [
          formatEventCategory(e.event_category, e.platform),
          toExcelDate(e.created_at),
          e.channel || 'unattributed',
          e.channel === 'agency' ? agentIdToCPA(e.agent_id) : (e.campaign || e.utm_campaign || ''),
          e.ad_group || '',
          e.ad_creative || '',
          e.referrer || '',
          e.device_type || '',
          e.os_name || '',
          e.client_ip || '',
          e.client_ip_city || '',
          e.client_ip_subdivision || '',
        ]
      })
      const ws = XLSX.utils.aoa_to_sheet([CPA_HEADERS, ...cpaRows])
      ws['!cols'] = [42, 28, 20, 20, 12, 12, 60, 12, 14, 18, 20, 22].map(w => ({ wch: w }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'CPA 추적')
      XLSX.writeFile(wb, `간품_CPA추적_${dates.startDate}_${dates.endDate}.xlsx`)
    } catch (e) { console.error(e) }
    finally { setExporting(false) }
  }, [dates, platform])

  const exportExcel = useCallback(async () => {
    setExporting(true)
    try {
      const QUOTE_EVENTS = ['comparison.request', 'simple.request', 'airbridge.ecommerce.order.completed', 'order.complete']
      const params = new URLSearchParams({ startDate: dates.startDate, endDate: dates.endDate, platform })
      const res = await fetch(`/api/events/export?${params}`)
      const json = await res.json()
      if (!json.success) return
      const PERF_HEADERS = ['Event Category', 'Event Datetime', 'Channel', 'Campaign', 'Platform', 'Client IP City']
      const perfRows = json.events
        .filter(e => QUOTE_EVENTS.includes(e.event_category))
        .map(e => ([
          formatEventCategory(e.event_category, e.platform),
          toExcelDate(e.created_at),
          e.channel || 'unattributed',
          e.campaign || e.utm_campaign || '',
          e.os_name || (e.device_type === 'mobile' ? 'Mobile' : 'Desktop'),
          e.client_ip_city || '',
        ]))
      const ws = XLSX.utils.aoa_to_sheet([PERF_HEADERS, ...perfRows])
      ws['!cols'] = [42, 22, 20, 30, 14, 20].map(w => ({ wch: w }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '성과분석')
      XLSX.writeFile(wb, `간품_성과분석_${dates.startDate}_${dates.endDate}.xlsx`)
    } catch (e) { console.error(e) }
    finally { setExporting(false) }
  }, [dates, platform])

  return (
    <>
    <style suppressHydrationWarning>{`
      @media (max-width: 1500px) {
        .gp-stat-grid { grid-template-columns: repeat(4, 1fr) !important; }
      }
      @media (max-width: 768px) {
        .gp-sidebar { display: none !important; }
        .gp-mobile-nav { display: flex !important; }
        .gp-main { margin-left: 0 !important; padding: 12px !important; padding-top: 60px !important; }
        .gp-stat-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; }
        .gp-two-col { grid-template-columns: 1fr !important; }
        .gp-controls { width: 100%; margin-top: 12px; }
        .gp-controls input[type="date"] { width: 130px; font-size: 12px !important; padding: 6px 8px !important; }
        .gp-modal-box { width: 92% !important; }
        .gp-header { flex-direction: column !important; align-items: flex-start !important; }
      }
      @media (max-width: 480px) {
        .gp-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
      }
      .gp-mobile-nav { display: none; }
      /* 제목 줄. PC 에서는 내용만큼만 차지해 기존 레이아웃을 건드리지 않는다 */
      .gp-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
      .gp-refresh-btn { display: none; }
      @media (max-width: 768px) {
        .gp-title-row { width: 100%; }
        .gp-refresh-btn { display: inline-flex !important; }
      }
    `}</style>
    {/* 모바일 상단 네비바 */}
    <div className="gp-mobile-nav" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: '#1a1d2e', height: 52,
      alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>📊 대시보드</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link href="/unconfirmed" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(249,115,22,0.25)', borderRadius: 20,
            padding: '6px 14px', fontSize: 13, color: '#fdba74', fontWeight: 600
          }}>
            <span>⚠️</span><span>미확인</span>
          </div>
        </Link>
        <Link href="/channels" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.1)', borderRadius: 20,
            padding: '6px 14px', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600
          }}>
            <span>📡</span><span>채널분석</span>
          </div>
        </Link>
      </div>
    </div>
    {/* 전환 유형 상세 모달 */}
    {categoryModal && (
      <div
        onClick={() => setCategoryModal(null)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="gp-modal-box"
          style={{ background: 'white', borderRadius: 16, width: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        >
          {/* 헤더 */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{categoryModal.label}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{dates.startDate} ~ {dates.endDate} · {categoryModal.category === 'session.start' ? '채널별 방문 (사람, 봇 제외)' : '채널별 견적요청 분석'}</div>
            </div>
            <button onClick={() => setCategoryModal(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa', lineHeight: 1 }}>✕</button>
          </div>

          {/* 본문 */}
          <div style={{ overflowY: 'auto', padding: '16px 0' }}>
            {modalLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>불러오는 중...</div>
            ) : !categoryModal.data ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>데이터가 없습니다</div>
            ) : (
              <>
                <div style={{ padding: '0 24px 12px', fontSize: 13, color: '#888' }}>
                  총 <strong style={{ color: '#1a1a1a' }}>{categoryModal.data.total.toLocaleString()}건</strong>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      {['채널', '구분', '건수', '비율'].map(h => (
                        <th key={h} style={{ padding: '8px 24px', textAlign: h === '건수' || h === '비율' ? 'right' : h === '구분' ? 'center' : 'left', fontSize: 11, color: '#888', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categoryModal.data.channelStats.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#bbb', fontSize: 13 }}>채널 데이터가 없습니다</td></tr>
                    ) : categoryModal.data.channelStats.map(ch => {
                      const badge = TYPE_BADGE[ch.channel_type] || TYPE_BADGE.organic
                      const color = CHANNEL_COLORS[ch.channel] || '#bbb'
                      const pct = categoryModal.data.total > 0 ? ((ch.count / categoryModal.data.total) * 100).toFixed(1) : '0.0'
                      return (
                        <tr key={ch.channel} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '11px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                              <span style={{ fontSize: 13, fontWeight: 500 }}>{CHANNEL_LABELS[ch.channel] || ch.channel}</span>
                            </div>
                          </td>
                          <td style={{ padding: '11px 24px', textAlign: 'center' }}>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: badge.bg, color: badge.color, fontWeight: 600 }}>{badge.label}</span>
                          </td>
                          <td style={{ padding: '11px 24px', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>{ch.count.toLocaleString()}</td>
                          <td style={{ padding: '11px 24px', textAlign: 'right', fontSize: 13, color: '#888' }}>{pct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    )}

    {/* 채널 상세 모달 */}
    {chModal && (
      <div onClick={() => setChModal(null)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()}
          className="gp-modal-box"
          style={{ background: 'white', borderRadius: 16, width: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
          {/* 헤더 */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: CHANNEL_COLORS[chModal.channel] || '#bbb' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>{chModal.label}</span>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{dates.startDate} ~ {dates.endDate}</div>
            </div>
            <button onClick={() => setChModal(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa' }}>✕</button>
          </div>

          {/* 탭 */}
          {!chDetailLoading && chDetail && (
            <div style={{ padding: '12px 24px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 4, background: '#f5f6fa', borderRadius: 8, padding: 4 }}>
                {[
                  { key: 'events', label: '이벤트 내역' },
                  ...(chDetail.keywords?.length > 0 ? [{ key: 'keywords', label: '키워드' }] : []),
                  ...(!['naver.searchad','naver_powercontents','google','google.adwords'].includes(chModal.channel) && chDetail.referrerDomains?.length > 0 ? [{ key: 'referrers', label: '유입경로' }] : []),
                  { key: 'trend', label: '일별 추이' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setChDetailTab(tab.key)} style={{
                    flex: 1, padding: '7px 0', border: 'none', borderRadius: 6,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: chDetailTab === tab.key ? 'white' : 'transparent',
                    color: chDetailTab === tab.key ? '#333' : '#888',
                    boxShadow: chDetailTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}>{tab.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* 본문 */}
          <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1 }}>
            {chDetailLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>불러오는 중...</div>
            ) : !chDetail ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>데이터가 없습니다</div>
            ) : (
              <>
                {/* 이벤트 내역 탭 */}
                {chDetailTab === 'events' && (
                  <div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>최근 {chDetail.recentEvents.length}건 (최대 50건)</div>
                    {chDetail.recentEvents.length === 0 ? (
                      <div style={{ color: '#ccc', fontSize: 13, textAlign: 'center', padding: 30 }}>이벤트 없음</div>
                    ) : chDetail.recentEvents.map((ev, i) => {
                      const dt = new Date(ev.created_at)
                      const dateStr = `${dt.getMonth()+1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
                      return (
                        <div key={ev.id || i} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, background: '#eef4ff', color: '#4facfe', padding: '2px 8px', borderRadius: 20 }}>
                              {EVENT_LABELS[ev.event_category] || ev.event_category}
                            </span>
                            <span style={{ fontSize: 11, color: '#aaa' }}>{dateStr}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {ev.campaign && <span style={{ fontSize: 11, color: '#666' }}>📢 {ev.campaign}</span>}
                            {ev.device_type && <span style={{ fontSize: 11, color: '#888' }}>{ev.device_type === 'mobile' ? '📱' : '🖥️'} {ev.device_type}</span>}
                            {ev.client_ip_city && <span style={{ fontSize: 11, color: '#888' }}>📍 {ev.client_ip_city}</span>}
                            {ev.platform === 'app' && <span style={{ fontSize: 11, color: '#9B59B6', fontWeight: 600 }}>앱</span>}
                            {ev.referrer && (
                              <a href={ev.referrer} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                style={{ fontSize: 11, color: '#4facfe', textDecoration: 'none', wordBreak: 'break-all' }} title={ev.referrer}>
                                🔗 {shortReferrer(ev.referrer)}
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 키워드 탭 */}
                {chDetailTab === 'keywords' && (
                  <div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>견적요청을 만든 키워드 ({chDetail.keywords.length}개)</div>
                    {(() => {
                      const max = Math.max(...chDetail.keywords.map(k => k.visits), 1)
                      return chDetail.keywords.map(kw => {
                        const pct = (kw.visits / max * 100).toFixed(1)
                        const isNaver = kw.source === 'naver'
                        const convRate = kw.visits > 0 ? (kw.quotes / kw.visits * 100).toFixed(1) : '0.0'
                        return (
                          <div key={kw.keyword} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 5 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 600, background: isNaver ? '#e8f9ee' : '#e8f0fe', color: isNaver ? '#03C75A' : '#4285F4' }}>{isNaver ? 'N' : 'G'}</span>
                                <span style={{ color: '#333', fontWeight: 500 }}>{kw.keyword}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: '#888' }}>방문 {kw.visits}</span>
                                <span style={{ fontSize: 12, fontWeight: 700 }}>견적 {kw.quotes}건</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: parseFloat(convRate) >= 5 ? '#27ae60' : parseFloat(convRate) >= 2 ? '#f39c12' : '#e74c3c' }}>{convRate}%</span>
                              </div>
                            </div>
                            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: isNaver ? '#03C75A' : '#4285F4', borderRadius: 3 }} />
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}

                {/* 유입경로 탭 */}
                {chDetailTab === 'referrers' && (
                  <div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>유입 URL ({chDetail.referrerDomains?.length || 0}개)</div>
                    {(() => {
                      const max = Math.max(...chDetail.referrerDomains.map(d => d.visits), 1)
                      return chDetail.referrerDomains.map(item => {
                        const pct = (item.visits / max * 100).toFixed(1)
                        const convRate = item.visits > 0 ? (item.quotes / item.visits * 100).toFixed(1) : '0.0'
                        return (
                          <div key={item.url} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 5, gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                <span style={{ flexShrink: 0, fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 600, background: item.isDirect ? '#f0f0f0' : '#fff3e0', color: item.isDirect ? '#999' : '#e67e22' }}>{item.isDirect ? '직접' : '유입'}</span>
                                {item.isDirect ? (
                                  <span style={{ color: '#aaa' }}>(직접유입)</span>
                                ) : (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                                    style={{ color: '#4facfe', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    title={item.url}>
                                    {shortReferrer(item.url)}
                                  </a>
                                )}
                              </div>
                              <div style={{ flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: '#888' }}>방문 {item.visits}</span>
                                <span style={{ fontSize: 12, fontWeight: 700 }}>견적 {item.quotes}건</span>
                                {item.visits > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: parseFloat(convRate) >= 5 ? '#27ae60' : parseFloat(convRate) >= 2 ? '#f39c12' : '#e74c3c' }}>{convRate}%</span>}
                              </div>
                            </div>
                            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: item.isDirect ? '#bdc3c7' : '#e67e22', borderRadius: 3 }} />
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}

                {/* 일별 추이 탭 */}
                {chDetailTab === 'trend' && (
                  <div>
                    {chDetail.dailyTrend.length === 0 ? (
                      <div style={{ color: '#ccc', fontSize: 13, textAlign: 'center', padding: 30 }}>데이터 없음</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chDetail.dailyTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                          <YAxis yAxisId="left" tick={{ fontSize: 10 }} allowDecimals={false} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#f97316' }} allowDecimals={false} />
                          <Tooltip formatter={(v, name) => [v + '건', name === 'visits' ? '방문자수' : '견적요청수']} />
                          <Legend formatter={name => name === 'visits' ? '방문자수' : '견적요청수'} wrapperStyle={{ fontSize: 12 }} />
                          <Line yAxisId="left" type="monotone" dataKey="visits" stroke="#4facfe" strokeWidth={2} dot={{ r: 3 }} />
                          <Line yAxisId="right" type="monotone" dataKey="quotes" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )}

    <PasswordProtection>
      <div style={{ background: '#f5f6fa', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <Sidebar current="/" />
        <div className="gp-main" style={{ marginLeft: 220, padding: 32 }}>

          {/* 헤더 */}
          <div className="gp-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div className="gp-title-row">
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>대시보드</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>채널별 견적요청 현황</p>
                {compareDates && (
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9b59b6', fontWeight: 600 }}>🔁 {compareDates.startDate} ~ {compareDates.endDate} 대비 증감 표시 중</p>
                )}
              </div>

              {/* 모바일 전용 새로고침 (2026-08-27)
                  기간 프리셋을 다시 눌러도 재조회는 되지만 그게 '새로고침'이라는 게
                  드러나지 않는다. 흰 화면 오른쪽 위에 명시적인 버튼을 둔다.
                  페이지를 통째로 리로드하지 않고 데이터만 다시 받아온다. */}
              <button
                className="gp-refresh-btn"
                onClick={() => { fetchStats(); fetchDirect() }}
                disabled={loading}
                aria-label="새로고침"
                style={{
                  alignItems: 'center', justifyContent: 'center',
                  width: 38, height: 38, flexShrink: 0,
                  borderRadius: 10, border: '1px solid #e1e5e9',
                  background: loading ? '#f0f2f5' : 'white',
                  color: loading ? '#bbb' : '#4facfe',
                  fontSize: 17, lineHeight: 1, padding: 0,
                  cursor: loading ? 'default' : 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >{loading ? '⏳' : '↻'}</button>
            </div>
            <div className="gp-controls" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* 스테이징 토글 */}
              <button onClick={() => setShowStaging(s => !s)} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid',
                borderColor: showStaging ? '#f39c12' : '#ddd',
                background: showStaging ? '#fff8e1' : 'white',
                color: showStaging ? '#f39c12' : '#aaa',
                fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}>
                {showStaging ? '🧪 스테이징 데이터' : '🧪 스테이징'}
              </button>

              {/* 플랫폼 */}
              <select value={platform} onChange={e => setPlatform(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: 'white' }}>
                <option value="all">웹 + 앱</option>
                <option value="web">웹</option>
                <option value="app">앱</option>
              </select>

              {/* 기간 프리셋 버튼 — 누르면 즉시 조회 */}
              <div style={{ display: 'flex', gap: 4, background: '#f0f2f5', borderRadius: 8, padding: 3 }}>
                {DATE_PRESETS.map(({ key, label }) => (
                  <button key={key} onClick={() => {
                    const range = getDateRange(key)
                    setDates(range)
                    setInputDates(range)
                    setActivePreset(key)
                  }} style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 12,
                    fontWeight: activePreset === key ? 700 : 500, cursor: 'pointer',
                    background: activePreset === key ? 'white' : 'transparent',
                    color: activePreset === key ? '#4facfe' : '#666',
                    boxShadow: activePreset === key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                    transition: 'all 0.15s',
                  }}>{label}</button>
                ))}
              </div>

              {/* 기간 선택 — 달력 하나에서 시작일·종료일 연속 클릭, 적용 즉시 조회 (2026-08-03) */}
              <DateRangePicker
                value={dates}
                onApply={r => { setDates(r); setInputDates(r); setActivePreset('') }}
              />

              {/* 기간 비교 (2026-08-03) */}
              <button onClick={() => setCompareMode(m => {
                const next = !m
                if (!next) setCompareDates(null)
                return next
              })} style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid',
                borderColor: compareMode ? '#9b59b6' : '#ddd',
                background: compareMode ? '#f5eef8' : 'white',
                color: compareMode ? '#9b59b6' : '#888',
                fontSize: 13, cursor: 'pointer', fontWeight: 600
              }}>🔁 비교</button>
              {compareMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5eef8', borderRadius: 8, padding: '4px 8px' }}>
                  <span style={{ fontSize: 12, color: '#9b59b6', fontWeight: 800 }}>VS</span>
                  <DateRangePicker
                    value={compareDates}
                    accent="#9b59b6"
                    placeholder="비교 기간 선택"
                    onApply={r => { setCompareInput(r); setCompareDates(r) }}
                  />
                  {compareLoading && <span style={{ fontSize: 12, color: '#9b59b6' }}>⏳</span>}
                </div>
              )}
              <button onClick={exportExcel} disabled={exporting}
                style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#217346', color: 'white', fontSize: 13, cursor: 'pointer' }}>
                📊 성과분석
              </button>
              <button onClick={exportCPAExcel} disabled={exporting}
                style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#c55a11', color: 'white', fontSize: 13, cursor: 'pointer' }}>
                📋 CPA 추적
              </button>
              {/* 간품 vs 다이렉트 통합 비교 (2026-08-27)
                  모바일에서는 사이드바가 숨겨져 이 버튼이 유일한 진입점이다 */}
              <Link href="/vs-direct" style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '8px 12px', borderRadius: 8, background: '#1a1d2e',
                  color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                }}>⚔️ VS 간판다이렉트</div>
              </Link>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>불러오는 중...</div>
          ) : !data ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>데이터가 없습니다</div>
          ) : (
            <>
              {/* 요약 카드 (비교 시 증감 표시, 2026-08-03) */}
              {(() => {
                const cmp = compareData ? compareData.summary : null
                const d = (cur, key) => (cmp ? <DeltaBadge cur={cur} prev={cmp[key] ?? 0} /> : null)
                return (
              <div className="gp-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 16, marginBottom: 28 }}>
                <StatCard label="전체 견적요청" value={data.summary.total} color="#4facfe" delta={d(data.summary.total, 'total')} />
                <StatCard label="유료 광고" value={data.summary.paid} sub="Paid" color="#f39c12" delta={d(data.summary.paid, 'paid')} />
                <StatCard label="자연유입" value={data.summary.organic} sub="Organic" color="#27ae60" delta={d(data.summary.organic, 'organic')} />
                <StatCard label="블로그 / SNS" value={data.summary.blog} sub="Blog" color="#00C73C" delta={d(data.summary.blog, 'blog')} />
                <StatCard label="CPA 에이전시" value={data.summary.cpa} sub="CPA" color="#9b59b6" delta={d(data.summary.cpa, 'cpa')} />
                <StatCard label="회원가입" value={data.summary.signup} sub="Signup" color="#e74c3c" onClick={() => openCategoryModal('airbridge.user.signup', '회원가입')} delta={d(data.summary.signup, 'signup')} />
                <StatCard label="방문자 (사람)" value={data.summary.totalSessions ?? 0} sub={`🤖 봇 ${(data.summary.botSessions ?? 0).toLocaleString()} 제외`} color="#16a085" onClick={() => openCategoryModal('session.start', '방문자 (사람)')} delta={d(data.summary.totalSessions ?? 0, 'totalSessions')} />
                {/* 경쟁사 간판다이렉트 — 우리 지표가 아니므로 회색 계열로 구분 (2026-08-27) */}
                <DirectStatCard
                  data={directData}
                  loading={directLoading}
                  refreshing={refreshing}
                  refreshMsg={refreshMsg}
                  onRefresh={refreshDirect}
                  delta={Number.isFinite(directCompare?.total)
                    ? <DeltaBadge cur={Number.isFinite(directData?.total) ? directData.total : 0} prev={directCompare.total} />
                    : null}
                />
              </div>
                )
              })()}

              {/* 채널 테이블 + 일별 추이 */}
              <div className="gp-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 15 }}>채널별 견적요청</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        {['채널', '구분', '건수', '비율'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: h === '건수' || h === '비율' ? 'right' : h === '구분' ? 'center' : 'left', fontSize: 12, color: '#888', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.channelStats.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#bbb', fontSize: 13 }}>데이터가 없습니다</td></tr>
                      ) : data.channelStats.map(ch => {
                        const badge = TYPE_BADGE[ch.channel_type] || TYPE_BADGE.organic
                        const pct = data.summary.total > 0 ? ((ch.count / data.summary.total) * 100).toFixed(1) : '0.0'
                        const color = CHANNEL_COLORS[ch.channel] || '#bbb'
                        const chLabel = CHANNEL_LABELS[ch.channel] || ch.channel
                        return (
                          <tr key={ch.channel}
                            onClick={() => openChannelModal(ch.channel, chLabel)}
                            style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8f9ff'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}
                          >
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{chLabel}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: badge.bg, color: badge.color, fontWeight: 600 }}>{badge.label}</span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 15 }}>{ch.count.toLocaleString()}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#888' }}>{pct}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 20 }}>
                    일별 견적요청 추이
                    <span style={{ fontSize: 11, color: '#bbb', fontWeight: 400, marginLeft: 8 }}>· 회색 점선 = 간판다이렉트(게시판 노출 기준)</span>
                  </div>
                  {data.dailyStats.length === 0 && !(directData?.daily?.length) ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#bbb', fontSize: 13 }}>데이터가 없습니다</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={mergeDaily(data.dailyStats, directData?.daily)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip formatter={(v, name) => [v + '건', name === 'total' ? '우리 견적요청' : '다이렉트']} />
                        <Legend formatter={name => name === 'total' ? '우리 견적요청' : '다이렉트'} wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="total" stroke="#4facfe" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="direct" stroke="#95a5a6" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* 견적 유형 + 플랫폼/기기 */}
              <div className="gp-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 15 }}>견적요청 유형</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        {['유형', '건수', '비율'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: h !== '유형' ? 'right' : 'left', fontSize: 12, color: '#888', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.categoryStats.length === 0 ? (
                        <tr><td colSpan={3} style={{ padding: 40, textAlign: 'center', color: '#bbb', fontSize: 13 }}>데이터가 없습니다</td></tr>
                      ) : data.categoryStats.map(c => {
                        const pct = data.summary.total > 0 ? ((c.count / data.summary.total) * 100).toFixed(1) : '0.0'
                        const label = CATEGORY_LABELS[c.category] || c.category
                        return (
                          <tr key={c.category}
                            onClick={() => openCategoryModal(c.category, label)}
                            style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8f9ff'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}
                          >
                            <td style={{ padding: '12px 16px', fontSize: 13 }}>
                              <span style={{ borderBottom: '1px dashed #aaa' }}>{label}</span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 15 }}>{c.count.toLocaleString()}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#888' }}>{pct}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 20 }}>플랫폼 / 기기</div>
                  {[
                    { title: '웹 / 앱', map: data.platformStats, labels: { web: '웹', app: '앱' }, colors: { web: '#4facfe', app: '#f39c12' } },
                    { title: '기기 유형', map: data.deviceStats, labels: { desktop: '데스크톱', mobile: '모바일', tablet: '태블릿', unknown: '미확인' }, colors: { desktop: '#9b59b6', mobile: '#e74c3c', tablet: '#f39c12', unknown: '#bbb' } },
                  ].map(({ title, map, labels, colors }) => (
                    <div key={title} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 10, fontWeight: 600 }}>{title}</div>
                      {Object.keys(map).length === 0 ? <div style={{ color: '#bbb', fontSize: 13 }}>데이터 없음</div> :
                        Object.entries(map).map(([key, val]) => {
                          const pct = data.summary.total > 0 ? (val / data.summary.total * 100).toFixed(1) : 0
                          return (
                            <div key={key} style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                <span style={{ fontWeight: 500 }}>{labels[key] || key}</span>
                                <span style={{ color: '#888' }}>{val}건 ({pct}%)</span>
                              </div>
                              <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: colors[key] || '#bbb', borderRadius: 3 }} />
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PasswordProtection>
    </>
  )
}
