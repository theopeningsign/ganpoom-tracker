import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import * as XLSX from 'xlsx'
import PasswordProtection from '../components/PasswordProtection'

const CHANNEL_LABELS = {
  'naver.searchad': '네이버 검색광고',
  'google': '구글 광고',
  'tenping_web': '텐핑',
  'agency': 'CPA 에이전시',
  'naver_blog_official': '네이버 블로그',
  'instagram_official': '인스타그램',
  'unattributed': '자연유입',
}

const CHANNEL_COLORS = {
  'naver.searchad': '#03C75A',
  'google': '#4285F4',
  'tenping_web': '#FF6B35',
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

const CATEGORY_LABELS = {
  'comparison.request': '비교견적 요청',
  'order.complete': '주문 완료',
  'simple.request': '간단 견적요청',
  'home.screen': '홈화면 조회',
  'airbridge.user.signup': '회원가입',
  'airbridge.user.signin': '로그인',
  'airbridge.ecommerce.order.completed': '주문완료',
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

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a' }}>{value?.toLocaleString() ?? 0}</div>
      {sub && <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

const NAV = [
  { href: '/', label: '대시보드', icon: '📊' },
  { href: '/channels', label: '채널 분석', icon: '📡' },
  { href: '/admin/agents', label: 'CPA 에이전트', icon: '👥' },
  { href: '/admin/settlement', label: '정산 관리', icon: '💰' },
]

function Sidebar({ current }) {
  return (
    <div style={{
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
  const [dates, setDates] = useState(getDefaultDates)
  const [activePreset, setActivePreset] = useState('today')
  const [platform, setPlatform] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate: dates.startDate, endDate: dates.endDate, platform })
      const res = await fetch(`/api/events/stats?${params}`)
      const json = await res.json()
      if (json.success) setData(json)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [dates, platform])

  useEffect(() => { fetchStats() }, [fetchStats])

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
        'Event Datetime': e.created_at ? new Date(e.created_at).toLocaleString('ko-KR') : '',
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

  const exportExcel = useCallback(async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ startDate: dates.startDate, endDate: dates.endDate, platform })
      const res = await fetch(`/api/events/export?${params}`)
      const json = await res.json()
      if (!json.success) return
      const rows = json.events.map(e => ({
        'Event Category': e.event_category || '',
        'Event Datetime': e.created_at ? new Date(e.created_at).toLocaleString('ko-KR') : '',
        'Channel': e.channel || 'unattributed',
        'Campaign': e.campaign || '',
        'Ad Group': e.ad_group || '',
        'Ad Creative': e.ad_creative || '',
        'Browser Referrer': e.referrer || '',
        'Device Type': e.device_type || '',
        'OS Name': e.os_name || '',
        'Client IP City': e.client_ip_city || '',
        'Client IP Subdivision': e.client_ip_subdivision || '',
        'Platform': e.platform || 'web',
        'UTM Source': e.utm_source || '',
        'UTM Medium': e.utm_medium || '',
        'UTM Campaign': e.utm_campaign || '',
        'k_campaign': e.k_campaign || '',
        'k_adgroup': e.k_adgroup || '',
        'k_keyword': e.k_keyword || '',
        'gclid': e.gclid || '',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [30,22,20,35,15,15,40,12,12,18,22,8,18,14,30,30,20,20,25].map(w => ({ wch: w }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Events')
      XLSX.writeFile(wb, `ganpoom_${dates.startDate}_${dates.endDate}.xlsx`)
    } catch (e) { console.error(e) }
    finally { setExporting(false) }
  }, [dates, platform])

  return (
    <PasswordProtection>
      <div style={{ background: '#f5f6fa', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <Sidebar current="/" />
        <div style={{ marginLeft: 220, padding: 32 }}>

          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>대시보드</h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>채널별 전환 현황</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* 플랫폼 */}
              <select value={platform} onChange={e => setPlatform(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: 'white' }}>
                <option value="all">웹 + 앱</option>
                <option value="web">웹</option>
                <option value="app">앱</option>
              </select>

              {/* 기간 프리셋 버튼 */}
              <div style={{ display: 'flex', gap: 4, background: '#f0f2f5', borderRadius: 8, padding: 3 }}>
                {DATE_PRESETS.map(({ key, label }) => (
                  <button key={key} onClick={() => {
                    const range = getDateRange(key)
                    setDates(range)
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

              {/* 직접 날짜 입력 */}
              <input type="date" value={dates.startDate}
                onChange={e => { setDates(p => ({ ...p, startDate: e.target.value })); setActivePreset('') }}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
              <span style={{ color: '#888' }}>~</span>
              <input type="date" value={dates.endDate}
                onChange={e => { setDates(p => ({ ...p, endDate: e.target.value })); setActivePreset('') }}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />

              <button onClick={fetchStats}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#4facfe', color: 'white', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                조회
              </button>
              <button onClick={exportCSV} disabled={exporting}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontSize: 13, cursor: 'pointer' }}>
                CSV
              </button>
              <button onClick={exportExcel} disabled={exporting}
                style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#217346', color: 'white', fontSize: 13, cursor: 'pointer' }}>
                Excel
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>불러오는 중...</div>
          ) : !data ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>데이터가 없습니다</div>
          ) : (
            <>
              {/* 요약 카드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                <StatCard label="전체 전환" value={data.summary.total} color="#4facfe" />
                <StatCard label="유료 광고" value={data.summary.paid} sub="Paid" color="#f39c12" />
                <StatCard label="자연유입 / 블로그" value={data.summary.organic} sub="Organic" color="#27ae60" />
                <StatCard label="CPA 에이전시" value={data.summary.cpa} sub="CPA" color="#9b59b6" />
              </div>

              {/* 채널 테이블 + 일별 추이 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 15 }}>채널별 전환</div>
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
                        return (
                          <tr key={ch.channel} style={{ borderBottom: '1px solid #f5f5f5' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{CHANNEL_LABELS[ch.channel] || ch.channel}</span>
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
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 20 }}>일별 전환 추이</div>
                  {data.dailyStats.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#bbb', fontSize: 13 }}>데이터가 없습니다</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={data.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip formatter={v => [v + '건', '전환']} />
                        <Line type="monotone" dataKey="total" stroke="#4facfe" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* 전환 유형 + 플랫폼/기기 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 15 }}>전환 유형</div>
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
                        return (
                          <tr key={c.category} style={{ borderBottom: '1px solid #f5f5f5' }}>
                            <td style={{ padding: '12px 16px', fontSize: 13 }}>{CATEGORY_LABELS[c.category] || c.category}</td>
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
  )
}
