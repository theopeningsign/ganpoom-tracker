-- Ganpoom 트래킹 시스템 분석용 쿼리들
-- 실제 배포 시 사용할 SQL 쿼리 예시

-- 1. 에이전트별 일별 실적 조회
SELECT 
    agent_id,
    agents.name as agent_name,
    DATE(created_at) as date,
    COUNT(*) as daily_quotes,
    SUM(commission_amount) as daily_commission
FROM quote_requests 
JOIN agents ON quote_requests.agent_id = agents.id
WHERE created_at >= '2025-11-01' 
  AND created_at < '2025-12-01'
GROUP BY agent_id, agents.name, DATE(created_at)
ORDER BY date DESC, daily_quotes DESC;

-- 결과 예시:
-- agent_id | agent_name | date       | daily_quotes | daily_commission
-- Ab3kM9   | 김철수     | 2025-11-13 | 3           | 30000
-- Ab3kM9   | 김철수     | 2025-11-12 | 2           | 20000
-- Xy7nP2   | 이영희     | 2025-11-13 | 1           | 10000

-- 2. 에이전트별 월별 실적 조회 (최근 6개월)
SELECT 
    agent_id,
    agents.name as agent_name,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as monthly_quotes,
    SUM(commission_amount) as monthly_commission
FROM quote_requests 
JOIN agents ON quote_requests.agent_id = agents.id
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
GROUP BY agent_id, agents.name, DATE_TRUNC('month', created_at)
ORDER BY month DESC, monthly_quotes DESC;

-- 결과 예시:
-- agent_id | agent_name | month      | monthly_quotes | monthly_commission
-- Ab3kM9   | 김철수     | 2025-11-01 | 23            | 230000
-- Ab3kM9   | 김철수     | 2025-10-01 | 18            | 180000
-- Ab3kM9   | 김철수     | 2025-09-01 | 15            | 150000

-- 3. 특정 기간 에이전트별 실적 조회
SELECT 
    agent_id,
    agents.name as agent_name,
    COUNT(*) as total_quotes,
    SUM(commission_amount) as total_commission,
    AVG(estimated_value) as avg_project_value,
    MIN(created_at) as first_quote,
    MAX(created_at) as last_quote
FROM quote_requests 
JOIN agents ON quote_requests.agent_id = agents.id
WHERE created_at BETWEEN '2025-10-01' AND '2025-11-30'
GROUP BY agent_id, agents.name
ORDER BY total_quotes DESC;

-- 4. 일별 전체 통계 (차트용)
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_quotes,
    COUNT(DISTINCT agent_id) as active_agents,
    SUM(commission_amount) as total_commission,
    AVG(estimated_value) as avg_project_value
FROM quote_requests 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 5. 에이전트 개별 상세 통계 (모달용)
SELECT 
    DATE(created_at) as date,
    COUNT(*) as quotes,
    SUM(commission_amount) as commission,
    STRING_AGG(svc_type, ', ') as service_types
FROM quote_requests 
WHERE agent_id = 'Ab3kM9'
  AND created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 6. 시간대별 분석 (언제 견적요청이 많이 들어오는지)
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as quotes_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM quote_requests 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- 7. 서비스 타입별 에이전트 실적
SELECT 
    agent_id,
    agents.name as agent_name,
    svc_type,
    COUNT(*) as quotes,
    SUM(commission_amount) as commission
FROM quote_requests 
JOIN agents ON quote_requests.agent_id = agents.id
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY agent_id, agents.name, svc_type
ORDER BY agent_name, quotes DESC;

