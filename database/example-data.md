# 데이터베이스 저장 예시

## 시나리오: 사용자가 추적 링크로 접속해서 견적요청

### 1단계: 추적 링크 클릭 (link_clicks 테이블)

**사용자 행동:**
```
사용자가 클릭: ganpoom.com/?ref=Ab3kM9
```

**저장되는 데이터 (link_clicks 테이블):**
```sql
INSERT INTO link_clicks (
  agent_id,           -- 'Ab3kM9'
  ip_address,         -- '123.456.789.0'
  user_agent,         -- 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...'
  referrer,           -- 'https://www.naver.com' (유입 경로)
  landing_page,       -- 'https://www.ganpoom.com/?ref=Ab3kM9'
  session_id,         -- 'gp_1731234567890_abc123'
  clicked_at          -- '2025-11-14 12:00:00+00'
);
```

**실제 저장 예시:**
```
id: 1
agent_id: 'Ab3kM9'
ip_address: '123.456.789.0'
user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
referrer: 'https://www.naver.com'
landing_page: 'https://www.ganpoom.com/?ref=Ab3kM9'
session_id: 'gp_1731234567890_abc123'
clicked_at: '2025-11-14 12:00:00+00'
```

---

### 2단계: 견적요청 폼 제출 (quote_requests 테이블)

**사용자 행동:**
```
사용자가 견적요청 폼 작성:
- 서비스 타입: "웹드문제작"
- 제목: "홍길동"
- 전화번호: "010-1234-5678"
- 지역: "서울시 강남구"
- 층수: 3
- 상세내용: "간판 제작 요청합니다"
...
폼 제출 버튼 클릭
```

**저장되는 데이터 (quote_requests 테이블):**
```sql
INSERT INTO quote_requests (
  agent_id,           -- 'Ab3kM9' (쿠키에서 읽어온 값)
  click_id,           -- 1 (1단계에서 저장된 클릭 ID)
  
  -- ganpoom.com 폼 필드들
  svc_type,           -- '웹드문제작'
  req_type,           -- '간단제작' (또는 null)
  title,              -- '홍길동'
  area,               -- '서울시 강남구'
  phone,              -- '010-1234-5678'
  floor,              -- 3
  setup_date,         -- '2025-12-01' (또는 null)
  deadline,           -- '2025-12-15' (또는 null)
  texture,            -- '실크' (또는 null)
  comments,           -- '간판 제작 요청합니다'
  signs,              -- '{"type":"간판","size":"3x2"}' (JSON 또는 null)
  wanted_partner,     -- '특정 파트너' (또는 null)
  blogo,              -- 0
  destroy,            -- 0
  is_direct_call,     -- false
  recv_req_count,     -- 1
  safe,               -- 1
  event_type,         -- null
  need_skb,           -- 0
  
  -- 호환성 필드들 (중복)
  customer_name,      -- '홍길동' (title과 동일)
  customer_phone,     -- '010-1234-5678' (phone과 동일)
  service_type,       -- '웹드문제작' (svc_type과 동일)
  details,            -- '간판 제작 요청합니다' (comments와 동일)
  
  -- 추적 정보
  ip_address,         -- '123.456.789.0'
  user_agent,         -- 'Mozilla/5.0...'
  session_id,         -- 'gp_1731234567890_abc123'
  
  -- 비즈니스 정보
  estimated_value,    -- null (계산 안 함)
  commission_amount,  -- null (정산 시 수동 처리)
  status,             -- 'pending'
  settlement_month,   -- null
  is_settled,         -- false
  
  created_at,         -- '2025-11-14 12:05:00+00'
  updated_at          -- '2025-11-14 12:05:00+00'
);
```

**실제 저장 예시:**
```
id: 1
agent_id: 'Ab3kM9'
click_id: 1

-- ganpoom.com 폼 데이터
svc_type: '웹드문제작'
req_type: null
title: '홍길동'
area: '서울시 강남구'
phone: '010-1234-5678'
floor: 3
setup_date: '2025-12-01'
deadline: '2025-12-15'
texture: null
comments: '간판 제작 요청합니다'
signs: null
wanted_partner: null
blogo: 0
destroy: 0
is_direct_call: false
recv_req_count: 1
safe: 1
event_type: null
need_skb: 0

-- 호환성 필드
customer_name: '홍길동'
customer_phone: '010-1234-5678'
service_type: '웹드문제작'
details: '간판 제작 요청합니다'

-- 추적 정보
ip_address: '123.456.789.0'
user_agent: 'Mozilla/5.0...'
session_id: 'gp_1731234567890_abc123'

-- 비즈니스 정보
estimated_value: null
commission_amount: null
status: 'pending'
settlement_month: null
is_settled: false

created_at: '2025-11-14 12:05:00+00'
updated_at: '2025-11-14 12:05:00+00'
```

---

### 3단계: 정산 시 (commission_amount 업데이트)

**정산 관리 페이지에서:**
```
에이전트 Ab3kM9의 11월 정산
- 단가 조정: 10,000원 → 15,000원
- "조정" 버튼 클릭
```

**업데이트되는 데이터:**
```sql
UPDATE quote_requests
SET 
  commission_amount = 15000,  -- 단가 조정된 금액
  updated_at = NOW()
WHERE 
  agent_id = 'Ab3kM9'
  AND created_at >= '2025-11-01 00:00:00'
  AND created_at <= '2025-11-30 23:59:59'
  AND is_settled = false;
```

**정산 완료 시:**
```sql
UPDATE quote_requests
SET 
  is_settled = true,
  settlement_month = '2025-11',
  updated_at = NOW()
WHERE 
  agent_id = 'Ab3kM9'
  AND created_at >= '2025-11-01 00:00:00'
  AND created_at <= '2025-11-30 23:59:59';
```

---

## 최종 저장된 데이터 예시

### link_clicks 테이블
| id | agent_id | clicked_at | session_id |
|----|----------|------------|------------|
| 1  | Ab3kM9   | 2025-11-14 12:00:00 | gp_1731234567890_abc123 |

### quote_requests 테이블
| id | agent_id | click_id | title | phone | commission_amount | status | is_settled | created_at |
|----|----------|----------|-------|-------|-------------------|--------|------------|------------|
| 1  | Ab3kM9   | 1        | 홍길동 | 010-1234-5678 | null → 15000 | pending → settled | false → true | 2025-11-14 12:05:00 |

---

## 데이터 흐름 요약

```
1. 링크 클릭
   → link_clicks 테이블에 저장 (클릭 로그)

2. 견적요청 폼 제출
   → quote_requests 테이블에 저장
   - agent_id: 쿠키에서 읽어온 값
   - click_id: 1단계에서 저장된 클릭 ID (연결!)
   - 폼 데이터: ganpoom.com 폼 필드들
   - commission_amount: null (정산 전)

3. 정산 시
   → commission_amount 업데이트 (10,000원 또는 조정된 금액)
   → is_settled = true
   → settlement_month = '2025-11'
```

