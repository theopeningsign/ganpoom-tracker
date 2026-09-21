/**
 * 광고비 자동 입력 — 네이버 (2026-09-11) · 구글 (2026-09-21)
 *
 * 규칙 (운영자 확정):
 *  1. 이미 값이 있는 칸(amount > 0)은 절대 덮어쓰지 않는다. 수기 입력이 항상 우선.
 *  2. 빈 칸(행 없음 또는 0)만 자동 값으로 채운다.
 *  3. 오늘은 하루가 안 끝나 숫자가 미완이므로 제외 — 어제까지만.
 *  4. 기본 조회 범위는 최근 7일: 어느 날 밤 실행이 실패해도 다음 날 알아서 메꿔진다.
 *
 * plan*() 은 계산만 하고(DB 읽기만), applyPlan() 이 실제로 쓴다. 둘을 분리해 둔 이유는
 * 운영 코드 그대로를 저장 없이 검증하기 위함.
 *
 * 네이버는 트래커가 API 로 "가져오고"(planNaverSync), 구글은 구글 광고 스크립트가 값을 "밀어넣는다"(planGoogleSync).
 * 두 경우 모두 같은 planFill() 규칙을 탄다.
 */
import { supabaseAdmin } from './supabase.js'
import { fetchNaverDailyCosts } from './naverAds.js'

const NAVER_CHANNELS = ['naver_search', 'naver_power']
export const GOOGLE_CHANNELS = ['google', 'google_app']

/** KST 기준 'YYYY-MM-DD' (offsetDays: 0=오늘, -1=어제) */
export function kstDate(offsetDays = 0) {
  return new Date(Date.now() + 9 * 3600 * 1000 + offsetDays * 86400000).toISOString().slice(0, 10)
}

/** 요청 범위를 [since, until] 로 정리 — until 은 어제를 넘길 수 없음 */
function clampRange({ since, until } = {}) {
  const yesterday = kstDate(-1)
  const end = (!until || until > yesterday) ? yesterday : until   // 오늘 이후는 절대 안 씀
  const start = since || kstDate(-7)
  return { start, end }
}

/**
 * 공통 규칙: values(날짜→채널→금액) 를 기존 ad_costs 와 대조해 write/skip 항목을 만든다. DB 쓰기 없음.
 * @param {{ values: Record<string, Record<string, number>>, channels: string[], start: string, end: string, sourceLabel: string }} p
 */
async function planFill({ values, channels, start, end, sourceLabel }) {
  const existingRes = await supabaseAdmin
    .from('ad_costs')
    .select('date, channel, amount')
    .gte('date', start)
    .lte('date', end)
    .in('channel', channels)
  if (existingRes.error) throw new Error('ad_costs 조회 실패: ' + existingRes.error.message)

  const existing = {}
  for (const r of existingRes.data || []) existing[`${r.date}|${r.channel}`] = Number(r.amount) || 0

  const items = []
  for (const date of Object.keys(values).sort()) {
    if (date < start || date > end) continue                 // 범위 밖(오늘 포함)은 무시
    for (const ch of channels) {
      const value = Math.round(values[date][ch] || 0)
      const cur = existing[`${date}|${ch}`]                  // undefined = 행 없음
      let action, reason
      if (cur !== undefined && cur > 0) { action = 'skip'; reason = '이미 값 있음 (수기 우선)' }
      else if (value <= 0)               { action = 'skip'; reason = `${sourceLabel} 0원` }
      else                                { action = 'write'; reason = cur === undefined ? '행 없음' : '0원 → 채움' }
      items.push({ date, channel: ch, existing: cur === undefined ? null : cur, value, action, reason })
    }
  }
  return { since: start, until: end, items }
}

/**
 * 네이버: 검색광고 API 에서 직접 가져와 계산만 한다 — DB 쓰기 없음.
 * @returns {Promise<{ since, until, items: Array<{date, channel, existing, value, action:'write'|'skip', reason}> }>}
 */
export async function planNaverSync({ since, until } = {}) {
  const { start, end } = clampRange({ since, until })
  if (start > end) return { since: start, until: end, items: [] }
  const naver = await fetchNaverDailyCosts(start, end)
  return planFill({ values: naver, channels: NAVER_CHANNELS, start, end, sourceLabel: '네이버' })
}

/**
 * 구글: 구글 광고 스크립트가 보낸 rows 를 계산만 한다 — DB 쓰기 없음.
 * rows: [{ date:'YYYY-MM-DD', type:'SEARCH'|'MULTI_CHANNEL'|…, cost:원 }]  (같은 날짜·유형이 여러 행이면 합산)
 * 유형 매핑(2026-09-21 수기값 10일치 20칸 전부 일치로 확정): SEARCH→google, MULTI_CHANNEL→google_app. 그 외 유형은 무시하고 ignoredTypes 로 알려줌.
 */
export const GOOGLE_TYPE_TO_CHANNEL = { SEARCH: 'google', MULTI_CHANNEL: 'google_app' }

export async function planGoogleSync(rows, { since, until } = {}) {
  const values = {}
  const ignoredTypes = new Set()
  let minDate = null, maxDate = null
  for (const r of rows) {
    const ch = GOOGLE_TYPE_TO_CHANNEL[r.type]
    if (!ch) { ignoredTypes.add(r.type); continue }
    if (!values[r.date]) values[r.date] = {}
    values[r.date][ch] = (values[r.date][ch] || 0) + Number(r.cost)
    if (!minDate || r.date < minDate) minDate = r.date
    if (!maxDate || r.date > maxDate) maxDate = r.date
  }
  // 범위: 명시값 > 보낸 데이터의 날짜 범위 > 기본(7일 전~어제)
  const { start, end } = clampRange({ since: since || minDate || undefined, until: until || maxDate || undefined })
  if (start > end) return { since: start, until: end, items: [], ignoredTypes: [...ignoredTypes] }
  const plan = await planFill({ values, channels: GOOGLE_CHANNELS, start, end, sourceLabel: '구글' })
  return { ...plan, ignoredTypes: [...ignoredTypes] }
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
