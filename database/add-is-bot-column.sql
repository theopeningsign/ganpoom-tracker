-- ============================================================
-- 봇 플래그 컬럼 추가 (2026-08-03)
-- 목적: 구글봇 등 크롤러 이벤트를 삭제하지 않고 is_bot=true로 표시,
--       대시보드 집계에서 사람/봇을 분리한다.
-- 실행: Supabase 대시보드 → SQL Editor 에 전체 붙여넣고 Run (1회만)
-- 순서: 이 SQL을 먼저 실행한 뒤 트래커(Vercel)를 배포하는 것을 권장.
--       (코드에 컬럼 미존재 시 자동 재시도 안전장치가 있어 순서가 바뀌어도
--        이벤트 유실은 없지만, 그동안 봇 플래그가 저장되지 않음)
-- ============================================================

-- 1) 컬럼 추가 (기존 행은 전부 false로 초기화됨)
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;

-- 2) 봇 행 조회용 부분 인덱스 (봇 행만 인덱싱 → 가볍고 빠름)
CREATE INDEX IF NOT EXISTS idx_events_is_bot ON events (created_at) WHERE is_bot = true;

-- 3) 과거 데이터 소급 플래그
--    구글 크롤러 공식 대역(66.249.0.0/16) — 이번 California/Mountain View 급증분 전부 해당
UPDATE events SET is_bot = true
WHERE is_bot = false
  AND client_ip LIKE '66.249.%';

--    빙 크롤러 대역 (있다면 함께 정리)
UPDATE events SET is_bot = true
WHERE is_bot = false
  AND (client_ip LIKE '157.55.%' OR client_ip LIKE '207.46.%' OR client_ip LIKE '40.77.%');

-- 4) 확인용: 봇/사람 분리 집계
SELECT is_bot, count(*) AS events, count(*) FILTER (WHERE event_category = 'session.start') AS sessions
FROM events
GROUP BY is_bot;
