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
    .order('created_at', { ascending: false })

  if (platform && platform !== 'all') query = query.eq('platform', platform)

  const { data: events, error } = await query

  if (error) return res.status(500).json({ success: false, error: error.message })

  return res.status(200).json({ success: true, events: events || [] })
}
