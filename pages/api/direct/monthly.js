/**
 * GET /api/direct/monthly?year=2026[&fresh=1]
 *
 * 간판다이렉트(경쟁사) 월별 접수 건수. 카운트만 반환한다.
 * (이름·상호·지역은 트래커로 가져오지 않는다 — lib/gpdirect.js 주석 참고)
 *
 * ⚠️ 스크랩시각 기준이라 일 단위는 ±1일 흔들리지만, 이 API는 월 단위라
 *    영향은 월 경계의 심야 스크랩분 정도로 제한된다.
 *
 * 응답: { success, year, monthly:[{month,count}], lastScrapedAt }
 */
import { getDirectStats, isConfigured } from '../../../lib/gpdirect'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' })

  const year = parseInt(req.query.year, 10)
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return res.status(400).json({ success: false, error: 'year 파라미터가 올바르지 않습니다' })
  }

  if (!isConfigured()) {
    return res.status(200).json({ success: false, configured: false, error: 'GPDIRECT_GITHUB_TOKEN 환경변수가 없습니다' })
  }

  try {
    const stats = await getDirectStats(`${year}-01-01`, `${year}-12-31`, {
      fresh: req.query.fresh === '1' || req.query.fresh === 'true',
    })

    const buckets = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }))
    for (const d of stats.daily) {
      const m = parseInt(d.date.slice(5, 7), 10)
      if (m >= 1 && m <= 12) buckets[m - 1].count += d.count
    }

    return res.status(200).json({
      success: true,
      configured: true,
      year,
      monthly: buckets,
      firstScrapedAt: stats.firstScrapedAt,
      lastScrapedAt: stats.lastScrapedAt,
    })
  } catch (e) {
    console.error('direct/monthly error:', e)
    return res.status(500).json({ success: false, configured: true, error: e.message })
  }
}
