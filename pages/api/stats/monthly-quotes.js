/**
 * GET /api/stats/monthly-quotes?year=2026[&platform=all|web|app]
 *
 * 우리(간판의품격) 월별 견적요청 건수.
 * 집계 정의는 대시보드 '전체 견적요청' 카드와 **완전히 동일**하다.
 *   - event_category ∈ QUOTE_EVENTS
 *   - is_staging = false
 *   - is_bot ≠ true  (컬럼 마이그레이션 전 데이터는 null → 사람 취급)
 *   - 월 경계는 KST 기준
 *
 * 행을 끌어오지 않고 count 만 세므로(head:true) 1,000행 페이지네이션 문제가 없다.
 *
 * 트래커는 도중에(2026-04 에어브릿지 종료 무렵) 제대로 붙었다. 그래서
 * TRACKER_RELIABLE_FROM 이전 달은 트래커 수치 대신 MANUAL_QUOTES(엑셀 확정치)를 쓴다.
 * 어느 쪽을 썼는지는 source 로 알려주고, 트래커 원값도 trackerCount 로 함께 넘긴다.
 * (수기값도 없고 트래커도 못 믿는 달은 reliable:false → 화면에서 비교 제외)
 *
 * 응답: { success, year, monthly: [{ month, count, trackerCount, source, reliable }], firstEventAt }
 */
import { supabaseAdmin } from '../../../lib/supabase'
import { QUOTE_EVENTS, TRACKER_RELIABLE_FROM, MANUAL_QUOTES } from '../../../lib/constants'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' })

  const year = parseInt(req.query.year, 10)
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return res.status(400).json({ success: false, error: 'year 파라미터가 올바르지 않습니다' })
  }
  const platform = req.query.platform

  const yearStart = `${year}-01-01T00:00:00+09:00`
  const yearEnd = `${year + 1}-01-01T00:00:00+09:00`

  try {
    // 그 해의 첫 견적요청 이벤트 1건 (부분 집계 월 판정용)
    const firstPromise = (() => {
      let q = supabaseAdmin
        .from('events')
        .select('created_at')
        .in('event_category', QUOTE_EVENTS)
        .eq('is_staging', false)
        .not('is_bot', 'is', true)
        .gte('created_at', yearStart)
        .lt('created_at', yearEnd)
        .order('created_at', { ascending: true })
        .limit(1)
      if (platform && platform !== 'all') q = q.eq('platform', platform)
      return q
    })()

    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const m = i + 1
        // KST 월 경계. 12월의 다음 달은 이듬해 1월.
        const start = `${year}-${String(m).padStart(2, '0')}-01T00:00:00+09:00`
        const end = m === 12
          ? `${year + 1}-01-01T00:00:00+09:00`
          : `${year}-${String(m + 1).padStart(2, '0')}-01T00:00:00+09:00`

        let q = supabaseAdmin
          .from('events')
          .select('*', { count: 'exact', head: true })
          .in('event_category', QUOTE_EVENTS)
          .eq('is_staging', false)
          .not('is_bot', 'is', true)
          .gte('created_at', start)
          .lt('created_at', end)

        if (platform && platform !== 'all') q = q.eq('platform', platform)
        return q
      })
    )

    const monthly = results.map((r, i) => {
      if (r.error) console.error(`monthly-quotes ${year}-${i + 1} error:`, r.error)
      const m = i + 1
      const key = `${year}-${String(m).padStart(2, '0')}`
      const trackerCount = r.count || 0

      const beforeReliable = key < TRACKER_RELIABLE_FROM
      const manual = MANUAL_QUOTES[key]
      const useManual = beforeReliable && Number.isFinite(manual)

      return {
        month: m,
        count: useManual ? manual : trackerCount,
        trackerCount,
        source: useManual ? 'manual' : 'tracker',
        // 트래커가 제대로 돌기 전인데 수기값도 없으면 그 달 숫자는 못 믿는다
        reliable: useManual || !beforeReliable,
      }
    })

    const firstRes = await firstPromise
    if (firstRes.error) console.error('monthly-quotes firstEventAt error:', firstRes.error)
    const firstEventAt = firstRes.data?.[0]?.created_at || null

    return res.status(200).json({ success: true, year, monthly, firstEventAt })
  } catch (e) {
    console.error('monthly-quotes error:', e)
    return res.status(500).json({ success: false, error: e.message })
  }
}
