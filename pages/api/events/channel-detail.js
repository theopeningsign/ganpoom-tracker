import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { channel, startDate, endDate, platform } = req.query
  if (!channel) return res.status(400).json({ error: 'channel is required' })

  const start = startDate
    ? new Date(startDate)
    : (() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d })()
  const end = endDate ? new Date(endDate + 'T23:59:59') : new Date()

  let base = supabase
    .from('events')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  // channel이 unattributed면 null 또는 unattributed 둘 다
  if (channel === 'unattributed') {
    base = base.or('channel.is.null,channel.eq.unattributed')
  } else {
    base = base.eq('channel', channel)
  }

  if (platform && platform !== 'all') base = base.eq('platform', platform)

  // 최근 이벤트 목록 (최대 50건)
  const { data: recentEvents } = await base
    .select('id, event_category, campaign, ad_group, platform, device_type, client_ip_city, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  // 캠페인 집계
  const { data: allEvents } = await base
    .select('campaign, ad_group, event_category, device_type, platform, created_at')

  const campaigns = {}
  const categories = {}
  const devices = {}
  const platforms = {}
  const daily = {}

  ;(allEvents || []).forEach(ev => {
    // 캠페인
    const camp = ev.campaign || '(없음)'
    if (!campaigns[camp]) campaigns[camp] = 0
    campaigns[camp]++

    // 전환 유형
    const cat = ev.event_category || 'unknown'
    if (!categories[cat]) categories[cat] = 0
    categories[cat]++

    // 기기
    const dev = ev.device_type || 'unknown'
    if (!devices[dev]) devices[dev] = 0
    devices[dev]++

    // 플랫폼
    const plt = ev.platform || 'web'
    if (!platforms[plt]) platforms[plt] = 0
    platforms[plt]++

    // 일별
    const day = ev.created_at?.slice(0, 10)
    if (day) {
      if (!daily[day]) daily[day] = 0
      daily[day]++
    }
  })

  // 일별 정렬
  const dailyTrend = Object.entries(daily)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))

  // 캠페인 정렬
  const campaignList = Object.entries(campaigns)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  return res.status(200).json({
    success: true,
    total: (allEvents || []).length,
    recentEvents: recentEvents || [],
    campaigns: campaignList,
    categories,
    devices,
    platforms,
    dailyTrend,
  })
}
