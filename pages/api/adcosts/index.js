import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const { year, month } = req.query
    if (!year || !month) return res.status(400).json({ error: 'year, month required' })

    const m = String(month).padStart(2, '0')
    const startDate = `${year}-${m}-01`
    const lastDay = new Date(Number(year), Number(month), 0).getDate()
    const endDate = `${year}-${m}-${String(lastDay).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('ad_costs')
      .select('date, channel, amount')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) return res.status(500).json({ success: false, error: error.message })
    return res.status(200).json({ success: true, costs: data || [] })
  }

  if (req.method === 'POST') {
    const { date, channel, amount } = req.body
    if (!date || !channel) return res.status(400).json({ error: 'date, channel required' })

    const { error } = await supabase
      .from('ad_costs')
      .upsert({ date, channel, amount: Number(amount) || 0 }, { onConflict: 'date,channel' })

    if (error) return res.status(500).json({ success: false, error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
