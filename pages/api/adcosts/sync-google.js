/**
 * POST /api/adcosts/sync-google
 *
 * 구글 광고 스크립트(docs/google-ads/2단계_자동전송.js)가 매일 06시에 캠페인 유형별 일별 비용을
 * 여기로 보내면 ad_costs 에 자동 입력한다 — 빈 칸만 (규칙은 lib/adcostSync.js).
 * 네이버(sync-naver)는 트래커가 가져오는 구조, 구글은 구글이 밀어넣는 구조라 방향이 반대.
 *
 * 인증: `Authorization: Bearer <CRON_SECRET>` (스크립트가 헤더로 보냄). 없거나 틀리면 401.
 * 본문(JSON): { rows: [ { date:'YYYY-MM-DD', type:'SEARCH'|'MULTI_CHANNEL', cost: 원(숫자) }, … ] }
 *   - 유형 매핑: SEARCH→google, MULTI_CHANNEL→google_app (그 외 유형은 무시, 응답 ignoredTypes 에 표시)
 *   - 금액은 구글 화면 금액 그대로(부가세 환산 없음 — 2026-09-21 수기값 20칸 전부 일치 확인)
 * 응답: { success, since, until, written, skipped, ignoredTypes, rows:[{date,channel,amount}] }
 */
import { planGoogleSync, applyPlan } from '../../../lib/adcostSync.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_ROWS = 500   // 7일 × 유형 몇 개면 충분 — 잘못된 대량 전송 방지

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })

  const secret = process.env.CRON_SECRET
  if (!secret) return res.status(500).json({ success: false, error: 'CRON_SECRET 환경변수가 없습니다' })
  const bearer = req.headers.authorization || ''
  if (bearer !== `Bearer ${secret}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  // Next 가 JSON 을 파싱해 주지만, 스크립트가 content-type 을 빠뜨리면 문자열로 올 수 있어 한 번 더 감싼다
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { return res.status(400).json({ success: false, error: '본문이 JSON 이 아닙니다' }) }
  }
  const rows = body && body.rows
  if (!Array.isArray(rows)) return res.status(400).json({ success: false, error: 'rows 배열이 필요합니다' })
  if (rows.length > MAX_ROWS) return res.status(400).json({ success: false, error: `rows 가 너무 많습니다 (최대 ${MAX_ROWS})` })
  for (const r of rows) {
    if (!r || !DATE_RE.test(r.date || '') || typeof r.type !== 'string' || !Number.isFinite(Number(r.cost))) {
      return res.status(400).json({ success: false, error: '각 row 는 {date:YYYY-MM-DD, type:문자열, cost:숫자} 형식', bad: r })
    }
  }

  try {
    const plan = await planGoogleSync(rows)
    const result = await applyPlan(plan)
    const skipped = plan.items.filter(i => i.action === 'skip').length
    console.log(`[sync-google] ${plan.since}~${plan.until} rows=${rows.length} written=${result.written} skipped=${skipped} ignored=${plan.ignoredTypes.join(',') || '-'}`)
    return res.status(200).json({
      success: true,
      since: plan.since,
      until: plan.until,
      written: result.written,
      skipped,
      ignoredTypes: plan.ignoredTypes,
      rows: result.rows,
    })
  } catch (e) {
    console.error('[sync-google] error:', e)
    return res.status(500).json({ success: false, error: e.message })
  }
}
