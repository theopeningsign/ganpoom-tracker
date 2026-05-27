import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // GET: 연락완료된 req_id 목록 조회
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('unconfirmed_status')
      .select('req_id')
    if (error) return res.status(500).json({ success: false, error: error.message })
    return res.status(200).json({
      success: true,
      req_ids: (data || []).map(r => Number(r.req_id)),
    })
  }

  // POST: 연락완료 처리 (req_id만 저장)
  if (req.method === 'POST') {
    const { req_id } = req.body
    if (!req_id) return res.status(400).json({ success: false, error: 'req_id 필요' })

    const { error } = await supabase
      .from('unconfirmed_status')
      .upsert({ req_id: Number(req_id) }, { onConflict: 'req_id' })

    if (error) return res.status(500).json({ success: false, error: error.message })
    return res.status(200).json({ success: true })
  }

  // DELETE: 연락완료 취소
  if (req.method === 'DELETE') {
    const { req_id } = req.body
    if (!req_id) return res.status(400).json({ success: false, error: 'req_id 필요' })

    const { error } = await supabase
      .from('unconfirmed_status')
      .delete()
      .eq('req_id', Number(req_id))

    if (error) return res.status(500).json({ success: false, error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).end()
}
