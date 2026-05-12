import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('manual_contracts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ success: false, error: error.message })
    return res.status(200).json({ success: true, data })
  }

  if (req.method === 'POST') {
    const { req_id, product_cost, memo } = req.body
    if (!req_id || !product_cost) {
      return res.status(400).json({ success: false, error: 'req_id와 공급가액은 필수입니다' })
    }
    const { data, error } = await supabase
      .from('manual_contracts')
      .upsert({ req_id: parseInt(req_id, 10), product_cost: parseInt(product_cost, 10), memo: memo || null })
      .select()
      .single()
    if (error) return res.status(500).json({ success: false, error: error.message })
    return res.status(200).json({ success: true, data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ success: false, error: 'id 필요' })
    const { error } = await supabase
      .from('manual_contracts')
      .delete()
      .eq('id', id)
    if (error) return res.status(500).json({ success: false, error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
