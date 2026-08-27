/**
 * 간판다이렉트 스크래핑 수동 실행 (대시보드 '지금 갱신' 버튼)
 *
 *   POST /api/direct/refresh        → workflow_dispatch 실행
 *   GET  /api/direct/refresh?since= → 그 시각 이후 실행된 런의 상태 폴링
 *
 * ⚠️ gpdirect 는 Private 레포라 Actions 분이 과금된다.
 *    그래서 서버 상태 없이(=서버리스 인스턴스가 갈려도 유효하게) GitHub 의
 *    실행 이력 자체를 근거로 두 겹의 제동을 건다:
 *      1) 진행 중인 런이 있으면 새로 띄우지 않고 그 런을 그대로 물려준다
 *         (동시에 두 런이 push 하면 워크플로의 `git push || true` 때문에
 *          한쪽 회차 데이터가 조용히 사라진다)
 *      2) 수동 실행은 쿨다운 10분 + 하루 12회 상한
 *
 *    또한 inputs.silent=true 로 띄워서 이 버튼 때문에 텔레그램/메일이
 *    울리지 않게 한다 (워크플로 쪽에 silent 입력이 있어야 한다).
 */
import { dispatchWorkflow, listWorkflowRuns, isConfigured, REPO } from '../../../lib/gpdirect'

const COOLDOWN_MS = 10 * 60 * 1000
const DAILY_CAP = 12
const ACTIVE = new Set(['queued', 'in_progress', 'requested', 'waiting', 'pending'])

/** KST 기준 오늘 날짜 문자열 */
function kstToday() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
}
function kstDay(iso) {
  return new Date(new Date(iso).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10)
}

function slim(run) {
  if (!run) return null
  return {
    id: run.id,
    status: run.status,               // queued | in_progress | completed
    conclusion: run.conclusion,       // success | failure | cancelled | ...
    event: run.event,
    createdAt: run.created_at,
    url: run.html_url,
  }
}

export default async function handler(req, res) {
  if (!isConfigured()) {
    return res.status(200).json({ success: false, configured: false, error: 'GPDIRECT_GITHUB_TOKEN 환경변수가 없습니다' })
  }

  try {
    if (req.method === 'GET') {
      const since = req.query.since ? new Date(req.query.since).getTime() : 0
      const runs = await listWorkflowRuns({ perPage: 20 })
      // dispatch 직후에는 런이 아직 목록에 안 뜬다 → 10초 여유를 준다
      const candidates = runs.filter(r => new Date(r.created_at).getTime() >= since - 10_000)
      const active = candidates.find(r => ACTIVE.has(r.status))
      const latest = candidates[0] || null
      return res.status(200).json({
        success: true,
        configured: true,
        run: slim(active || latest),
        pending: candidates.length === 0, // 아직 런이 안 올라옴
      })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    const runs = await listWorkflowRuns({ perPage: 30 })

    // 1) 진행 중인 런이 있으면 그걸 물려준다 (스케줄 회차와의 충돌 방지)
    const running = runs.find(r => ACTIVE.has(r.status))
    if (running) {
      return res.status(200).json({
        success: true, configured: true, reused: true,
        run: slim(running),
        message: '이미 스크래핑이 돌고 있어 그 실행을 기다립니다',
      })
    }

    const manual = runs.filter(r => r.event === 'workflow_dispatch')

    // 2) 쿨다운
    const last = manual[0]
    if (last) {
      const elapsed = Date.now() - new Date(last.created_at).getTime()
      if (elapsed < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - elapsed) / 60000)
        return res.status(429).json({
          success: false, configured: true, cooldown: true, run: slim(last),
          error: `방금 갱신했습니다. ${wait}분 뒤에 다시 눌러주세요`,
        })
      }
    }

    // 3) 하루 상한
    const today = kstToday()
    const todayCount = manual.filter(r => kstDay(r.created_at) === today).length
    if (todayCount >= DAILY_CAP) {
      return res.status(429).json({
        success: false, configured: true, capped: true,
        error: `수동 갱신 하루 한도(${DAILY_CAP}회)를 다 썼습니다. 4시간마다 도는 정기 실행을 기다려주세요`,
      })
    }

    const dispatchedAt = new Date().toISOString()
    await dispatchWorkflow({ silent: 'true' })

    return res.status(200).json({
      success: true, configured: true, reused: false,
      dispatchedAt,
      repo: REPO,
      remainingToday: DAILY_CAP - todayCount - 1,
      message: '스크래핑을 시작했습니다 (보통 2분 내외)',
    })
  } catch (e) {
    console.error('direct/refresh error:', e)
    return res.status(500).json({ success: false, configured: true, error: e.message })
  }
}
