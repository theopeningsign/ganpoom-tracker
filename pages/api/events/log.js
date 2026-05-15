import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 저장할 전환 이벤트 목록 (페이지뷰 제외)
const ALLOWED_EVENTS = new Set([
  'session.start',
  'comparison.request',
  'simple.request',
  'order.complete',
  'airbridge.user.signup',
  'airbridge.ecommerce.order.completed',
  'airbridge.ecommerce.product.addedToCart',
  'comparison.contract',
  'comparison.consult',
  'consult.chat',
  'phone.click',
  'event.conversion',
  'commerce.order.logo',
  'commerce.order.neon',
  'commerce.order.interior',
  'commerce.order.btv',
  'commerce.order.skb',
  'commerce.order.toss',
  'commerce.order.loud',
  'commerce.order.NKS',
  'commerce.order.ara',
  'commerce.order.rictax',
  'commerce.order.wallskin',
  'commerce.order.cobosys',
  'commerce.order.skbp',
  'commerce.order.fromcobosys',
])

// 이벤트명 정규화 (ganpoomclient. 접두사 제거)
function normalizeEvent(eventCategory) {
  return eventCategory
    .replace(/^ganpoomclient\./, '')
    .replace(/^ganpoom\./, '')
    .replace(/^test\./, '')  // 스테이징 환경 test. 접두사 제거
}

// IP → 도시/지역 (ip-api.com: 무료, 한국 정확도 좋음, rate limit 없음)
async function getIpLocation(ip) {
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) return {}
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName&lang=ko`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return {}
    const data = await res.json()
    return {
      client_ip_city: data.city || null,
      client_ip_subdivision: data.regionName || null,
    }
  } catch (_) { return {} }
}

// 채널 타입 자동 분류
function resolveChannelType(channel) {
  if (!channel) return 'organic'
  const paid = [
    'naver.searchad',
    'naver_powercontents',
    'naver_powerlink_sublink',
    'google',
    'google.adwords',
    'tenping_web',
    'tenping',
    'naver_gfa',
    'facebook.business',
    'kakao',
  ]
  const cpa = ['agency']
  const blog = ['naver_blog_official', 'instagram_official']
  if (paid.includes(channel)) return 'paid'
  if (cpa.includes(channel)) return 'cpa'
  if (blog.includes(channel)) return 'blog'
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
  // CORS - ganpoom.com 및 스테이징 허용
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body

    // 이벤트 필터링 - 전환 이벤트만 저장 (페이지뷰 제외)
    const normalized = normalizeEvent(body.event_category || '')
    const isAllowed = ALLOWED_EVENTS.has(normalized) || ALLOWED_EVENTS.has(body.event_category || '')
    if (!isAllowed) {
      return res.status(200).json({ success: true, skipped: true })
    }

    // 중복 이벤트 방지 + req_id 보정
    const sessionId = body.session_id || null
    const reqId = body.req_id ? parseInt(body.req_id, 10) : null
    const eventCategory = normalized || body.event_category || ''
    const tenSecsAgo = new Date(Date.now() - 10000).toISOString()

    // [진단 로그] comparison.request 수신 시 req_id 여부 기록
    if (eventCategory === 'comparison.request') {
      console.log(`[REQ] received | session=${sessionId} | req_id=${body.req_id ?? 'NONE'} | parsed=${reqId}`)
    }

    if (sessionId && reqId) {
      // req_id 있는 요청: 먼저 같은 session의 req_id=null 행이 있으면 UPDATE하고 종료
      const { data: nullRow } = await supabase
        .from('events')
        .select('id')
        .eq('session_id', sessionId)
        .eq('event_category', eventCategory)
        .is('req_id', null)
        .gte('created_at', tenSecsAgo)
        .limit(1)
        .maybeSingle()
      if (nullRow) {
        const { error: updateError } = await supabase.from('events')
          .update({ req_id: reqId })
          .eq('id', nullRow.id)
        if (updateError) {
          console.error(`[REQ] UPDATE failed | session=${sessionId} | req_id=${reqId} | err=${updateError.message}`)
        } else {
          console.log(`[REQ] UPDATE ok | session=${sessionId} | req_id=${reqId} | row=${nullRow.id}`)
        }
        return res.status(200).json({ success: true, skipped: true, reason: 'updated_req_id' })
      } else {
        console.log(`[REQ] null row not found, will INSERT | session=${sessionId} | req_id=${reqId}`)
      }
    }

    if (sessionId) {
      // 일반 중복 체크 (10초 이내 같은 session + event)
      const { data: existing } = await supabase
        .from('events')
        .select('id, req_id')
        .eq('session_id', sessionId)
        .eq('event_category', eventCategory)
        .gte('created_at', tenSecsAgo)
        .limit(1)
        .maybeSingle()
      if (existing) {
        if (reqId && !existing.req_id) {
          // 중복 행이 req_id=null인데 현재 요청에 req_id 있으면 UPDATE
          const { error: updateError } = await supabase.from('events')
            .update({ req_id: reqId })
            .eq('id', existing.id)
          if (updateError) {
            console.error(`[REQ] dedup UPDATE failed | session=${sessionId} | req_id=${reqId} | err=${updateError.message}`)
          } else {
            console.log(`[REQ] dedup UPDATE ok | session=${sessionId} | req_id=${reqId} | row=${existing.id}`)
          }
        } else if (eventCategory === 'comparison.request') {
          console.log(`[REQ] duplicate skip | session=${sessionId} | existing_req_id=${existing.req_id}`)
        }
        return res.status(200).json({ success: true, skipped: true, reason: 'duplicate' })
      }
    }

    // IP 추출 (프록시/로드밸런서 고려)
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim()
    const ipLocation = await getIpLocation(ip)

    const channel = body.channel || body.utm_source || null
    const channelType = resolveChannelType(channel)

    const event = {
      event_category: normalized || body.event_category || 'unknown',
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
      k_media: body.k_media || null,

      gclid: body.gclid || null,

      agent_id: body.agent_id || null,

      referrer: body.referrer || null,
      referrer_domain: parseDomain(body.referrer),
      landing_page: body.landing_page || null,

      client_ip: ip || null,
      client_ip_city: body.client_ip_city || ipLocation.client_ip_city || null,
      client_ip_subdivision: body.client_ip_subdivision || ipLocation.client_ip_subdivision || null,

      session_id: body.session_id || null,
      req_id: reqId,

      // 스테이징 여부: landing_page 또는 referrer에 staging 포함되면 true
      is_staging: !!(
        (body.landing_page && body.landing_page.includes('staging')) ||
        (body.referrer && body.referrer.includes('staging'))
      ),
    }

    const { data: insertedRow, error } = await supabase.from('events').insert(event).select('id').maybeSingle()

    if (error) {
      console.error('events insert error:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    if (!insertedRow && sessionId && reqId) {
      // INSERT가 DB 트리거(prevent_duplicate_events)에 의해 취소됨
      // → 기존 null 행을 찾아서 req_id UPDATE
      console.log(`[REQ] INSERT cancelled by trigger | session=${sessionId} | req_id=${reqId}`)
      const { data: nullRow } = await supabase
        .from('events')
        .select('id')
        .eq('session_id', sessionId)
        .eq('event_category', event.event_category)
        .is('req_id', null)
        .gte('created_at', tenSecsAgo)
        .limit(1)
        .maybeSingle()
      if (nullRow) {
        const { error: upErr } = await supabase.from('events').update({ req_id: reqId }).eq('id', nullRow.id)
        if (upErr) console.error(`[REQ] trigger fallback UPDATE failed | session=${sessionId} | req_id=${reqId} | err=${upErr.message}`)
        else console.log(`[REQ] trigger fallback UPDATE ok | session=${sessionId} | req_id=${reqId} | row=${nullRow.id}`)
      } else {
        console.log(`[REQ] trigger fallback: no null row found | session=${sessionId} | req_id=${reqId}`)
      }
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('track error:', err)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
