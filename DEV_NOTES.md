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

### 2026-09-11 — 네이버 광고비 자동 입력 (검색광고 API → ad_costs) ⭐
- **목적:** 매일 광고주센터 보고 손으로 넣던 네이버 검색광고·파워컨텐츠 광고비를 자동 기입.
- **범위:** 네이버만. 구글은 개발자 토큰 승인 필요(다음 단계), 텐핑은 API 유무 미확인(수기 유지). 수기 입력 페이지는 그대로 유지(비상용).
- **규칙 (운영자 확정):** ① 이미 값 있는 칸(amount>0)은 **절대 덮어쓰지 않음** ② 빈 칸(행 없음 또는 0)만 채움 ③ 오늘 제외, 어제까지 ④ 최근 7일 훑음(어느 밤 실패해도 다음 날 자가치유).
- **추가 파일:**
  - `lib/naverAds.js` — 네이버 SA API 클라이언트(통계 조회 전용). 서명 = base64(HMAC-SHA256(비밀키, "ts(ms).METHOD.경로")), 공식 Python 샘플과 동일 확인.
  - `lib/adcostSync.js` — `planNaverSync()`(계산만, DB 읽기만) / `applyPlan()`(저장). 분리해 둔 덕에 운영 코드를 저장 없이 검증 가능.
  - `pages/api/adcosts/sync-naver.js` — GET. `Authorization: Bearer <CRON_SECRET>`(Vercel Cron 자동 첨부) 또는 `?key=<CRON_SECRET>`(수동) 없으면 401. `maxDuration: 60`.
  - `vercel.json` — cron `0 21 * * *` (= 06:00 KST, 하루 1회 → Hobby 플랜 허용, 정밀도 ±59분).
- **환경변수 (Vercel 등록 필요):** `NAVER_SA_CUSTOMER_ID`, `NAVER_SA_API_KEY`, `NAVER_SA_SECRET_KEY`, `CRON_SECRET`. 미설정 시 route 가 500 반환하고 아무것도 안 씀(안전).
- **실물 검증 (2026-09-11):**
  - API 값 vs 수기값 9/1~9/6 × 2채널 = 12칸 전부 비율 1.000 (±2원). 부가세 ×1.1 **불필요** — API가 콘솔 '상품별 광고비'와 같은 기준.
  - 1단계(계산만): 9/1~9/6 전부 건너뜀, 9/7(0원 행)~9/10(행 없음) 8칸 쓰기 예정으로 정확 판정, 오늘 제외.
  - 2단계(실제 저장): 8행 저장 → DB 재조회 일치 → 재실행 시 쓸 것 0건(중복 방지 실증).
- **네이버 API 사실 (실측, 추측 아님):** 일별은 `id`(단수)+`timeIncrement=1`만 지원, `ids`(복수)+일별은 400(11001). `campaignTp`: `WEB_SITE`=파워링크→`naver_search`, `POWER_CONTENTS`=파워컨텐츠→`naver_power`, `BRAND_SEARCH`=브랜드검색(일별 0, 제외). 응답 날짜 필드 `dateStart`.
- **±1~2원 차이의 정체 (검증됨):** 네이버가 내부 소수점 원을 단위별로 따로 반올림. 콘솔 자체도 일 총액≠상품별 합(09-02: 96,484 vs 96,483). API로는 반올림 전 값을 못 받으므로 캠페인 합산 시 ±2원은 구조적 한계. 분석 영향 없음.
- 사이드이펙트: 다른 채널 칸(구글·텐핑) 무영향, 기존 값 무영향, 앱웹뷰·봇SSR·간판의품격 RDS 무관(트래커 Supabase 만). 롤백: 채운 행 삭제 + vercel.json 크론 제거.
- ⚠️ 별건: `/api/adcosts` POST(수기 저장)는 여전히 무인증·CORS `*`. 자동화와 별개로 잠금 필요(남은 일).

### 2026-09-11 — 채널분석 견적요청 총괄 배너에 채널별 증감 배지 추가
- **증상:** 기간 비교 모드에서 광고비 총괄(파란 배너)은 채널별 금액마다 증감(▲/▼)이 붙는데, 견적요청 총괄(주황 배너)의 채널별 건수(N(link) 64건 등)에는 증감이 없었음. 정작 아래 채널 카드에는 같은 숫자에 증감이 붙어 짝이 안 맞았음.
- **원인:** 단순 누락. 기간 비교 도입(`c4eb678`) 때 `DeltaBadge`를 총 견적요청·총 방문·광고비 총액·광고비 채널별·채널 카드 5곳에 붙였는데 주황 배너의 채널별 반복문(`channelQuotes.map`)만 빠짐. 설계 의도 아님.
- **수정:** `pages/channels.js` 견적요청 총괄의 `channelQuotes.map` 안에서 `compareData.channelStats`로 비교기간 채널별 건수를 찾아 `DeltaBadge` 1줄 추가. 조회 방식은 아래 채널 카드(`cmpCh`)와, 배지 형태는 광고비 배너 채널별 칸과 동일 — 새 데이터 조회·API 변경 없음.
- 사이드이펙트: 없음 (이미 받아둔 `compareData` 재사용, 비교 모드 아닐 땐 `cmpCh=null`이라 기존과 동일 렌더). 롤백: 커밋 되돌리기.

### 2026-08-27 — 간판다이렉트(경쟁사) 접수 건수 대시보드 연동 ⭐
- **목적:** 대시보드에서 선택한 기간·날짜에 맞춰 경쟁사 간판다이렉트의 접수 건수를 같이 본다.
- **데이터 원본:** `theopeningsign/gpdirect` 레포의 월별 CSV `result(YYYY-MM).csv`
  (4시간마다 도는 GitHub Action 이 경쟁사 '실시간 견적 접수 현황' 게시판을 긁어 append)
- **가져오는 것은 카운트뿐.** 이름·상호·지역·간판종류는 트래커로 넘어오지 않는다.
  CSV 의 마지막 필드(`스크랩시각`)만 뽑아 날짜별로 센다.
- **추가 파일**
  - `lib/gpdirect.js` — GitHub Contents API 조회(ETag+5분 TTL 캐시), CSV 파싱, 일별 집계
  - `pages/api/direct/stats.js` — `GET ?startDate&endDate[&fresh=1]` → `{total, daily[]}`
  - `pages/api/direct/refresh.js` — `POST` workflow_dispatch 실행 / `GET ?since=` 실행 상태 폴링
- **수정 파일**
  - `pages/index.js` — 요약 카드 7→8칸, `DirectStatCard` 추가(↻ 갱신 버튼 포함),
    일별 추이 차트에 회색 점선 라인 오버레이, 비교모드 증감 연동
  - `.env.local.example` — `GPDIRECT_GITHUB_TOKEN` 등 추가
- **환경변수:** `GPDIRECT_GITHUB_TOKEN` (Vercel 에 등록). **미설정이어도 대시보드는 정상 동작**하고
  다이렉트 카드만 `—` 로 비활성된다. 다이렉트 조회가 실패해도 기존 화면은 그대로 렌더링되도록
  `mergeDaily` / `DirectStatCard` 에 방어 코드를 넣었다.

#### ⚠️ 이 숫자의 성격 (2026-08-27 전수 실사, 1,936행)
| 항목 | 실측 |
|---|---|
| CSV `일자`·`상태` 컬럼 | **1,936행 전부 빔** — 사이트에서 4개 컬럼만 긁힌다. 접수일자를 알 수 없다 |
| 그래서 쓰는 시간축 | `스크랩시각` = "우리가 처음 발견한 시각" |
| 00~02시 스크랩분 | 173건 (8.9%) — 대부분 전날 밤 접수분. KST 23:00 회차가 61% 자정 넘어 실행되기 때문 |
| **결론** | **월/주 단위는 신뢰 가능. 일 단위는 ±1일 흔들린다** |
| 게시판 노출 한도 | 약 20건. 4시간 안에 20건 초과 시 조용히 누락 → **실제 접수량의 하한선** |
| 중복 판정 키 | (마스킹 이름, 업체, 지역, 간판종류) — 동일 조합은 1건으로 합쳐짐 |

우리 숫자는 이벤트 기반 실측, 저쪽은 공개 게시판 노출분이라 **정의가 다르다.**
절대 건수 비교보다 추세·변곡점 비교로 읽을 것. 카드 하단 'ⓘ' 툴팁에 이 내용을 담아뒀다.

#### 📊 간품 vs 다이렉트 비교 화면 (`/vs-direct`)
기존에 엑셀로 손수 관리하던 월별 비교표를 화면으로 옮긴 것.

- **추가 파일**
  - `pages/vs-direct.js` — 월별 표(엑셀 배치 그대로) + 그룹 막대그래프 + 연간 요약 카드 3개
  - `pages/api/stats/monthly-quotes.js` — 우리 월별 건수. `count:'exact', head:true` 로 12개월 병렬 조회
    (행을 안 끌어오므로 1,000행 페이지네이션 이슈 없음). 집계 정의는 대시보드 '전체 견적요청'과 동일
  - `pages/api/direct/monthly.js` — 다이렉트 월별 건수 (`getDirectStats` 재사용, 월 단위로 묶음)
- **진입 경로**
  - PC: 사이드바 `⚔️ 간품 vs 다이렉트` (index.js / unconfirmed.js 의 `NAV` 배열에 추가)
  - 모바일: 대시보드 헤더의 `📋 CPA 추적` **바로 옆** `⚔️ VS 간판다이렉트` 버튼
    (모바일은 사이드바가 숨겨져 이게 유일한 진입점)

##### ⚠️ 양쪽 데이터 신뢰 구간이 다르다 — 비교 시작월 자동 결정
두 데이터의 시작 시점이 달라서, 아무 달이나 나란히 놓으면 왜곡된다.

| 구간 | 우리(간판의품격) | 간판다이렉트 |
|---|---|---|
| ~2026-02 | 엑셀 확정치 있음 | ❌ 1월은 날짜 수집 기능 없던 시절 자료를 통째로 1월에 넣은 것 / 2월은 수집 초기 |
| 2026-03~05 | ❌ 트래커 미완성 → **엑셀 확정치 사용** | ✅ 정상 |
| 2026-06~ | ✅ 트래커 실측 | ✅ 정상 |

관련 사실: 트래커 레포 최초 커밋은 2025-11-13 이지만 틀만 잡은 상태였고,
2026-04 에어브릿지 계약 종료 무렵 제대로 붙였다 (커밋도 2025-12 이후 끊겼다가 2026-04 에 79건).

**처리 방식 — `lib/constants.js` 상수 3개로 제어**
- `DIRECT_COMPARE_FROM = '2026-03'` — 저쪽 신뢰 시작 (운영자 판단)
- `TRACKER_RELIABLE_FROM = '2026-06'` — 우리 트래커 신뢰 시작 (운영자 판단)
- `MANUAL_QUOTES = { '2026-01':356 … '2026-05':328 }` — 트래커 이전 기간의 엑셀 확정치

`/api/stats/monthly-quotes` 가 `TRACKER_RELIABLE_FROM` 이전 달은 `MANUAL_QUOTES` 값으로 대체하고
`source: 'manual'|'tracker'`, `reliable` 플래그를 함께 내려준다.
이 설계 덕분에 **3~5월이 비교에서 살아난다** (우리는 수기값, 저쪽은 정상 수집).

`/vs-direct` 는 여기에 데이터가 스스로 말해주는 사실(`firstScrapedAt`)을 더해
가장 늦은 시점을 비교 시작월로 잡는다. 제외된 달은 숨기지 않고 **회색 + `*`** 로 남기고,
엑셀 확정치를 쓴 달은 주황색 **`수`** 첨자를 붙인다. 표 아래에 사유가 문장으로 뜬다.

화면 하단에 **실제 감지된 시작일**(우리 첫 이벤트 / 저쪽 첫 스크랩)을 항상 표시하므로,
배포 후 그 날짜를 보고 위 상수를 교정하면 된다.

그래서 **'차이' 행의 합계와 요약 카드는 비교 구간만 더한 값**이라
(우리 연간 합계 − 저쪽 연간 합계)와 다르다.

#### ⏱ 카드에 찍히는 시각은 '마지막 확인 시각' (`lastCheckedAt`)
처음엔 CSV 마지막 행의 `스크랩시각`(=`lastScrapedAt`)을 보여줬는데, **신규 접수가 0건이면
그 값이 안 움직인다.** ↻ 를 눌러도 시각이 그대로라 "지금 확인한 게 맞나?" 를 알 수 없었다.

그래서 `getLastCheckedAt()` 이 **스크래핑 워크플로가 마지막으로 성공한 시각**을 가져와
카드에 찍는다. 신규가 없어도 돌 때마다 갱신된다. (60초 캐시, 실패해도 화면은 안 죽음)

- `lastScrapedAt` — 마지막으로 **새 건이 들어온** 시각 → 글씨에 마우스 올리면 툴팁으로
- `lastCheckedAt` — 마지막으로 **확인한** 시각 → 카드에 표시하는 값
- 5시간 넘게 확인이 없으면 `⚠ N시간째 확인 안 됨` 으로 바뀐다 → 스크래핑 중단 감지용

CSV 캐시도 5분 → **60초**로 줄였다. ETag 조건부 요청이라 내용이 같으면 304 로 끝나고
304 는 GitHub 레이트리밋을 거의 소모하지 않는다. 5분이면 다른 서버리스 인스턴스가
옛 숫자를 보여줄 수 있어 오해를 부른다.

#### 📱 모바일 새로고침 버튼
홈 화면에 추가해 앱처럼 쓰면 브라우저 UI가 없어 **당겨서 새로고침이 안 된다.**
기간 프리셋을 다시 눌러도 재조회는 되지만 그게 '새로고침'이라는 게 드러나지 않는다.

제목 줄(`gp-title-row`) 오른쪽 끝에 `↻` 버튼을 두고 **모바일에서만** 노출한다
(PC 는 프리셋 버튼들이 이미 그 역할을 해서 중복). 페이지를 통째로 리로드하지 않고
`fetchStats()` + `fetchDirect()` 만 다시 호출한다.

> 참고: 자동 갱신(폴링)은 한 번 넣었다가 **철회했다.** '변화가 있을 때만 갱신'을 하려면
> 결국 주기적으로 확인해야 하는데(서버가 브라우저를 먼저 깨우는 구조가 아님),
> 수동 버튼으로 충분하다는 판단. 필요해지면 다시 넣기는 쉽다.

#### 🔄 '지금 갱신' 버튼
버튼 → `POST /api/direct/refresh` → gpdirect 워크플로 `workflow_dispatch` 실행(약 2분) →
5초 간격 폴링 → 완료 시 캐시 우회 재조회.

gpdirect 레포 워크플로에도 함께 넣은 안전장치 2개:
- `inputs.silent` — 트래커가 띄운 회차는 텔레그램·메일을 보내지 않는다
  (버튼 누를 때마다 알림이 울리면 알림이 장애 신호 역할을 못 함)
- `concurrency: scrape-ganpan` — 스케줄 회차와 겹치면 `git push || true` 때문에
  한쪽 회차 데이터가 **조용히 사라지던** 문제를 막는다 (`cancel-in-progress: false`)

API 쪽 제동 (gpdirect 는 Private 레포라 Actions 분이 과금됨):
- 진행 중인 런이 있으면 새로 띄우지 않고 그 런을 물려준다
- 수동 실행 쿨다운 10분 + 하루 12회 상한 (GitHub 실행 이력 기준이라 서버리스에서도 유효)

### 2026-08-08 — 페이지네이션 정렬 누락으로 인한 집계 중복/누락 수정 ⭐
- **증상:** 대시보드 견적요청이 8/3~8/9 기간에 **86건**으로 표시 (Supabase 직접 SQL·엑셀 내보내기 정답은 **76건**). 날짜별 오차가 +4/0/+10/+6/**−13**/+3/0으로 부풀림·누락이 섞여 흩어짐 → 시간대 문제 아님. 새로고침할 때마다 숫자가 달라짐.
- **원인:** 여러 API가 `.range()`로 1,000행씩 페이지네이션하면서 **`.order()`가 없었음.** ORDER BY 없는 OFFSET 페이지네이션은 페이지마다 행 순서가 보장되지 않아 같은 행이 중복 조회되거나 누락됨.
- **수정:** `.range()` 호출 앞에 `.order('id', { ascending: false })` 추가 (5개 파일 각 1줄).
  - `pages/api/events/stats.js` (86 vs 76 사건의 직접 원인)
  - `pages/api/events/category-detail.js`
  - `pages/api/events/channel-detail.js`
  - `pages/api/contracts/data.js`
  - `pages/api/unconfirmed/index.js`
  - ※ `export.js`는 원래 `.order('created_at')`가 있어서 정확했음 (그래서 엑셀만 정답과 일치).
  - `id` 사용 이유: 고유값이라 순서가 완전히 고정됨 (created_at은 이론상 동률 가능).
- **검증:** `.range()` 쓰는 6곳 전수 점검 → 전부 order 확인. 빌드 통과. 배포 후 대시보드(8/3~8/9) 여러 번 새로고침해 **76 고정**이면 성공.
- 사이드이펙트: 없음 (조회 순서만 고정, 집계 로직·DB 무변경). 롤백: 커밋 되돌리기.
- 출처: Cowork 세션 원인 규명 → `인수인계_페이지네이션_수정 (2026-08-08).md`

### 2026-05 — 인스타그램 채널 키 정규화
- `gp.js`: `resolveChannel`에 `CHANNEL_NORMALIZE` 맵 추가 — `ig`, `instagram` → `instagram_official`
- `export.js`: 엑셀 내보내기 시 기존 DB에 쌓인 `ig` 값도 `instagram_official`로 변환 (DB 직접 수정 없이)
- 이유: 기존 데이터베이스가 `instagram_official` 키로 인식하도록 맞춤

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

### 2026-05 — 미확인 계약 알림판 연락관리 기능 추가

**배경:** 상담 참여 후 2주 이상 경과했으나 계약 미확인 견적을 추적하는 알림판에, 연락완료 관리 기능 추가

**변경 파일:**
- `pages/api/unconfirmed/index.js` — 핵심 로직 개선
- `pages/api/unconfirmed/status.js` — 신규 생성 (연락완료 상태 API)
- `pages/unconfirmed.js` — UI 전면 개편

**Supabase 테이블 추가:**
```sql
CREATE TABLE unconfirmed_status (
  req_id bigint PRIMARY KEY,
  status text NOT NULL DEFAULT 'contacted',
  memo text,
  updated_at timestamptz DEFAULT now()
);
```
- `req_id`만 실제로 사용 (용량 최소화 원칙)
- 목적: 이미 관리한 견적은 다음 조회 시 백엔드 API 호출 자체를 스킵해 속도 개선

**API 개선 (`index.js`):**
- `unconfirmed_status`에서 연락완료 req_id를 먼저 조회
- `activeReqIds` = 전체 - 연락완료 → 백엔드 API(detail_matched, advcie_joinpartners)는 이것만 호출
- 고객명/전화번호: `detail.req.name`, `detail.req.phone` 에서 직접 가져옴 (XLSX 보조)
- XLSX(`ex_alldata`) 파싱: `range: 1`로 첫 번째 타이틀 행 스킵 수정

**UI 개선 (`unconfirmed.js`):**
- "✅ 연락완료" 버튼 → POST `/api/unconfirmed/status` → 즉시 흑백 처리 (grayscale 100% + opacity 0.6)
- "↩ 취소" 버튼으로 실수 복구 가능
- 연락완료 항목은 하단 별도 섹션으로 접기/펼치기
- 요약 배너: 미연락/연락완료/스캔건수 표시
- 다음 조회부터 연락완료 항목은 자동 제외됨 안내 표시
- "🔄 상태 재확인" 버튼: 현재 미연락 항목들만 `detail_matched` 재조회 → 계약됨/삭제됨 배지 표시
  - `pages/api/unconfirmed/recheck.js` — GET `?req_ids=1,2,3` → `{ results: { [reqId]: 'contracted'|'deleted'|'active' } }`
  - 계약됨: 노란 배경 + "⚠️ 계약 진행됨" 배지
  - 삭제됨: 빨간 배경 + "🗑️ 견적 삭제됨" 배지

**모바일 대응 (`unconfirmed.js`):**
- 모바일 상단 고정 네비바 추가 (⚠️ 미확인 계약 | 📊 대시보드 버튼)
- 카드 레이아웃 모바일에서 세로 스택으로 전환
- 전화번호: `tel:` 링크 → 📋 클릭 시 클립보드 복사 버튼 (복사 후 2초간 "✅ 복사됨!" 표시)
- 상세 보기: 카드 하단에 별도 바로 분리 (연락완료 버튼과 실수 탭 방지)
- 대시보드 모바일 네비바에 ⚠️ 미확인 버튼 추가 (`index.js`)

### 2026-05 — 유입경로 탭 전체 URL 기반으로 개선
- `channel-detail.js`: referrer_domain → referrer 전체 URL 기반 집계 (글 단위 식별 가능)
- 유입경로 탭 노출 채널 확대: 유료 검색광고(naver.searchad, naver_powercontents, google, google.adwords) 제외한 모든 채널
- naver_blog_official, agency(CPA), tenping_web, instagram_official, unattributed 등 포함
- URL 클릭 시 해당 페이지로 이동, shortReferrer로 길이 자동 축약 표시

### 2026-05 — 채널 상세 키워드 탭 엑셀 다운로드 추가
- `channels.js` `DetailPanel` 키워드 탭 우측 상단에 `📥 엑셀 다운로드` 버튼 추가
- 컬럼: 키워드 / 소스(네이버·구글) / 방문수 / 견적건수 / 전환율(%) — 화면과 동일, 견적건수 순 정렬
- 파일명: `키워드분석_{채널명}_{시작일}_{종료일}.xlsx`
- 서버 수정 없음 (기존 channel-detail API의 keywords 데이터를 그대로 XLSX.writeFile)
- `detailPanelProps`에 `dates` 추가로 전달

### 2026-05 — 채널분석 유입경로 탭 대시보드와 동기화 (버그 2개 수정)
- **증상:** 채널분석에서 (a) 자연유입 외 무료채널은 유입경로 탭 자체가 안 뜸, (b) 자연유입은 탭은 떠도 URL이 빈값.
- **원인:** 채널분석(`channels.js`)이 옛날 코드로 남아있었음. 대시보드(`index.js`)는 정답 코드였음.
  - 탭 노출 조건: `selectedChannel === 'unattributed'`만 허용 → 유료 검색광고만 제외하는 조건으로 변경 (대시보드와 동일)
  - 렌더링: `item.domain` 참조(서버엔 없는 필드) → `item.url`로 수정 + 클릭 가능한 링크 + isDirect 처리 (대시보드와 동일)
- 서버 수정 없음 (channel-detail의 referrerDomains는 원래 모든 채널에 대해 `url` 필드로 내려주고 있었음).
- 사이드이펙트: 다른 페이지/앱웹뷰/봇SSR/DB 없음 (트래커 프론트 표시 로직만).

### 2026-05 — 키워드별 계약 전환 집계 추가 (엑셀 + 화면)
- **연결 원리:** `channel-detail.js`가 키워드별 견적 `req_id` 목록(`reqIds`)을 같이 반환 → 프론트에서 `contracts/data`의 채널별 계약 `req_id`(`byChannel[ch].reqIds`)와 **교집합** = 키워드별 계약건수. **관리자 API 추가 호출 없음** (계약현황 조회 시 이미 받은 데이터 재사용).
- `channel-detail.js`: paged select에 `req_id` 추가, 키워드 집계 시 견적 이벤트의 req_id를 `_reqIds` Set에 수집 → keywordList에 `reqIds` 배열로 반환.
- `channels.js`: `detailPanelProps`에 `contractData` 전달. `DetailPanel`에서 `contractedSet`(해당 채널 계약 req_id) 계산.
  - 화면: 계약현황 조회했으면 각 키워드에 `계약 N건` 보라 배지 표시.
  - 엑셀: 계약현황 조회했으면 `계약건수`, `견적→계약(%)` 컬럼 추가. 안 했으면 안내 문구 + 기존 컬럼만.
- **주의:** 계약건수는 "계약현황 조회" 선행 필수 (contractData 없으면 계약 컬럼 미표시).

---

## 🚧 미완료 / 향후 과제

### 단기
- [ ] **구글 광고비 자동 입력 — 1단계(읽기 검증)에서 대기 중** (2026-09-11)
  - 방식 확정: 공식 API(관리자계정·브랜드인증·등급승인·OAuth) 대신 **구글 광고 내장 스크립트**가 매일 06시 비용을 트래커로 **밀어넣는** 구조 (네이버는 트래커가 가져오는 구조 — 반대). 계정만 있으면 됨, 일별 예약 가능, 외부 전송 가능 — 공식 문서 확인.
  - 막힌 이유: 인증 단계에서 운영자 계정(hyukjune.gp)과 itransme@(근표) 계정 **둘 다 새 패스키 보안 지연 6일**에 걸림(2026-09-11 확인) → **2026-09-17 이후** 재시도. 공식 API로 바꿔도 같은 구글 계정 허락이 필요해 대기를 못 피함. 인증은 운영자 본인 계정으로(인증한 사람 권한으로 계속 돔).
  - 재개 절차: `docs/google-ads/1단계_읽기전용.js` 를 스크립트에 붙여넣기 → 저장 → 인증 → 미리보기 → **로그 탭** 복사 → 9/1~9/10 수기값(9/1 구글광고 46,743 / 앱 285 …)과 대조 → 부가세 기준·유형 매핑(예상 SEARCH→`google`, MULTI_CHANNEL→`google_app`) 확정.
  - 2단계(미구현): 트래커에 받는 문 `/api/adcosts/sync-google` (POST, CRON_SECRET 잠금, `lib/adcostSync.js` 와 같은 빈칸만 채움 규칙) + 스크립트에 `UrlFetchApp.fetch(url, {method:'post', contentType:'application/json', payload, headers})` 전송 추가 + 구글 화면에서 매일 06:00 예약.
  - 텐핑: API 유무 미확인 → 수기 유지.
- [ ] `/api/adcosts` POST(수기 저장) 무인증·CORS `*` → CRON_SECRET 또는 세션 기반으로 잠금 (자동입력과 별개 보안 건)
- [ ] Vercel `SUPABASE_SERVICE_ROLE_KEY` 가 Config(값 보임)로 저장돼 "Needs Attention" 표시 → Secret 으로 전환
- [ ] 회원가입 트래커 누락 수정
  - `ganpoomreact/SignUp.js`, `common.js`에 `GanpoomTracker.track('airbridge.user.signup')` 직접 호출 추가 필요
  - 가이드: `회원가입-트래커-누락-수정-가이드.md`

### 중기
- [x] 스타일맵 견적 req_id 연동 (완료 확인)
  - `airbridge.ecommerce.order.completed` 이벤트에 req_id 정상 저장 확인
  - QUOTE_EVENTS에 이미 포함되어 미확인 목록에 자동 집계 중

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
| `다이렉트-접수건수-연동-설정가이드 (2026-08-27).md` | 토큰 발급·Vercel 환경변수·배포 순서 |
