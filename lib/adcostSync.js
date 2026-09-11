/**
 * 광고비 자동 입력 — 네이버 (2026-09-11)
 *
 * 규칙 (운영자 확정):
 *  1. 이미 값이 있는 칸(amount > 0)은 절대 덮어쓰지 않는다. 수기 입력이 항상 우선.
 *  2. 빈 칸(행 없음 또는 0)만 네이버 값으로 채운다.
 *  3. 오늘은 하루가 안 끝나 숫자가 미완이므로 제외 — 어제까지만.
 *  4. 기본 조회 범위는 최근 7일: 어느 날 밤 실행이 실패해도 다음 날 알아서 메꿔진다.
 *
 * planNaverSync() 는 계산만 하고(DB 읽기만), applyPlan() 이 실제로 쓴다. 둘을 분리해 둔 이유는
 * 운영 코드 그대로를 저장 없이 검증하기 위함.
 */
import { supabaseAdmin } from './supabase.js'
import { fetchNaverDailyCosts } from './naverAds.js'

const CHANNELS = ['naver_search', 'naver_power']

/** KST 기준 'YYYY-MM-DD' (offsetDays: 0=오늘, -1=어제) */
export function kstDate(offsetDays = 0) {
  return new Date(Date.now() + 9 * 3600 * 1000 + offsetDays * 86400000).toISOString().slice(0, 10)
}

/**
 * 뭘 쓸지 계산만 한다 — DB 쓰기 없음.
 * @returns {Promise<{ since, until, items: Array<{date, channel, existing, value, action:'write'|'skip', reason}> }>}
 */
export async function planNaverSync({ since, until } = {}) {
  const yesterday = kstDate(-1)
  const end = (!until || until > yesterday) ? yesterday : until   // 오늘 이후는 절대 안 씀
  const start = since || kstDate(-7)
  if (start > end) return { since: start, until: end, items: [] }

  const [naver, existingRes] = await Promise.all([
    fetchNaverDailyCosts(start, end),
    supabaseAdmin
      .from('ad_costs')
      .select('date, channel, amount')
      .gte('date', start)
      .lte('date', end)
      .in('channel', CHANNELS),
  ])
  if (existingRes.error) throw new Error('ad_costs 조회 실패: ' + existingRes.error.message)

  const existing = {}
  for (const r of existingRes.data || []) existing[`${r.date}|${r.channel}`] = Number(r.amount) || 0

  const items = []
  for (const date of Object.keys(naver).sort()) {
    for (const ch of CHANNELS) {
      const value = Math.round(naver[date][ch] || 0)
      const cur = existing[`${date}|${ch}`]          // undefined = 행 없음
      let action, reason
      if (cur !== undefined && cur > 0) { action = 'skip'; reason = '이미 값 있음 (수기 우선)' }
      else if (value <= 0)               { action = 'skip'; reason = '네이버 0원' }
      else                                { action = 'write'; reason = cur === undefined ? '행 없음' : '0원 → 채움' }
      items.push({ date, channel: ch, existing: cur === undefined ? null : cur, value, action, reason })
    }
  }
  return { since: start, until: end, items }
}

/** plan 의 write 항목만 upsert 한다. (date, channel) 유일키라 같은 칸은 한 행. */
export async function applyPlan(plan) {
  const rows = plan.items
    .filter(i => i.action === 'write')
    .map(i => ({ date: i.date, channel: i.channel, amount: i.value }))
  if (rows.length === 0) return { written: 0, rows: [] }
  const { error } = await supabaseAdmin.from('ad_costs').upsert(rows, { onConflict: 'date,channel' })
  if (error) throw new Error('ad_costs 저장 실패: ' + error.message)
  return { written: rows.length, rows }
}
