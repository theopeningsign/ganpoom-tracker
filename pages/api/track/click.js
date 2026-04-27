import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { agentId, sessionId, referrer, referrerDomain, landingPage, device_type, os_name } = req.body

    if (!agentId) return res.status(400).json({ error: 'agentId required' })

    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim()

    const { error } = await supabase.from('link_clicks').insert({
      agent_id: agentId,
      session_id: sessionId || null,
      referrer: referrer || null,
      referrer_domain: referrerDomain || null,
      landing_page: landingPage || null,
      device_type: device_type || null,
      os_name: os_name || null,
      ip_address: ip || null,
    })

    if (error) {
      console.error('link_clicks insert error:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('click track error:', err)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
