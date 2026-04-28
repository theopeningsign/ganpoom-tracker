import { createClient } from '@supabase/supabase-js'
import { QUOTE_EVENTS } from '../../../lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { channel, startDate, endDate, platform } = req.query
  if (!channel) return res.status(400).json({ error: 'channel is required' })

  try {
    const start = startDate
      ? new Date(startDate)
      : (() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d })()
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date()

    const applyFilters = (q) => {
      q = q.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
      if (channel === 'unattributed') {
        q = q.or('channel.is.null,channel.eq.unattributed')
      } else {
        q = q.eq('channel', channel)
      }
      if (platform && platform !== 'all') q = q.eq('platform', platform)
      return q
    }

    // 최근 이벤트 목록 (최대 50건)
    const { data: recentEvents, error: recentError } = await applyFilters(
      supabase.from('events').select('id, event_category, campaign, ad_group, platform, device_type, client_ip_city, created_at')
        .in('event_category', QUOTE_EVENTS)
    ).order('created_at', { ascending: false }).limit(50)

    if (recentError) console.error('recentEvents error:', recentError)

    // 전체 이벤트 집계
    const { data: allEvents, error: allError } = await applyFilters(
      supabase.from('events').select('campaign, ad_group, event_category, device_type, platform, created_at, k_keyword, utm_term')
    )

    if (allError) console.error('allEvents error:', allError)

    const campaigns = {}
    const categories = {}
    const devices = {}
    const platforms = {}
    const daily = {}
    const keywords = {}

    ;(allEvents || []).forEach(ev => {
      const camp = ev.campaign || '(없음)'
      if (!campaigns[camp]) campaigns[camp] = 0
      campaigns[camp]++

      const cat = ev.event_category || 'unknown'
      if (!categories[cat]) categories[cat] = 0
      categories[cat]++

      const dev = ev.device_type || 'unknown'
      if (!devices[dev]) devices[dev] = 0
      devices[dev]++

      const plt = ev.platform || 'web'
      if (!platforms[plt]) platforms[plt] = 0
      platforms[plt]++

      const day = ev.created_at?.slice(0, 10)
      if (day) {
        if (!daily[day]) daily[day] = 0
        daily[day]++
      }

      const kw = ev.k_keyword || ev.utm_term
      if (kw) {
        if (!keywords[kw]) keywords[kw] = { keyword: kw, visits: 0, quotes: 0, source: ev.k_keyword ? 'naver' : 'google' }
        keywords[kw].visits++
        if (QUOTE_EVENTS.includes(ev.event_category)) {
          keywords[kw].quotes++
        }
      }
    })

    const dailyTrend = Object.entries(daily)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))

    const campaignList = Object.entries(campaigns)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))

    const keywordList = Object.values(keywords)
      .sort((a, b) => b.quotes - a.quotes || b.visits - a.visits)

    return res.status(200).json({
      success: true,
      total: (allEvents || []).length,
      recentEvents: recentEvents || [],
      campaigns: campaignList,
      keywords: keywordList,
      categories,
      devices,
      platforms,
      dailyTrend,
    })
  } catch (err) {
    console.error('channel-detail error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
