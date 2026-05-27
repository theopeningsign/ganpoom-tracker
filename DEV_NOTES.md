# 간품 트래커 개발노트

> **규칙: 수정 후 푸시 전에 반드시 이 파일을 업데이트할 것**

---

## 🎯 프로젝트 탄생 배경 & 최종 목표

### 탄생 배경
에어브릿지(Airbridge) 계약이 종료됨에 따라 독자적인 추적 시스템이 필요해짐.

### 현재 상태
- 에어브릿지 SDK가 `ganpoomreact/public/index.html`에 여전히 탑재되어 있음
- `_gpWrap` 인터셉터가 `window.airbridge.events.send()` 호출을 가로채서 GanpoomTracker로 전달
- 즉, **에어브릿지 SDK가 보내는 신호에 아직 의존 중**

### 최종 목표
간품 사이트 전체에 퍼져있는 에어브릿지 SDK 호출을 전부 GanpoomTracker 직접 호출로 교체.
에어브릿지 SDK를 완전히 제거하고 독자 SDK로 운영.

---

## ⚠️ 절대 원칙 (Claude에게)

| 원칙 | 내용 |
|---|---|
| **수정 가능한 코드** | `ganpoom-tracker-main` 내부 파일만 |
| **절대 건드릴 수 없는 코드** | `ganpoomreact`, `backend-master` 등 서버/앱 관련 코드 |
| **서버 코드 수정이 필요할 때** | md 가이드 파일 작성만 가능 |
| **푸시 전** | 반드시 이 DEV_NOTES.md 업데이트 후 진행 |

---

## 🏗️ 프로젝트 구조

```
ganpoom-tracker-main/
├── public/
│   └── gp.js                        # 클라이언트 SDK (ganpoom.com에 심어지는 스크립트)
├── pages/
│   ├── index.js                     # 대시보드 메인
│   ├── channels.js                  # 채널 분석
│   ├── adcosts.js                   # 광고비 입력
│   └── api/
│       ├── events/
│       │   ├── log.js               # 이벤트 수신 핵심 API ⭐
│       │   ├── stats.js             # 이벤트 통계
│       │   ├── channel-detail.js    # 채널 상세 분석
│       │   ├── category-detail.js   # 카테고리별 상세
│       │   └── export.js            # 데이터 엑셀 내보내기
│       ├── adcosts/
│       │   └── index.js             # 광고비 CRUD
│       ├── contracts/
│       │   ├── data.js              # 계약 데이터 조회
│       │   └── manual.js            # 계약 수기 입력
│       ├── agents/                  # CPA 에이전트 관리
│       ├── settlement/              # 정산 관리
│       ├── stats/                   # 통계 API 모음
│       └── track/                   # 클릭/전환/네이버 추적
├── lib/
│   ├── constants.js                 # QUOTE_EVENTS, SIGNUP_EVENTS 정의
│   └── supabase.js                  # Supabase 클라이언트
├── components/
│   └── PasswordProtection.js        # 비밀번호 보호
└── airbridge.min.js                 # (참고용) 에어브릿지 SDK 로컬 사본
```

### 배포
- **플랫폼:** Vercel
- **DB:** Supabase (`events`, `ad_costs`, `agents`, `settlements` 등)
- **레포:** `theopeningsign/ganpoom-tracker`

---

## 📡 gp.js — 클라이언트 SDK 핵심 동작

`ganpoom.com`에 `<script src=".../gp.js" async>` 로 삽입됨.

### 동작 흐름
1. **Pre-queue 스텁 설정** — async 로딩 전 호출된 이벤트를 버퍼링
2. **채널 어트리뷰션 결정** (`resolveChannel`)
   - `gclid` → `google`
   - `utm_source` → 해당 utm_source 값
   - `k_campaign` / `k_adgroup` → `naver.searchad`
   - `jid` + `cid` 동시 존재 → `tenping_web`
   - `ref` → `agency` (CPA 에이전트)
   - 그 외 → `unattributed`
3. **`gp_attr` 쿠키 저장** — 어트리뷰션 정보 30일 유지
4. **`gp_session` 쿠키 저장** — 세션 ID 1일 유지
5. **`session.start` 이벤트 전송** — 최초 방문 시
6. **`window.GanpoomTracker.track()`** 노출 — 외부에서 호출 가능

### 디바이스/앱 감지
- iOS 앱: User-Agent에 `IOS_KEY:APP` 포함 → `platform: 'app'`
- Android 앱: User-Agent에 `간판의 품격` 포함 → `platform: 'app'`
- 그 외 → `platform: 'web'`

---

## 🔄 이벤트 수신 흐름 (log.js)

클라이언트에서 `/api/events/log`로 POST 요청이 들어오면:

```
1. 이벤트명 정규화 (ganpoomclient., ganpoom., test. 접두사 제거)
2. ALLOWED_EVENTS 필터링 (페이지뷰 등 제외)
3. 중복 방지 체크 (10초 이내 같은 session_id + event_category)
   ├─ req_id 없는 기존 행 있으면 → UPDATE (req_id 기록)
   └─ 완전 중복이면 → skip
4. INSERT
   ├─ 성공 → 완료
   └─ Supabase 트리거가 차단(0행 반환) → fallback UPDATE 시도
5. IP 기반 도시/지역 정보 추가 (ip-api.com)
```

### req_id 처리 (비교견적 전용)
비교견적 요청 시 두 개의 동시 요청이 발생:
- **A** (직접 호출): `GanpoomTracker.track('comparison.request', { req_id: 41462 })`
- **B** (에어브릿지 wrapper): req_id 없이 전송

두 요청 중 하나만 DB에 저장되며, req_id가 있는 값으로 UPDATE되는 로직으로 처리됨.

### Supabase 트리거
`prevent_duplicate_events` — BEFORE INSERT, 2초 이내 동일 session+event 차단.
트리거가 INSERT를 막으면 `.select('id').maybeSingle()` 로 감지 후 fallback UPDATE 수행.

---

## 📊 주요 이벤트 목록

| 이벤트명 | 설명 | req_id |
|---|---|---|
| `session.start` | 방문 시작 | ❌ |
| `comparison.request` | 비교견적 요청 | ✅ |
| `simple.request` | 간편견적 요청 | ✅ |
| `airbridge.ecommerce.order.completed` | 스타일맵 견적 | ✅ |
| `order.complete` | 주문 완료 | ✅ |
| `airbridge.user.signup` | 회원가입 | ❌ |
| `comparison.contract` | 계약 성사 | ❌ |
| `comparison.consult` | 상담 요청 | ❌ |
| `phone.click` | 전화 클릭 | ❌ |
| `commerce.order.*` | 커머스 주문 | ❌ |

> `QUOTE_EVENTS` = 견적요청으로 집계되는 이벤트들 (`lib/constants.js`)

---

## 💸 광고비 (ad_costs 테이블)

| 컬럼 | 설명 |
|---|---|
| `date` | 날짜 (YYYY-MM-DD) |
| `channel` | 채널 키 (`naver_search`, `google`, `tenping` 등) |
| `amount` | 광고비 (원) |

- **텐핑은 VAT 1.1 자동 적용** (channels.js fetchAdCosts 내)
- `ADCOST_TO_CH` 매핑으로 ad_costs 채널 키 → events 채널 키 변환

---

## 🔗 채널 키 매핑

| ad_costs 키 | events 채널 키 | 표시명 |
|---|---|---|
| `naver_search` | `naver.searchad` | N(link) |
| `naver_power` | `naver_powercontents` | N(pwc) |
| `google_app` | `google.adwords` | G(앱) |
| `google` | `google` | 구글광고 |
| `tenping` | `tenping_web` | 텐핑 |

---

## 📝 개발 이력

### 2026-05 — req_id 누락 버그 수정
- **원인:** Supabase `prevent_duplicate_events` BEFORE INSERT 트리거가 req_id 있는 INSERT를 막아버림
- **해결:** INSERT 후 `.select('id').maybeSingle()`로 트리거 차단 감지 → fallback UPDATE
- **추가:** dedup UPDATE 실패 시 fall-through INSERT (기존엔 그냥 skip)

### 2026-05 — 자연유입 채널 referrer 분석
- `channel-detail.js`: `referrer_domain` 집계 추가
- `channels.js`: "유입경로" 탭 추가 (방문수/견적수/전환율 바차트)
- 이벤트 카드에 referrer 전체 URL 클릭 링크 표시

### 2026-05 — 대시보드 채널별 모달
- `index.js`: 채널 클릭 시 channel-detail 모달 오픈
- 이벤트내역 / 캠페인 / 유입경로 / 일별추이 탭

### 2026-05 — 일별추이 차트 개선
- 단일 라인(전체) → 방문자수(파란색) + 견적요청수(주황색) 이중 Y축 분리
- `channel-detail.js` daily 집계를 `{ visits, quotes }` 구조로 변경

### 2026-05 — 채널분석 광고비 총괄 배너
- `channels.js` 상단에 파란 배너로 총 광고비 + 채널별 금액 표시
- 계약현황 초록 배너와 함께 보여 광고비 대비 성과 직관적 비교 가능

### 2026-05 — 유입경로 탭 전체 URL 기반으로 개선
- `channel-detail.js`: referrer_domain → referrer 전체 URL 기반 집계 (글 단위 식별 가능)
- 유입경로 탭 노출 채널 확대: 유료 검색광고(naver.searchad, naver_powercontents, google, google.adwords) 제외한 모든 채널
- naver_blog_official, agency(CPA), tenping_web, instagram_official, unattributed 등 포함
- URL 클릭 시 해당 페이지로 이동, shortReferrer로 길이 자동 축약 표시

---

## 🚧 미완료 / 향후 과제

### 단기
- [ ] 회원가입 트래커 누락 수정
  - `ganpoomreact/SignUp.js`, `common.js`에 `GanpoomTracker.track('airbridge.user.signup')` 직접 호출 추가 필요
  - 가이드: `회원가입-트래커-누락-수정-가이드.md`

### 중기
- [ ] 스타일맵 견적 req_id 연동
  - `backend-master/routes/apis/authApi.js` `style_rfp_estimate` 응답에 `req_id: result.insertId` 추가
  - `ganpoomreact/ConceptModal.js`에 GanpoomTracker 직접 호출 추가
  - 가이드: `스타일맵-견적요청-req_id-트래킹-가이드.md`

### 장기 (최종 목표)
- [ ] 에어브릿지 SDK 완전 제거
  - `ganpoomreact/public/index.html`에서 에어브릿지 SDK script 태그 제거
  - `_gpWrap` 인터셉터 제거
  - `ganpoomreact` 전체에서 `window.airbridge.*` 호출을 `window.GanpoomTracker.*`로 교체
  - `window.airbridge.setUserId()` → `GanpoomTracker.identify()` 메서드 신규 구현 필요

---

## 📁 관련 가이드 파일

| 파일명 | 내용 |
|---|---|
| `회원가입-트래커-누락-수정-가이드.md` | SignUp.js, common.js 수정 가이드 |
| `스타일맵-견적요청-req_id-트래킹-가이드.md` | 스타일맵 req_id 연동 가이드 |
| `ganpoom-android-tracker-연동가이드.md` | Android 앱 트래커 연동 |
