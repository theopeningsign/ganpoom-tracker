import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { startDate, endDate, platform, staging, bots } = req.query

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

  // 봇 제외 (2026-08-03): bots=include 파라미터일 때만 포함
  // bots=agents (2026-10-02): 등록 에이전트 링크(?ref=gp숫자)로 들어온 봇만 추가로 포함 — CPA 추적 엑셀용.
  //   에이전트 실적 공지는 "봇이든 사람이든 링크가 눌린 횟수"를 보여주려는 것(운영자 결정)이라 실적 리포트(link_clicks, 봇 미제외)와 기준을 맞춘다.
  //   ref=thevc 처럼 에이전트가 아닌 값과 다른 채널의 봇은 계속 제외.
  const isAgentBot = e => e.is_bot === true && e.channel === 'agency' && /^gp\d+$/i.test(e.agent_id || '')
  if (bots === 'agents') allEvents = allEvents.filter(e => e.is_bot !== true || isAgentBot(e))
  else if (bots !== 'include') allEvents = allEvents.filter(e => e.is_bot !== true)

  // 채널 값 정규화 (DB에 이미 저장된 구버전 값도 통일)
  const CHANNEL_NORMALIZE = { 'ig': 'instagram_official', 'instagram': 'instagram_official' }
  const normalizedEvents = allEvents.map(ev => ({
    ...ev,
    channel: CHANNEL_NORMALIZE[ev.channel] || ev.channel,
  }))

  return res.status(200).json({ success: true, events: normalizedEvents })
}
