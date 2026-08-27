/**
 * GET /api/direct/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD[&fresh=1]
 *
 * 간판다이렉트(경쟁사) 기간별 접수 건수. 카운트만 반환한다.
 * 이름·상호·지역 같은 세부 정보는 트래커로 넘기지 않는다.
 *
 * 응답:
 *   { success, total, daily:[{date,count}], firstScrapedAt, lastScrapedAt, lastCheckedAt, fromCache, note }
 *
 * lastScrapedAt = 마지막으로 새 건이 들어온 시각 (신규 없으면 안 움직임)
 * lastCheckedAt = 마지막으로 확인한 시각 (스크래핑이 돌 때마다 갱신) ← 화면에 쓰는 값
 */
import { getDirectStats, getLastCheckedAt, isConfigured } from '../../../lib/gpdirect'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { startDate, endDate, fresh } = req.query

  if (!DATE_RE.test(startDate || '') || !DATE_RE.test(endDate || '')) {
    return res.status(400).json({ success: false, error: 'startDate / endDate 는 YYYY-MM-DD 형식이어야 합니다' })
  }
  if (startDate > endDate) {
    return res.status(400).json({ success: false, error: 'startDate 가 endDate 보다 큽니다' })
  }

  if (!isConfigured()) {
    // 토큰 미설정은 장애가 아니라 '아직 안 켬' 상태다. 대시보드가 죽지 않도록 200 으로 알린다.
    return res.status(200).json({
      success: false,
      configured: false,
      error: 'GPDIRECT_GITHUB_TOKEN 환경변수가 없습니다',
    })
  }

  try {
    const isFresh = fresh === '1' || fresh === 'true'
    // 둘은 서로 독립이라 같이 쏜다. lastCheckedAt 이 실패해도 통계는 살아야 하므로
    // getLastCheckedAt 내부에서 예외를 삼키고 null 을 돌려준다.
    const [stats, lastCheckedAt] = await Promise.all([
      getDirectStats(startDate, endDate, { fresh: isFresh }),
      getLastCheckedAt({ fresh: isFresh }),
    ])
    return res.status(200).json({
      success: true,
      configured: true,
      ...stats,
      lastCheckedAt,
      note: '게시판 노출 기준 하한선 · 스크랩시각 기준이라 일 단위는 ±1일 오차',
    })
  } catch (e) {
    console.error('direct/stats error:', e)
    return res.status(500).json({ success: false, configured: true, error: e.message })
  }
}
