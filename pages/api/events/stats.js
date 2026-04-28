import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 견적요청으로 집계할 이벤트
const QUOTE_EVENTS = [
  'comparison.request',
  'simple.request',
  'airbridge.ecommerce.order.completed',
  'order.complete',
  'comparison.consult',
]

// 회원가입 이벤트
const SIGNUP_EVENTS = [
  'airbridge.user.signup',
]

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { startDate, endDate, platform, staging } = req.query

  const start = startDate ? new Date(startDate) : (() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d
  })()
  const end = endDate ? new Date(endDate + 'T23:59:59') : new Date()

  let baseQuery = supabase
    .from('events')
    .select('*')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  if (platform && platform !== 'all') baseQuery = baseQuery.eq('platform', platform)

  if (staging === 'true') {
    baseQuery = baseQuery.eq('is_staging', true)
  } else {
    baseQuery = baseQuery.eq('is_staging', false)
  }

  const { data: allEvents, error } = await baseQuery

  if (error) {
    console.error('stats error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }

  // 견적요청 이벤트만 필터
  const events = allEvents.filter(e => QUOTE_EVENTS.includes(e.event_category))

  // 회원가입 건수
  const signupCount = allEvents.filter(e => SIGNUP_EVENTS.includes(e.event_category)).length

  // 전체 견적요청 수
  const total = events.length

  // 채널별 방문수 집계 (session.start 이벤트)
  const sessionMap = {}
  allEvents.filter(e => e.event_category === 'session.start').forEach(e => {
    const key = e.channel || 'unattributed'
    sessionMap[key] = (sessionMap[key] || 0) + 1
  })
  const totalSessions = Object.values(sessionMap).reduce((s, v) => s + v, 0)

  // 채널별 집계 (견적 기준)
  const channelMap = {}
  events.forEach(e => {
    const key = e.channel || 'unattributed'
    if (!channelMap[key]) channelMap[key] = { channel: key, channel_type: e.channel_type || 'organic', count: 0 }
    channelMap[key].count++
  })
  const channelStats = Object.values(channelMap).map(ch => ({
    ...ch,
    sessions: sessionMap[ch.channel] || 0,
    conversionRate: sessionMap[ch.channel] > 0
      ? parseFloat(((ch.count / sessionMap[ch.channel]) * 100).toFixed(1))
      : null,
  })).sort((a, b) => b.count - a.count)

  // 견적 유형별 집계 (견적 이벤트만)
  const categoryMap = {}
  events.forEach(e => {
    const key = e.event_category || 'unknown'
    categoryMap[key] = (categoryMap[key] || 0) + 1
  })
  const categoryStats = Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  // 플랫폼별 (견적 기준)
  const platformMap = {}
  events.forEach(e => {
    const key = e.platform || 'web'
    platformMap[key] = (platformMap[key] || 0) + 1
  })

  // 기기별 (견적 기준)
  const deviceMap = {}
  events.forEach(e => {
    const key = e.device_type || 'unknown'
    deviceMap[key] = (deviceMap[key] || 0) + 1
  })

  // 일별 추이 (견적 기준)
  const dailyMap = {}
  events.forEach(e => {
    const day = e.created_at.slice(0, 10)
    if (!dailyMap[day]) dailyMap[day] = { date: day, total: 0 }
    dailyMap[day].total++
  })
  const dailyStats = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  // 채널 유형별 (paid/organic/cpa/blog) - 견적 기준
  const typeMap = { paid: 0, organic: 0, cpa: 0, blog: 0 }
  events.forEach(e => {
    const t = e.channel_type || 'organic'
    typeMap[t] = (typeMap[t] || 0) + 1
  })

  return res.status(200).json({
    success: true,
    summary: {
      total,
      totalSessions,
      paid: typeMap.paid,
      organic: typeMap.organic,
      blog: typeMap.blog,
      cpa: typeMap.cpa,
      signup: signupCount,
    },
    channelStats,
    categoryStats,
    platformStats: platformMap,
    deviceStats: deviceMap,
    dailyStats,
  })
}
