-- referrer_domain 컬럼 추가 마이그레이션
-- 기존 link_clicks 테이블에 referrer_domain 컬럼 추가

ALTER TABLE link_clicks 
ADD COLUMN IF NOT EXISTS referrer_domain VARCHAR(255);

-- 인덱스 추가 (도메인별 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_link_clicks_referrer_domain ON link_clicks(referrer_domain);

-- 기존 데이터 업데이트 (선택사항 - 기존 referrer URL에서 도메인 추출)
-- 참고: 이 쿼리는 기존 데이터의 referrer URL을 파싱해서 도메인을 추출합니다
-- UPDATE link_clicks 
-- SET referrer_domain = 
--   CASE 
--     WHEN referrer IS NULL OR referrer = '' THEN NULL
--     ELSE regexp_replace(
--       regexp_replace(referrer, '^https?://', ''), 
--       '/.*$', ''
--     )
--   END
-- WHERE referrer_domain IS NULL;

