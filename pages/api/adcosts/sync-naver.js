/**
 * GET /api/adcosts/sync-naver
 *
 * 네이버 검색광고 광고비를 ad_costs 에 자동 입력한다 — 빈 칸만 (규칙은 lib/adcostSync.js).
 *
 * 호출 주체 두 가지, 둘 다 CRON_SECRET 을 알아야 통과:
 *   1) Vercel Cron (vercel.json, 매일 06:00 KST) — Vercel 이 `Authorization: Bearer <CRON_SECRET>` 를 자동 첨부
 *   2) 수동 실행 — 브라우저에서 `/api/adcosts/sync-naver?key=<CRON_SECRET>` (비밀값이므로 URL 을 남에게 공유하지 말 것)
 *
 * 선택 파라미터: ?since=YYYY-MM-DD (기본 7일 전)  ?until=YYYY-MM-DD (어제를 넘길 수 없음)
 * 응답: { success, since, until, written, skipped, rows:[{date,channel,amount}] }
 */
import { planNaverSync, applyPlan } from '../../../lib/adcostSync.js'
import { isConfigured } from '../../../lib/naverAds.js'

// 캠페인 수만큼 네이버 호출(현재 12회, 순차) — 기본 10초 제한에 걸리지 않도록 여유를 둔다
export const config = { maxDuration: 60 }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' })

  const secret = process.env.CRON_SECRET
  if (!secret) return res.status(500).json({ success: false, error: 'CRON_SECRET 환경변수가 없습니다' })
  const bearer = req.headers.authorization || ''
  if (bearer !== `Bearer ${secret}` && req.query.key !== secret) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  if (!isConfigured()) {
    return res.status(500).json({ success: false, error: 'NAVER_SA_API_KEY / NAVER_SA_SECRET_KEY / NAVER_SA_CUSTOMER_ID 환경변수가 없습니다' })
  }

  const { since, until } = req.query
  if ((since && !DATE_RE.test(since)) || (until && !DATE_RE.test(until))) {
    return res.status(400).json({ success: false, error: 'since / until 은 YYYY-MM-DD 형식' })
  }

  try {
    const plan = await planNaverSync({ since, until })
    const result = await applyPlan(plan)
    const skipped = plan.items.filter(i => i.action === 'skip').length
    console.log(`[sync-naver] ${plan.since}~${plan.until} written=${result.written} skipped=${skipped}`)
    return res.status(200).json({
      success: true,
      since: plan.since,
      until: plan.until,
      written: result.written,
      skipped,
      rows: result.rows,
    })
  } catch (e) {
    console.error('[sync-naver] error:', e)
    return res.status(500).json({ success: false, error: e.message })
  }
}
