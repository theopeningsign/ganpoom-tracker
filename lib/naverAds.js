/**
 * 네이버 검색광고 API 클라이언트 — 통계 조회 전용 (광고 설정은 절대 건드리지 않음)
 *
 * 2026-09-11 실물 검증 결과 (추측 아님):
 *  - 서명: base64(HMAC-SHA256(비밀키, "타임스탬프(ms).METHOD.경로")) — 공식 Python 샘플과 동일
 *  - 일별 조회는 id(단수) + timeIncrement=1 만 지원. ids(복수)+일별은 400(11001)
 *  - campaignTp: WEB_SITE = 파워링크(사이트 검색광고) → naver_search
 *                POWER_CONTENTS = 파워컨텐츠(콘텐츠 검색광고) → naver_power
 *                BRAND_SEARCH = 브랜드검색(정액, 일별 0) → 집계 제외
 *  - salesAmt 는 광고주센터 '상품별 광고비'와 같은 기준(부가세 포함). 캠페인 합산 시 ±2원 반올림 차이 있음
 */
import { createHmac } from 'node:crypto'

const BASE = 'https://api.searchad.naver.com'
export const CHANNEL_BY_TP = { WEB_SITE: 'naver_search', POWER_CONTENTS: 'naver_power' }

export function isConfigured() {
  return Boolean(process.env.NAVER_SA_API_KEY && process.env.NAVER_SA_SECRET_KEY && process.env.NAVER_SA_CUSTOMER_ID)
}

function headers(method, path) {
  const apiKey = process.env.NAVER_SA_API_KEY
  const secret = process.env.NAVER_SA_SECRET_KEY
  const customer = process.env.NAVER_SA_CUSTOMER_ID
  if (!apiKey || !secret || !customer) {
    throw new Error('NAVER_SA_API_KEY / NAVER_SA_SECRET_KEY / NAVER_SA_CUSTOMER_ID 환경변수가 필요합니다')
  }
  const ts = String(Date.now())
  const sig = createHmac('sha256', secret).update(`${ts}.${method}.${path}`).digest('base64')
  return {
    'X-Timestamp': ts,
    'X-API-KEY': apiKey,
    'X-Customer': customer,
    'X-Signature': sig,
    'Content-Type': 'application/json',
  }
}

async function get(path, query = {}) {
  const qs = new URLSearchParams(query).toString()
  const res = await fetch(`${BASE}${path}${qs ? '?' + qs : ''}`, {
    headers: headers('GET', path),
    signal: AbortSignal.timeout(15000),
  })
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }
  if (!res.ok) {
    const detail = typeof body === 'string' ? body : JSON.stringify(body)
    throw new Error(`Naver API ${res.status} ${path}: ${detail.slice(0, 200)}`)
  }
  return body
}

/** 캠페인 목록 (nccCampaignId, name, campaignTp …) */
export async function listCampaigns() {
  const body = await get('/ncc/campaigns')
  return Array.isArray(body) ? body : []
}

/**
 * 기간 내 일별 광고비를 채널 키(naver_search / naver_power)로 집계한다.
 * 캠페인 하나당 호출 1회 (일별은 단수 id 만 지원).
 * @param {string} since 'YYYY-MM-DD'
 * @param {string} until 'YYYY-MM-DD'
 * @returns {Promise<{ [date: string]: { naver_search: number, naver_power: number } }>}
 */
export async function fetchNaverDailyCosts(since, until) {
  const campaigns = (await listCampaigns()).filter(c => CHANNEL_BY_TP[c.campaignTp])
  const fields = JSON.stringify(['salesAmt'])
  const timeRange = JSON.stringify({ since, until })
  const daily = {}

  for (const c of campaigns) {
    const body = await get('/stats', { id: c.nccCampaignId, fields, timeRange, timeIncrement: '1' })
    const ch = CHANNEL_BY_TP[c.campaignTp]
    for (const row of (body.data || [])) {
      const date = String(row.dateStart || '').slice(0, 10)
      if (!date) continue
      if (!daily[date]) daily[date] = { naver_search: 0, naver_power: 0 }
      daily[date][ch] += Number(row.salesAmt) || 0
    }
  }
  return daily
}
