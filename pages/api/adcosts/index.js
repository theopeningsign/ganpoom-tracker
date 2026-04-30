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
    const { year, month, startDate: sd, endDate: ed } = req.query

    let startDate, endDate

    if (sd && ed) {
      // 날짜 범위 모드 (채널분석에서 사용)
      startDate = sd
      endDate = ed
    } else if (year && month) {
      // 월별 모드 (광고비 입력에서 사용)
      const m = String(month).padStart(2, '0')
      startDate = `${year}-${m}-01`
      const lastDay = new Date(Number(year), Number(month), 0).getDate()
      endDate = `${year}-${m}-${String(lastDay).padStart(2, '0')}`
    } else {
      return res.status(400).json({ error: 'year+month or startDate+endDate required' })
    }

    const { data, error } = await supabase
      .from('ad_costs')
      .select('date, channel, amount')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) return res.status(500).json({ success: false, error: error.message })

    // 날짜 범위 모드면 채널별 합계도 함께 반환
    if (sd && ed) {
      const totals = {}
      ;(data || []).forEach(row => {
        totals[row.channel] = (totals[row.channel] || 0) + row.amount
      })
      return res.status(200).json({ success: true, costs: data || [], totals })
    }

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
