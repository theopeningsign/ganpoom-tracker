import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
      const last = new Date(today.getFullYear(), today.getMonth(), 0)
      return { startDate: toYMD(first), endDate: toYMD(last) }
    }
    default:
      return { startDate: toYMD(today), endDate: toYMD(today) }
  }
}

const DATE_PRESETS = [
  { key: 'today', label: '오늘' },
  { key: 'yesterday', label: '어제' },
  { key: 'thisMonth', label: '이번달' },
  { key: 'lastMonth', label: '지난달' },
]

function getDefaultDates() {
  return getDateRange('today')
}

const EVENT_LABELS = {
  'comparison.request': '비교견적 요청',
  'simple.request': '간단견적 요청',
  'order.complete': '주문 완료',
  'airbridge.user.signup': '회원가입',
  'airbridge.user.signin': '로그인',
  'airbridge.ecommerce.order.completed': '스타일시공 요청',
  'airbridge.ecommerce.product.addedToCart': '장바구니 추가',
  'comparison.contract': '계약',
  'comparison.consult': '상담 요청',
  'consult.chat': '채팅 상담',
  'phone.click': '전화 클릭',
  'event.conversion': '전환',
}

export default function ChannelsPage() {
  const [dates, setDates] = useState(getDefaultDates)
  const [activePreset, setActivePreset] = useState('today')
  const [platform, setPlatform] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStaging, setShowStaging] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [detail, setDetail] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState('events') // 'events' | 'campaigns' | 'keywords' | 'trend'

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate: dates.startDate, endDate: dates.endDate, platform, staging: showStaging ? 'true' : 'false' })
      const res = await fetch(`/api/events/stats?${params}`)
      const json = await res.json()
      if (json.success) setData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [dates, platform, showStaging])

  const fetchDetail = useCallback(async (channel) => {
    setDetailLoading(true)
    setDetail(null)
    try {
      const params = new URLSearchParams({ channel, startDate: dates.startDate, endDate: dates.endDate, platform })
      const res = await fetch(`/api/events/channel-detail?${params}`)
      const json = await res.json()
      if (json.success) setDetail(json)
    } catch (e) {
      console.error(e)
    } finally {
      setDetailLoading(false)
    }
  }, [dates, platform])

  useEffect(() => { fetchStats() }, [fetchStats])

  useEffect(() => {
    if (selectedChannel) {
      setDetailTab('events')
      fetchDetail(selectedChannel)
    } else {
      setDetail(null)
    }
  }, [selectedChannel, fetchDetail])

  const selectedData = selectedChannel && data
    ? data.channelStats.find(c => c.channel === selectedChannel)
    : null

  return (
    <PasswordProtection>
      <div style={{ background: '#f5f6fa', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        {/* 사이드바 */}
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
            {[
              { href: '/', label: '대시보드', icon: '📊' },
              { href: '/channels', label: '채널 분석', icon: '📡' },
              { href: '/admin/agents', label: 'CPA 에이전트', icon: '👥' },
              { href: '/admin/settlement', label: '정산 관리', icon: '💰' },
            ].map(({ href, label, icon }) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 20px', fontSize: 14, color: 'rgba(255,255,255,0.75)',
                  background: href === '/channels' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderLeft: href === '/channels' ? '3px solid #4facfe' : '3px solid transparent',
                }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* 메인 */}
        <div style={{ marginLeft: 220, padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>채널 분석</h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>채널을 클릭하면 상세 내용을 볼 수 있습니다</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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

              <input type="date" value={dates.startDate}
                onChange={e => { setDates(p => ({ ...p, startDate: e.target.value })); setActivePreset('') }}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
              <span style={{ color: '#888' }}>~</span>
              <input type="date" value={dates.endDate}
                onChange={e => { setDates(p => ({ ...p, endDate: e.target.value })); setActivePreset('') }}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />

              <button onClick={fetchStats} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#4facfe', color: 'white', fontSize: 13, cursor: 'pointer', fontWeight: 600
              }}>조회</button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>불러오는 중...</div>
          ) : !data ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>데이터가 없습니다</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: selectedChannel ? '1fr 380px' : '1fr', gap: 20 }}>

              {/* 채널 카드 목록 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.channelStats.length === 0 ? (
                  <div style={{
                    background: 'white', borderRadius: 12, padding: 60,
                    textAlign: 'center', color: '#bbb', fontSize: 14,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    선택한 기간에 데이터가 없습니다
                  </div>
                ) : data.channelStats.map(ch => {
                  const badge = TYPE_BADGE[ch.channel_type] || TYPE_BADGE.organic
                  const pct = data.summary.total > 0 ? ((ch.count / data.summary.total) * 100).toFixed(1) : '0.0'
                  const color = CHANNEL_COLORS[ch.channel] || '#bbb'
                  const label = CHANNEL_LABELS[ch.channel] || ch.channel
                  const isSelected = selectedChannel === ch.channel

                  return (
                    <div
                      key={ch.channel}
                      onClick={() => setSelectedChannel(isSelected ? null : ch.channel)}
                      style={{
                        background: 'white', borderRadius: 12, padding: '20px 24px',
                        boxShadow: isSelected ? `0 0 0 2px ${color}, 0 4px 16px rgba(0,0,0,0.1)` : '0 2px 8px rgba(0,0,0,0.08)',
                        cursor: 'pointer', transition: 'all 0.15s',
                        borderLeft: `5px solid ${color}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{label}</span>
                          <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 20,
                            background: badge.bg, color: badge.color, fontWeight: 600
                          }}>{badge.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                          {ch.sessions > 0 && (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 18, fontWeight: 700, color: '#555' }}>{ch.sessions.toLocaleString()}</div>
                              <div style={{ fontSize: 11, color: '#aaa' }}>방문</div>
                            </div>
                          )}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 22, fontWeight: 700 }}>{ch.count.toLocaleString()}</div>
                            <div style={{ fontSize: 12, color: '#aaa' }}>견적요청</div>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 58 }}>
                            {ch.conversionRate !== null ? (
                              <>
                                <div style={{
                                  fontSize: 18, fontWeight: 700,
                                  color: ch.conversionRate >= 5 ? '#27ae60' : ch.conversionRate >= 2 ? '#f39c12' : '#e74c3c'
                                }}>{ch.conversionRate}%</div>
                                <div style={{ fontSize: 11, color: '#aaa' }}>전환율</div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: 18, fontWeight: 600, color: '#888' }}>{pct}%</div>
                                <div style={{ fontSize: 12, color: '#aaa' }}>비율</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 퍼널 / 진행바 */}
                      {ch.sessions > 0 ? (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#bbb', marginBottom: 4 }}>
                            <span>방문 {ch.sessions.toLocaleString()}</span>
                            <span>견적 {ch.count.toLocaleString()}</span>
                          </div>
                          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, position: 'relative' }}>
                            <div style={{
                              position: 'absolute', left: 0, top: 0, height: '100%',
                              width: `${Math.min((ch.count / ch.sessions) * 100, 100)}%`,
                              background: color, borderRadius: 3, transition: 'width 0.4s'
                            }} />
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: 14, height: 4, background: '#f0f0f0', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.4s' }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 채널 상세 패널 */}
              {selectedChannel && selectedData && (
                <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 24, alignSelf: 'start', position: 'sticky', top: 20, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
                  {/* 헤더 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: CHANNEL_COLORS[selectedChannel] || '#bbb' }} />
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                        {CHANNEL_LABELS[selectedChannel] || selectedChannel}
                      </h3>
                    </div>
                    <button onClick={() => setSelectedChannel(null)} style={{
                      border: 'none', background: '#f5f5f5', borderRadius: 6, padding: '4px 10px',
                      fontSize: 12, cursor: 'pointer', color: '#666'
                    }}>✕ 닫기</button>
                  </div>

                  {/* 요약 카드 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                    <div style={{ padding: '12px 14px', background: '#f8f9fa', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>총 전환</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: CHANNEL_COLORS[selectedChannel] || '#333' }}>
                        {selectedData.count.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px', background: '#f8f9fa', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>캠페인 수</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#555' }}>
                        {detail ? detail.campaigns.filter(c => c.name !== '(없음)').length : '-'}
                      </div>
                    </div>
                  </div>

                  {/* 탭 */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f5f6fa', borderRadius: 8, padding: 4 }}>
                    {[
                      { key: 'events', label: '이벤트 내역' },
                      { key: 'campaigns', label: '캠페인' },
                      ...(detail && detail.keywords && detail.keywords.length > 0 ? [{ key: 'keywords', label: '키워드' }] : []),
                      { key: 'trend', label: '일별 추이' },
                    ].map(tab => (
                      <button key={tab.key} onClick={() => setDetailTab(tab.key)} style={{
                        flex: 1, padding: '7px 0', border: 'none', borderRadius: 6,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: detailTab === tab.key ? 'white' : 'transparent',
                        color: detailTab === tab.key ? '#333' : '#888',
                        boxShadow: detailTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                      }}>{tab.label}</button>
                    ))}
                  </div>

                  {detailLoading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 13 }}>불러오는 중...</div>
                  ) : !detail ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#ccc', fontSize: 13 }}>데이터 없음</div>
                  ) : (
                    <>
                      {/* 이벤트 내역 탭 */}
                      {detailTab === 'events' && (
                        <div>
                          <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                            최근 {detail.recentEvents.length}건 (최대 50건)
                          </div>
                          {detail.recentEvents.length === 0 ? (
                            <div style={{ color: '#ccc', fontSize: 13, textAlign: 'center', padding: 30 }}>이벤트 없음</div>
                          ) : detail.recentEvents.map((ev, i) => {
                            const dt = new Date(ev.created_at)
                            const dateStr = `${dt.getMonth()+1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
                            return (
                              <div key={ev.id || i}
                                onClick={() => setSelectedEvent(ev)}
                                style={{
                                padding: '10px 0',
                                borderBottom: '1px solid #f0f0f0',
                                display: 'flex', flexDirection: 'column', gap: 4,
                                cursor: 'pointer', borderRadius: 6,
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{
                                    fontSize: 12, fontWeight: 600,
                                    background: '#eef4ff', color: '#4facfe',
                                    padding: '2px 8px', borderRadius: 20
                                  }}>
                                    {EVENT_LABELS[ev.event_category] || ev.event_category}
                                  </span>
                                  <span style={{ fontSize: 11, color: '#aaa' }}>{dateStr}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {ev.campaign && (
                                    <span style={{ fontSize: 11, color: '#666' }}>📢 {ev.campaign}</span>
                                  )}
                                  {ev.device_type && (
                                    <span style={{ fontSize: 11, color: '#888' }}>
                                      {ev.device_type === 'mobile' ? '📱' : '🖥️'} {ev.device_type}
                                    </span>
                                  )}
                                  {ev.client_ip_city && (
                                    <span style={{ fontSize: 11, color: '#888' }}>📍 {ev.client_ip_city}</span>
                                  )}
                                  {ev.platform === 'app' && (
                                    <span style={{ fontSize: 11, color: '#9B59B6', fontWeight: 600 }}>앱</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* 캠페인 탭 */}
                      {detailTab === 'campaigns' && (
                        <div>
                          {detail.campaigns.length === 0 ? (
                            <div style={{ color: '#ccc', fontSize: 13, textAlign: 'center', padding: 30 }}>데이터 없음</div>
                          ) : detail.campaigns.map(camp => {
                            const pct = detail.total > 0 ? (camp.count / detail.total * 100).toFixed(1) : 0
                            return (
                              <div key={camp.name} style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                                  <span style={{ color: camp.name === '(없음)' ? '#bbb' : '#333', fontWeight: 500 }}>
                                    {camp.name}
                                  </span>
                                  <span style={{ fontWeight: 700 }}>
                                    {camp.count}건
                                    <span style={{ color: '#aaa', fontWeight: 400, fontSize: 12 }}> ({pct}%)</span>
                                  </span>
                                </div>
                                <div style={{ height: 5, background: '#f0f0f0', borderRadius: 3 }}>
                                  <div style={{
                                    height: '100%', width: `${pct}%`,
                                    background: CHANNEL_COLORS[selectedChannel] || '#4facfe', borderRadius: 3
                                  }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* 키워드 탭 */}
                      {detailTab === 'keywords' && (
                        <div>
                          <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                            견적요청을 만든 키워드 ({detail.keywords.length}개)
                          </div>
                          {detail.keywords.length === 0 ? (
                            <div style={{ color: '#ccc', fontSize: 13, textAlign: 'center', padding: 30 }}>키워드 데이터 없음</div>
                          ) : (() => {
                            const max = Math.max(...detail.keywords.map(k => k.visits), 1)
                            return detail.keywords.map((kw) => {
                              const pct = (kw.visits / max * 100).toFixed(1)
                              const isNaver = kw.source === 'naver'
                              const convRate = kw.visits > 0 ? ((kw.quotes / kw.visits) * 100).toFixed(1) : '0.0'
                              return (
                                <div key={kw.keyword} style={{ marginBottom: 14 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 5 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{
                                        fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 600,
                                        background: isNaver ? '#e8f9ee' : '#e8f0fe',
                                        color: isNaver ? '#03C75A' : '#4285F4'
                                      }}>{isNaver ? 'N' : 'G'}</span>
                                      <span style={{ color: '#333', fontWeight: 500 }}>{kw.keyword}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                      <span style={{ fontSize: 11, color: '#888' }}>방문 {kw.visits}</span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>견적 {kw.quotes}건</span>
                                      <span style={{
                                        fontSize: 11, fontWeight: 700,
                                        color: parseFloat(convRate) >= 5 ? '#27ae60' : parseFloat(convRate) >= 2 ? '#f39c12' : '#e74c3c'
                                      }}>{convRate}%</span>
                                    </div>
                                  </div>
                                  <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                                    <div style={{
                                      height: '100%', width: `${pct}%`,
                                      background: isNaver ? '#03C75A' : '#4285F4',
                                      borderRadius: 3, transition: 'width 0.4s'
                                    }} />
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      )}

                      {/* 일별 추이 탭 */}
                      {detailTab === 'trend' && (
                        <div>
                          {detail.dailyTrend.length === 0 ? (
                            <div style={{ color: '#ccc', fontSize: 13, textAlign: 'center', padding: 30 }}>데이터 없음</div>
                          ) : (() => {
                            const max = Math.max(...detail.dailyTrend.map(d => d.count), 1)
                            return detail.dailyTrend.map(d => {
                              const pct = (d.count / max * 100).toFixed(1)
                              const date = new Date(d.date)
                              const label = `${date.getMonth()+1}/${date.getDate()}`
                              return (
                                <div key={d.date} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ fontSize: 12, color: '#888', minWidth: 36 }}>{label}</div>
                                  <div style={{ flex: 1, height: 18, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{
                                      height: '100%', width: `${pct}%`,
                                      background: CHANNEL_COLORS[selectedChannel] || '#4facfe',
                                      borderRadius: 4, display: 'flex', alignItems: 'center',
                                      minWidth: d.count > 0 ? 24 : 0
                                    }} />
                                  </div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#555', minWidth: 28, textAlign: 'right' }}>
                                    {d.count}
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 이벤트 상세 모달 */}
      {selectedEvent && (
        <div onClick={() => setSelectedEvent(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, padding: 32,
            width: 480, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>이벤트 상세</h3>
              <button onClick={() => setSelectedEvent(null)} style={{
                border: 'none', background: '#f0f0f0', borderRadius: 6,
                padding: '4px 10px', cursor: 'pointer', fontSize: 13
              }}>✕ 닫기</button>
            </div>

            {[
              ['이벤트', EVENT_LABELS[selectedEvent.event_category] || selectedEvent.event_category],
              ['발생 시각', selectedEvent.created_at ? new Date(selectedEvent.created_at).toLocaleString('ko-KR') : '-'],
              ['채널', CHANNEL_LABELS[selectedEvent.channel] || selectedEvent.channel || '-'],
              ['캠페인', selectedEvent.campaign || '-'],
              ['광고그룹', selectedEvent.ad_group || '-'],
              ['플랫폼', selectedEvent.platform || '-'],
              ['기기', selectedEvent.device_type || '-'],
              ['OS', selectedEvent.os_name || '-'],
              ['지역', selectedEvent.client_ip_city ? `${selectedEvent.client_ip_city} ${selectedEvent.client_ip_subdivision || ''}` : '-'],
              ['IP', selectedEvent.client_ip || '-'],
              ['UTM Source', selectedEvent.utm_source || '-'],
              ['UTM Medium', selectedEvent.utm_medium || '-'],
              ['UTM Campaign', selectedEvent.utm_campaign || '-'],
              ['Naver 캠페인', selectedEvent.k_campaign || '-'],
              ['Naver 광고그룹', selectedEvent.k_adgroup || '-'],
              ['Naver 키워드', selectedEvent.k_keyword || '-'],
              ['Google GCLID', selectedEvent.gclid || '-'],
              ['에이전트 ID', selectedEvent.agent_id || '-'],
              ['랜딩 페이지', selectedEvent.landing_page || '-'],
              ['유입 경로', selectedEvent.referrer || '-'],
              ['세션 ID', selectedEvent.session_id || '-'],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '8px 0', gap: 12
              }}>
                <div style={{ fontSize: 12, color: '#888', minWidth: 110, flexShrink: 0 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#333', wordBreak: 'break-all' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </PasswordProtection>
  )
}
