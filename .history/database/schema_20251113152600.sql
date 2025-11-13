-- Ganpoom 링크 트래킹 시스템 데이터베이스 스키마
-- Supabase PostgreSQL용

-- 1. 에이전트 테이블
CREATE TABLE agents (
    id VARCHAR(6) PRIMARY KEY, -- 짧은 ID (Ab3kM9)
    name VARCHAR(100) NOT NULL, -- 에이전트 이름
    memo TEXT, -- 메모 (네이버블로그용, 인스타용 등)
    email VARCHAR(255), -- 이메일 (선택사항)
    phone VARCHAR(20), -- 전화번호 (선택사항)
    commission_per_quote INTEGER DEFAULT 10000, -- 견적요청당 커미션 (원)
    is_active BOOLEAN DEFAULT true, -- 활성 상태
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 링크 클릭 로그 테이블
CREATE TABLE link_clicks (
    id BIGSERIAL PRIMARY KEY,
    agent_id VARCHAR(6) REFERENCES agents(id),
    ip_address INET, -- 클릭한 IP
    user_agent TEXT, -- 브라우저 정보
    referrer TEXT, -- 유입 경로
    landing_page TEXT, -- 랜딩 페이지
    session_id VARCHAR(50), -- 세션 ID
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 견적요청 로그 테이블 (ganpoom.com 맞춤)
CREATE TABLE quote_requests (
    id BIGSERIAL PRIMARY KEY,
    agent_id VARCHAR(6) REFERENCES agents(id),
    click_id BIGINT REFERENCES link_clicks(id), -- 연결된 클릭
    
    -- ganpoom.com 견적요청 정보
    svc_type VARCHAR(50),           -- 서비스 타입 (웹드문제작, 간판제작 등)
    req_type VARCHAR(50),           -- 요청 타입 (간단제작, 고급제작 등)
    title VARCHAR(200),             -- 제목/회사명
    area TEXT,                      -- 지역/주소
    phone VARCHAR(20),              -- 전화번호
    floor INTEGER,                  -- 층수
    setup_date VARCHAR(50),         -- 설치 날짜
    deadline VARCHAR(50),           -- 완료 기한
    texture VARCHAR(100),           -- 텍스처/시간
    comments TEXT,                  -- 상세 요청사항
    signs JSONB,                    -- 간판 정보 (JSON)
    wanted_partner VARCHAR(100),    -- 원하는 파트너
    blogo INTEGER DEFAULT 0,        -- 블로그 여부
    destroy INTEGER DEFAULT 0,      -- 철거 여부
    is_direct_call BOOLEAN DEFAULT false, -- 직접 통화 여부
    recv_req_count INTEGER DEFAULT 1,     -- 수신 요청 수
    safe INTEGER DEFAULT 1,         -- 안전 여부
    event_type VARCHAR(50),         -- 이벤트 타입
    need_skb INTEGER DEFAULT 0,     -- SKB 필요 여부
    
    -- 기존 필드들 (호환성)
    customer_name VARCHAR(100),     -- title에서 추출
    customer_phone VARCHAR(20),     -- phone 필드와 동일
    service_type VARCHAR(100),      -- svc_type과 동일
    details TEXT,                   -- comments와 동일
    
    -- 추적 정보
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(50),
    
    -- 비즈니스 정보
    estimated_value DECIMAL(12,2), -- 예상 계약 금액
    commission_amount INTEGER DEFAULT 10000, -- 커미션 금액 (고정 10,000원)
    status VARCHAR(20) DEFAULT 'pending', -- pending, contacted, converted, cancelled
    settlement_month VARCHAR(7), -- 정산 월 (YYYY-MM 형식)
    is_settled BOOLEAN DEFAULT false, -- 정산 완료 여부
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 세션 테이블 (사용자 행동 추적)
CREATE TABLE user_sessions (
    id VARCHAR(50) PRIMARY KEY,
    agent_id VARCHAR(6) REFERENCES agents(id),
    first_click_id BIGINT REFERENCES link_clicks(id),
    
    -- 세션 정보
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20), -- mobile, desktop, tablet
    browser VARCHAR(50),
    os VARCHAR(50),
    
    -- 행동 정보
    page_views INTEGER DEFAULT 0,
    session_duration INTEGER, -- 초 단위
    bounce BOOLEAN DEFAULT false, -- 바운스 여부
    converted BOOLEAN DEFAULT false, -- 전환 여부
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 5. 페이지뷰 로그 테이블
CREATE TABLE page_views (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(50) REFERENCES user_sessions(id),
    agent_id VARCHAR(6) REFERENCES agents(id),
    
    page_url TEXT NOT NULL,
    page_title VARCHAR(255),
    time_on_page INTEGER, -- 초 단위
    scroll_depth INTEGER, -- 스크롤 깊이 (%)
    
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 관리자 사용자 테이블
CREATE TABLE admin_users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin', -- admin, manager, viewer
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_link_clicks_agent_id ON link_clicks(agent_id);
CREATE INDEX idx_link_clicks_clicked_at ON link_clicks(clicked_at);
CREATE INDEX idx_quote_requests_agent_id ON quote_requests(agent_id);
CREATE INDEX idx_quote_requests_created_at ON quote_requests(created_at);
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_user_sessions_agent_id ON user_sessions(agent_id);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at);
CREATE INDEX idx_page_views_session_id ON page_views(session_id);
CREATE INDEX idx_page_views_agent_id ON page_views(agent_id);

-- RLS (Row Level Security) 설정
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- 기본 정책 (모든 사용자가 읽기 가능, 서비스 키로만 쓰기 가능)
CREATE POLICY "Enable read access for all users" ON agents FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role only" ON agents FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable update for service role only" ON agents FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON link_clicks FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role only" ON link_clicks FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON quote_requests FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role only" ON quote_requests FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable update for service role only" ON quote_requests FOR UPDATE USING (auth.role() = 'service_role');

-- 실시간 구독을 위한 Publication 생성
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_requests_updated_at BEFORE UPDATE ON quote_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 (테스트용)
INSERT INTO agents (id, name, memo, commission_per_quote) VALUES
('Ab3kM9', '김철수', '네이버 블로그', 10000),
('Xy7nP2', '이영희', '인스타그램', 10000),
('Qw8rT5', '박민수', '유튜브', 10000),
('Zx4vB1', '최지은', '페이스북', 10000);

-- 관리자 계정 생성 (비밀번호: admin123)
INSERT INTO admin_users (email, password_hash, name, role) VALUES
('admin@ganpoom.com', '$2b$10$rOvHUvJzYzNvQQzv5QzQqOXJYxJYxJYxJYxJYxJYxJYxJYxJYxJYx', '관리자', 'admin');
