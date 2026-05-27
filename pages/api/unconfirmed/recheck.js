const ADMIN_API = 'https://api.ganpoom.com'

async function adminGet(path) {
  try {
    const res = await fetch(`${ADMIN_API}${path}`, {
      headers: { Cookie: process.env.ADMIN_COOKIE },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const reqIds = (req.query.req_ids || '')
    .split(',')
    .map(Number)
    .filter(Boolean)

  if (reqIds.length === 0)
    return res.status(400).json({ success: false, error: 'req_ids 필요' })

  const BATCH_SIZE = 10
  const results = {}

  for (let i = 0; i < reqIds.length; i += BATCH_SIZE) {
    const batch = reqIds.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (reqId) => {
        const detail = await adminGet(`/web/admin/detail_matched?req_id=${reqId}`)

        if (!detail || detail.res !== 0) {
          // API가 응답 없거나 res !== 0 → 견적 삭제됨 or 접근 불가
          results[reqId] = 'deleted'
        } else if (detail.ests?.some((e) => e.status >= 3)) {
          // 계약 진행중 이상
          results[reqId] = 'contracted'
        } else {
          results[reqId] = 'active'
        }
      })
    )
  }

  return res.status(200).json({ success: true, results })
}
