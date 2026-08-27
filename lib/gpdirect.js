/**
 * 간판다이렉트(경쟁사) 접수 현황 데이터 로더
 * ------------------------------------------------------------------
 * 원본: theopeningsign/gpdirect 레포의 월별 CSV (result(YYYY-MM).csv)
 *
 * ⚠️ 이 숫자의 성격을 반드시 알고 쓸 것 (2026-08-27 실사 결과)
 *
 *  1) CSV 의 `일자`·`상태` 컬럼은 1,936행 전부 비어 있다.
 *     사이트에서 실제로 긁히는 건 4개 컬럼뿐이라 접수일자를 알 수 없다.
 *     → 유일한 시간축은 `스크랩시각` = "우리가 처음 발견한 시각".
 *
 *  2) 스크래핑은 4시간 간격인데 GitHub 스케줄러가 최대 3시간까지 밀린다.
 *     특히 KST 23:00 회차는 61%가 자정을 넘겨 실행된다.
 *     실측상 00~02시 스크랩분이 전체의 8.9%(173/1936)이고, 이들은
 *     대부분 '전날 밤 접수분'이다.
 *     → 일 단위 수치는 ±1일 흔들린다. 주/월 단위는 신뢰 가능.
 *
 *  3) 게시판 노출이 약 20건이라, 4시간 안에 20건을 넘으면 조용히 누락된다.
 *     중복 판정 키도 (마스킹된 이름, 업체, 지역, 간판종류) 뿐이라
 *     동일 조합은 1건으로 합쳐진다.
 *     → 이 숫자는 실제 접수량의 **하한선(lower bound)** 이다.
 *
 *  집계 규칙: 스크랩시각은 이미 KST 벽시계 문자열이므로 타임존 변환 없이
 *  앞 10글자(YYYY-MM-DD)를 그대로 날짜 키로 쓴다.
 *  스크래퍼가 `result(스크랩월).csv` 에만 append 하므로
 *  '파일의 월 == 행의 스크랩시각 월' 이 항상 성립한다. 따라서 조회 기간이
 *  걸치는 월의 파일만 읽으면 된다.
 */

const REPO = process.env.GPDIRECT_REPO || 'theopeningsign/gpdirect'
const BRANCH = process.env.GPDIRECT_BRANCH || 'main'
const WORKFLOW = process.env.GPDIRECT_WORKFLOW || 'scrape_ganpan_csv.yml'
const TOKEN = process.env.GPDIRECT_GITHUB_TOKEN

const CACHE_TTL_MS = 60 * 1000

// 월별 캐시: month -> { etag, text, fetchedAt }
// 서버리스라 인스턴스마다 따로 살지만, 웜 인스턴스에서는 잘 먹는다.
const monthCache = new Map()

function ghHeaders(accept = 'application/vnd.github+json') {
  const h = {
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ganpoom-tracker',
  }
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`
  return h
}

export function isConfigured() {
  return Boolean(TOKEN)
}

export { REPO, BRANCH, WORKFLOW }

/** 'YYYY-MM-DD' 두 개를 받아 걸치는 월 목록을 반환 */
export function monthsBetween(startDate, endDate) {
  const out = []
  let [y, m] = startDate.slice(0, 7).split('-').map(Number)
  const [ey, em] = endDate.slice(0, 7).split('-').map(Number)
  // 방어: 역순이면 빈 배열
  if (y > ey || (y === ey && m > em)) return out
  // 방어: 비정상적으로 긴 기간이면 24개월로 자른다
  for (let guard = 0; guard < 24; guard++) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    if (y === ey && m === em) break
    m++
    if (m > 12) { m = 1; y++ }
  }
  return out
}

/**
 * RFC4180 최소 파서.
 * 상호에 콤마가 든 행("휴,OOOO")이 있어 단순 split(',') 은 쓸 수 없다.
 * (워크플로의 awk -F, 는 마지막 필드만 보므로 문제되지 않지만 여기선 전체를 쓴다)
 */
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text // utf-8-sig BOM 제거

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field); field = ''
    } else if (ch === '\n') {
      row.push(field); field = ''
      rows.push(row); row = []
    } else if (ch === '\r') {
      // CRLF 의 CR 은 버린다
    } else {
      field += ch
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''))
}

const TS_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

/** 파싱된 행에서 스크랩시각(항상 마지막 필드)만 뽑아 유효한 것만 남긴다 */
export function extractTimestamps(rows) {
  const out = []
  for (const r of rows) {
    const ts = (r[r.length - 1] || '').trim()
    if (TS_RE.test(ts)) out.push(ts) // 헤더 행과 초기 무타임스탬프 행이 여기서 걸러진다
  }
  return out
}

/** 월별 CSV 원문을 가져온다. ETag 로 조건부 요청해서 레이트리밋을 아낀다. */
async function fetchMonthCsv(month, { fresh = false } = {}) {
  const cached = monthCache.get(month)
  if (!fresh && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { text: cached.text, cached: true }
  }

  const path = encodeURIComponent(`result(${month}).csv`)
  const url = `https://api.github.com/repos/${REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}`
  const headers = ghHeaders('application/vnd.github.raw')
  if (cached?.etag) headers['If-None-Match'] = cached.etag

  const res = await fetch(url, { headers })

  if (res.status === 304 && cached) {
    cached.fetchedAt = Date.now()
    return { text: cached.text, cached: true }
  }
  if (res.status === 404) {
    // 아직 그 달 파일이 없다 (미래 월이거나 데이터 시작 이전 월) → 빈 달로 취급
    monthCache.set(month, { etag: null, text: '', fetchedAt: Date.now() })
    return { text: '', cached: false }
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub ${res.status} (${month}): ${body.slice(0, 200)}`)
  }

  const text = await res.text()
  monthCache.set(month, { etag: res.headers.get('etag'), text, fetchedAt: Date.now() })
  return { text, cached: false }
}

/**
 * 기간별 다이렉트 접수 집계.
 * @returns {{ total:number, daily:Array<{date:string,count:number}>, firstScrapedAt:string|null, lastScrapedAt:string|null, months:string[], fromCache:boolean }}
 */
export async function getDirectStats(startDate, endDate, { fresh = false } = {}) {
  const months = monthsBetween(startDate, endDate)
  if (months.length === 0) {
    return { total: 0, daily: [], firstScrapedAt: null, lastScrapedAt: null, months: [], fromCache: false }
  }

  const results = await Promise.all(months.map(m => fetchMonthCsv(m, { fresh })))
  const fromCache = results.every(r => r.cached)

  const dailyMap = new Map()
  let lastScrapedAt = null  // 기간과 무관하게 '데이터가 어디까지 반영됐는지' 보여주기 위함
  let firstScrapedAt = null // 수집이 언제부터 시작됐는지. 수집 시작 월은 '부분 집계'라 비교에서 빼야 한다.

  for (const { text } of results) {
    if (!text) continue
    for (const ts of extractTimestamps(parseCsv(text))) {
      if (!lastScrapedAt || ts > lastScrapedAt) lastScrapedAt = ts
      if (!firstScrapedAt || ts < firstScrapedAt) firstScrapedAt = ts
      const day = ts.slice(0, 10)
      if (day < startDate || day > endDate) continue
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1)
    }
  }

  const daily = [...dailyMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    total: daily.reduce((s, d) => s + d.count, 0),
    daily,
    firstScrapedAt,
    lastScrapedAt,
    months,
    fromCache,
  }
}

/**
 * 마지막으로 '확인한' 시각 = 스크래핑 워크플로가 마지막으로 성공한 시각.
 *
 * lastScrapedAt(=CSV 마지막 행의 시각)과는 다르다.
 *   lastScrapedAt : 마지막으로 **새 건이 들어온** 시각 → 신규가 없으면 안 움직인다
 *   lastCheckedAt : 마지막으로 **확인한** 시각 → 돌 때마다 갱신된다
 * 사용자가 알고 싶은 건 "몇 시 기준으로 이 숫자가 맞나" 이므로 후자가 맞다.
 *
 * 실패해도 화면이 죽으면 안 되므로 예외는 삼키고 null 을 돌려준다.
 * GitHub API 호출이 한 번 더 붙으므로 60초 캐시를 둔다.
 */
let checkedCache = { at: null, fetchedAt: 0 }
const CHECKED_TTL_MS = 60 * 1000

export async function getLastCheckedAt({ fresh = false } = {}) {
  if (!fresh && checkedCache.at && Date.now() - checkedCache.fetchedAt < CHECKED_TTL_MS) {
    return checkedCache.at
  }
  try {
    const runs = await listWorkflowRuns({ perPage: 10 })
    const done = runs.find(r => r.status === 'completed' && r.conclusion === 'success')
    const at = done?.updated_at || null
    checkedCache = { at, fetchedAt: Date.now() }
    return at
  } catch (e) {
    console.error('getLastCheckedAt error:', e.message)
    return checkedCache.at   // 실패 시 직전 값이라도 (없으면 null)
  }
}

/** 최근 워크플로 실행 목록 (쿨다운 판정·폴링에 함께 쓴다) */
export async function listWorkflowRuns({ perPage = 30, event } = {}) {
  const qs = new URLSearchParams({ per_page: String(perPage) })
  if (event) qs.set('event', event)
  const url = `https://api.github.com/repos/${REPO}/actions/workflows/${encodeURIComponent(WORKFLOW)}/runs?${qs}`
  const res = await fetch(url, { headers: ghHeaders() })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub runs ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json()
  return json.workflow_runs || []
}

/** workflow_dispatch 실행. 성공 시 204 라서 본문이 없다. */
export async function dispatchWorkflow(inputs = {}) {
  const url = `https://api.github.com/repos/${REPO}/actions/workflows/${encodeURIComponent(WORKFLOW)}/dispatches`
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: BRANCH, inputs }),
  })
  if (res.status !== 204) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub dispatch ${res.status}: ${body.slice(0, 300)}`)
  }
}
