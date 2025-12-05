-- 중복 체크 성능 향상을 위한 인덱스 추가
-- 견적요청 중복 체크 쿼리 최적화

-- 1. 세션 기반 중복 체크용 인덱스
-- 쿼리: WHERE agent_id = ? AND session_id = ? AND created_at > ?
CREATE INDEX IF NOT EXISTS idx_quote_requests_session_time 
ON quote_requests(agent_id, session_id, created_at DESC);

-- 2. 전화번호 기반 중복 체크용 인덱스
-- 쿼리: WHERE agent_id = ? AND customer_phone = ? AND created_at > ?
-- NULL 값은 인덱스에서 제외 (WHERE 조건 추가)
CREATE INDEX IF NOT EXISTS idx_quote_requests_phone_time 
ON quote_requests(agent_id, customer_phone, created_at DESC)
WHERE customer_phone IS NOT NULL;

-- 3. Attribution용 인덱스 (최근 클릭 찾기)
-- 쿼리: WHERE agent_id = ? AND session_id = ? ORDER BY clicked_at DESC
CREATE INDEX IF NOT EXISTS idx_link_clicks_attribution 
ON link_clicks(agent_id, session_id, clicked_at DESC);



