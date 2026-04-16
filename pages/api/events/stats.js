import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { startDate, endDate, platform } = req.query

  const start = startDate ? new Date(startDate) : (() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d
  })()
  const end = endDate ? new Date(endDate + 'T23:59:59') : new Date()

  let query = supabase
    .from('events')
    .select('*')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  if (platform && platform !== 'all') query = query.eq('platform', platform)

  const { data: events, error } = await query

  if (error) {
    console.error('stats error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }

  // 전체 요약
  const total = events.length

  // 채널별 집계
  const channelMap = {}
  events.forEach(e => {
    const key = e.channel || 'unattributed'
    if (!channelMap[key]) channelMap[key] = { channel: key, channel_type: e.channel_type || 'organic', count: 0, categories: {} }
    channelMap[key].count++
    const cat = e.event_category || 'unknown'
    channelMap[key].categories[cat] = (channelMap[key].categories[cat] || 0) + 1
  })
  const channelStats = Object.values(channelMap).sort((a, b) => b.count - a.count)

  // 이벤트 카테고리별 집계
  const categoryMap = {}
  events.forEach(e => {
    const key = e.event_category || 'unknown'
    categoryMap[key] = (categoryMap[key] || 0) + 1
  })
  const categoryStats = Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  // 플랫폼별 (web/app)
  const platformMap = {}
  events.forEach(e => {
    const key = e.platform || 'web'
    platformMap[key] = (platformMap[key] || 0) + 1
  })

  // 기기별 (desktop/mobile)
  const deviceMap = {}
  events.forEach(e => {
    const key = e.device_type || 'unknown'
    deviceMap[key] = (deviceMap[key] || 0) + 1
  })

  // 일별 추이
  const dailyMap = {}
  events.forEach(e => {
    const day = e.created_at.slice(0, 10)
    if (!dailyMap[day]) dailyMap[day] = { date: day, total: 0 }
    dailyMap[day].total++
  })
  const dailyStats = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  // Organic vs Paid vs CPA
  const typeMap = { paid: 0, organic: 0, cpa: 0 }
  events.forEach(e => {
    const t = e.channel_type || 'organic'
    typeMap[t] = (typeMap[t] || 0) + 1
  })

  return res.status(200).json({
    success: true,
    summary: {
      total,
      paid: typeMap.paid,
      organic: typeMap.organic,
      cpa: typeMap.cpa,
    },
    channelStats,
    categoryStats,
    platformStats: platformMap,
    deviceStats: deviceMap,
    dailyStats,
  })
}
