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

function getDefaultDates() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return { startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${d}` }
}

export default function ChannelsPage() {
  const [dates, setDates] = useState(getDefaultDates)
  const [platform, setPlatform] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedChannel, setSelectedChannel] = useState(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate: dates.startDate, endDate: dates.endDate, platform })
      const res = await fetch(`/api/events/stats?${params}`)
      const json = await res.json()
      if (json.success) setData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [dates, platform])

  useEffect(() => { fetchStats() }, [fetchStats])

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
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: 'white' }}
              >
                <option value="all">웹 + 앱</option>
                <option value="web">웹</option>
                <option value="app">앱</option>
              </select>
              <input type="date" value={dates.startDate}
                onChange={e => setDates(p => ({ ...p, startDate: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
              <span style={{ color: '#888' }}>~</span>
              <input type="date" value={dates.endDate}
                onChange={e => setDates(p => ({ ...p, endDate: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
              <button onClick={fetchStats} style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 22, fontWeight: 700 }}>{ch.count.toLocaleString()}</div>
                            <div style={{ fontSize: 12, color: '#aaa' }}>전환</div>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 50 }}>
                            <div style={{ fontSize: 18, fontWeight: 600, color: '#888' }}>{pct}%</div>
                            <div style={{ fontSize: 12, color: '#aaa' }}>비율</div>
                          </div>
                        </div>
                      </div>

                      {/* 진행바 */}
                      <div style={{ marginTop: 14, height: 4, background: '#f0f0f0', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 채널 상세 패널 */}
              {selectedChannel && selectedData && (
                <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 24, alignSelf: 'start', position: 'sticky', top: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                      {CHANNEL_LABELS[selectedChannel] || selectedChannel}
                    </h3>
                    <button onClick={() => setSelectedChannel(null)} style={{
                      border: 'none', background: '#f5f5f5', borderRadius: 6, padding: '4px 10px',
                      fontSize: 12, cursor: 'pointer', color: '#666'
                    }}>닫기</button>
                  </div>

                  <div style={{ marginBottom: 20, padding: 16, background: '#f8f9fa', borderRadius: 10 }}>
                    <div style={{ fontSize: 13, color: '#888' }}>총 전환</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: CHANNEL_COLORS[selectedChannel] || '#333' }}>
                      {selectedData.count.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 12 }}>전환 유형별</div>
                  {Object.entries(selectedData.categories).length === 0 ? (
                    <div style={{ color: '#bbb', fontSize: 13 }}>데이터 없음</div>
                  ) : Object.entries(selectedData.categories)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, cnt]) => {
                      const pct = selectedData.count > 0 ? (cnt / selectedData.count * 100).toFixed(1) : 0
                      return (
                        <div key={cat} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                            <span>{CATEGORY_LABELS[cat] || cat}</span>
                            <span style={{ fontWeight: 700 }}>{cnt}건 <span style={{ color: '#aaa', fontWeight: 400 }}>({pct}%)</span></span>
                          </div>
                          <div style={{ height: 5, background: '#f0f0f0', borderRadius: 3 }}>
                            <div style={{
                              height: '100%', width: `${pct}%`,
                              background: CHANNEL_COLORS[selectedChannel] || '#4facfe', borderRadius: 3
                            }} />
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PasswordProtection>
  )
}
