-- ============================================================
-- Ganpoom Tracker v2 - 에어브릿지 대체 이벤트 스키마
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,

    -- 이벤트 분류
    event_category VARCHAR(100) NOT NULL,  -- comparison.request, order.complete, simple.request, home.screen 등
    platform VARCHAR(10) DEFAULT 'web',    -- web | app (앱은 추후 추가)

    -- 기기 정보
    device_type VARCHAR(20),               -- desktop | mobile | tablet
    os_name VARCHAR(50),                   -- iOS, Android, Windows, macOS 등

    -- 채널 어트리뷰션 (핵심)
    channel VARCHAR(100),                  -- naver.searchad, google, tenping_web, agency, naver_blog_official, unattributed 등
    channel_type VARCHAR(20),              -- paid | organic | cpa
    campaign VARCHAR(255),                 -- 캠페인 ID 또는 명칭
    ad_group VARCHAR(255),                 -- 광고그룹
    ad_creative VARCHAR(255),              -- 소재

    -- UTM 파라미터 (공통)
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),

    -- 네이버 전용 파라미터
    k_campaign VARCHAR(255),
    k_adgroup VARCHAR(255),
    k_creative VARCHAR(255),
    k_keyword VARCHAR(255),
    k_keyword_id VARCHAR(255),

    -- 구글 전용
    gclid VARCHAR(255),

    -- CPA 에이전트 연결 (선택)
    agent_id VARCHAR(20),

    -- 유입 정보
    referrer TEXT,
    referrer_domain VARCHAR(255),
    landing_page TEXT,

    -- 지역 (IP 기반)
    client_ip_city VARCHAR(100),
    client_ip_subdivision VARCHAR(100),

    -- 세션
    session_id VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_channel ON events(channel);
CREATE INDEX IF NOT EXISTS idx_events_event_category ON events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_platform ON events(platform);
CREATE INDEX IF NOT EXISTS idx_events_agent_id ON events(agent_id);
CREATE INDEX IF NOT EXISTS idx_events_channel_date ON events(channel, created_at);

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all" ON events FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role" ON events FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 채널 매핑 테이블 (에어브릿지 channel값 → 한국어 명칭)
-- ============================================================
CREATE TABLE IF NOT EXISTS channel_map (
    channel_key VARCHAR(100) PRIMARY KEY,
    channel_name VARCHAR(100) NOT NULL,   -- 한국어 표시명
    channel_type VARCHAR(20) NOT NULL,    -- paid | organic | cpa
    sort_order INTEGER DEFAULT 99
);

INSERT INTO channel_map (channel_key, channel_name, channel_type, sort_order) VALUES
    ('naver.searchad',      '네이버 검색광고',   'paid',    1),
    ('google',              '구글 광고',          'paid',    2),
    ('tenping_web',         '텐핑',               'paid',    3),
    ('agency',              'CPA 에이전시',        'cpa',     4),
    ('naver_blog_official', '네이버 블로그',       'organic', 5),
    ('instagram_official',  '인스타그램',          'organic', 6),
    ('unattributed',        '자연유입',            'organic', 7)
ON CONFLICT (channel_key) DO NOTHING;

ALTER TABLE channel_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all" ON channel_map FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role" ON channel_map FOR INSERT WITH CHECK (auth.role() = 'service_role');
