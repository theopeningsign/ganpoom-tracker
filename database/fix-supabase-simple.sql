-- Step 1: account_number 컬럼 추가
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);

-- Step 2: agents 테이블 정책
DROP POLICY IF EXISTS "Enable read access for all users" ON agents;
DROP POLICY IF EXISTS "Enable insert for service role only" ON agents;
DROP POLICY IF EXISTS "Enable update for service role only" ON agents;
DROP POLICY IF EXISTS "Enable all for service role" ON agents;

CREATE POLICY "Enable all for service role" ON agents 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Step 3: link_clicks 테이블 정책
DROP POLICY IF EXISTS "Enable read access for all users" ON link_clicks;
DROP POLICY IF EXISTS "Enable insert for service role only" ON link_clicks;
DROP POLICY IF EXISTS "Enable all for service role" ON link_clicks;

CREATE POLICY "Enable all for service role" ON link_clicks 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Step 4: quote_requests 테이블 정책
DROP POLICY IF EXISTS "Enable read access for all users" ON quote_requests;
DROP POLICY IF EXISTS "Enable insert for service role only" ON quote_requests;
DROP POLICY IF EXISTS "Enable update for service role only" ON quote_requests;
DROP POLICY IF EXISTS "Enable all for service role" ON quote_requests;

CREATE POLICY "Enable all for service role" ON quote_requests 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Step 5: user_sessions 테이블 정책
DROP POLICY IF EXISTS "Enable all for service role" ON user_sessions;

CREATE POLICY "Enable all for service role" ON user_sessions 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

