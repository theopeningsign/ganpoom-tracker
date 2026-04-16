import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 채널 타입 자동 분류
function resolveChannelType(channel) {
  if (!channel) return 'organic'
  const paid = ['naver.searchad', 'google', 'tenping_web', 'naver_gfa']
  const cpa = ['agency']
  if (paid.includes(channel)) return 'paid'
  if (cpa.includes(channel)) return 'cpa'
  return 'organic'
}

// referrer URL에서 도메인 추출
function parseDomain(url) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body

    const channel = body.channel || body.utm_source || null
    const channelType = resolveChannelType(channel)

    const event = {
      event_category: body.event_category || 'unknown',
      platform: body.platform || 'web',

      device_type: body.device_type || null,
      os_name: body.os_name || null,

      channel,
      channel_type: channelType,
      campaign: body.campaign || body.utm_campaign || null,
      ad_group: body.ad_group || null,
      ad_creative: body.ad_creative || null,

      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_content: body.utm_content || null,
      utm_term: body.utm_term || null,

      k_campaign: body.k_campaign || null,
      k_adgroup: body.k_adgroup || null,
      k_creative: body.k_creative || null,
      k_keyword: body.k_keyword || null,
      k_keyword_id: body.k_keyword_id || null,

      gclid: body.gclid || null,

      agent_id: body.agent_id || null,

      referrer: body.referrer || null,
      referrer_domain: parseDomain(body.referrer),
      landing_page: body.landing_page || null,

      client_ip_city: body.client_ip_city || null,
      client_ip_subdivision: body.client_ip_subdivision || null,

      session_id: body.session_id || null,
    }

    const { error } = await supabase.from('events').insert(event)

    if (error) {
      console.error('events insert error:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('track error:', err)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
