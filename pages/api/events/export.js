import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { startDate, endDate, platform, staging } = req.query

  const start = startDate ? new Date(startDate + 'T00:00:00+09:00') : (() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d
  })()
  const end = endDate ? new Date(endDate + 'T23:59:59.999+09:00') : new Date()

  // Supabase 기본 limit이 1000행이라 페이지네이션으로 전체 데이터 조회
  const PAGE_SIZE = 1000
  let allEvents = []
  let page = 0

  while (true) {
    let query = supabase
      .from('events')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (platform && platform !== 'all') query = query.eq('platform', platform)

    if (staging === 'true') {
      query = query.eq('is_staging', true)
    } else {
      query = query.eq('is_staging', false)
    }

    const { data, error } = await query
    if (error) return res.status(500).json({ success: false, error: error.message })

    allEvents = allEvents.concat(data || [])
    if (!data || data.length < PAGE_SIZE) break
    page++
  }

  return res.status(200).json({ success: true, events: allEvents })
}
