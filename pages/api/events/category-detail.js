import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { category, startDate, endDate, platform, staging } = req.query
  if (!category) return res.status(400).json({ error: 'category required' })

  try {
    let query = supabase
      .from('events')
      .select('channel, channel_type, created_at')
      .eq('event_category', category)

    if (startDate) query = query.gte('created_at', `${startDate}T00:00:00+09:00`)
    if (endDate)   query = query.lte('created_at', `${endDate}T23:59:59+09:00`)
    if (platform && platform !== 'all') query = query.eq('platform', platform)
    if (staging !== 'true') query = query.or('is_staging.is.null,is_staging.eq.false')

    const { data, error } = await query
    if (error) throw error

    // 채널별 집계
    const channelMap = {}
    for (const row of data) {
      const ch = row.channel || 'unattributed'
      if (!channelMap[ch]) channelMap[ch] = { channel: ch, channel_type: row.channel_type || 'organic', count: 0 }
      channelMap[ch].count++
    }

    const channelStats = Object.values(channelMap).sort((a, b) => b.count - a.count)
    const total = data.length

    return res.status(200).json({ success: true, total, channelStats })
  } catch (err) {
    console.error('category-detail error:', err)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
