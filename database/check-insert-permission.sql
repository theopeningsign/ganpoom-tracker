-- 에이전트 INSERT 권한 확인 및 수정
-- Supabase SQL Editor에서 실행

-- 1. 현재 RLS 정책 확인
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'agents';

-- 2. agents 테이블에 account_number 컬럼이 있는지 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'agents' 
ORDER BY ordinal_position;

-- 3. account_number 컬럼이 없으면 추가
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);

-- 4. 기존 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON agents;
DROP POLICY IF EXISTS "Enable insert for service role only" ON agents;
DROP POLICY IF EXISTS "Enable update for service role only" ON agents;
DROP POLICY IF EXISTS "Enable all for service role" ON agents;

-- 5. service_role로 모든 작업 허용 (INSERT, UPDATE, SELECT, DELETE)
CREATE POLICY "Enable all for service role" ON agents 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 6. 테스트 INSERT 쿼리 (실제로는 실행 안 해도 됨, 확인용)
-- INSERT INTO agents (id, name, phone, account_number, is_active) 
-- VALUES ('TEST01', '테스트', '010-1234-5678', '123456', true);

