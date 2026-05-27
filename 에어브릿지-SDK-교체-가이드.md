# 에어브릿지 SDK → 간품 트래커 자체 SDK 교체 가이드

## 개요

에어브릿지 계약 종료에 따라, `airbridge-web-sdk-loader` npm 패키지를 제거하고
`window.airbridge` 인터페이스를 간품 트래커 자체 mock으로 교체한다.

**핵심 원칙:**
- `ganpoomreact` 전체 코드에 퍼져있는 `window.airbridge.*` 호출은 **한 줄도 건드리지 않는다**
- `index.html`에 가짜 `window.airbridge` 객체를 심어서 기존 호출이 자동으로 우리 트래커로 연결되게 한다
- 이미 확인 완료: `import airbridge` 는 `App.js` 단 한 곳에만 존재

---

## 수정 파일 1: `ganpoomreact/public/index.html`

### 수정 내용 A — 기존 `_gpWrap` 블록 제거

아래 블록을 **통째로 삭제**한다.

```html
<!-- 에어브릿지 wrapper: 에어브릿지 초기화 후 이벤트 가로채기 -->
<script>
  var _gpWrap = setInterval(function() {
    if (window.airbridge && window.airbridge.events &&
        typeof window.airbridge.events.send === 'function' &&
        window.GanpoomTracker) {
      var orig = window.airbridge.events.send.bind(window.airbridge.events);
      window.airbridge.events.send = function(name, data) {
        orig(name, data);
        window.GanpoomTracker.track(name, data || {});
      };
      clearInterval(_gpWrap);
    }
  }, 300);
</script>
```

---

### 수정 내용 B — 간품 트래커 SDK 스크립트 태그 **바로 위에** 인라인 stub 추가

현재 index.html에 있는 아래 줄:

```html
<!-- 간품 트래커 SDK -->
<script src="https://ganpoom-tracker-htkz.vercel.app/gp.js" async></script>
```

이 줄 **바로 위에** 아래 코드를 추가한다:

```html
<!-- 에어브릿지 SDK 대체 stub — gp.js 로드 전에 window.airbridge 즉시 확보 -->
<script>
  window.airbridge = {
    init: function() {},

    setUserId: function(id) {
      if (window.GanpoomTracker) {
        window.GanpoomTracker.userId = id;
      } else {
        window._abUserId = id;
      }
    },

    setUserAttributes: function(attrs) {
      if (window.GanpoomTracker) {
        window.GanpoomTracker.userAttrs = attrs;
      } else {
        window._abUserAttrs = attrs;
      }
    },

    clearUser: function() {
      if (window.GanpoomTracker) {
        window.GanpoomTracker.userId = null;
        window.GanpoomTracker.userAttrs = null;
      }
      window._abUserId = null;
      window._abUserAttrs = null;
    },

    events: {
      send: function(name, data) {
        if (window.GanpoomTracker) {
          window.GanpoomTracker.track(name, data || {});
        } else {
          window._abQ = window._abQ || [];
          window._abQ.push([name, data]);
        }
      }
    }
  };
</script>
```

> **위치 중요:** 이 스크립트는 반드시 gp.js 스크립트 태그보다 **위에** 있어야 한다.
> App.js가 실행되기 전 `window.airbridge`가 확보되어야 하기 때문.

---

## 수정 파일 2: `ganpoomreact/src/App.js`

### 제거 항목 1 — import 문 (16번째 줄 근처)

```javascript
// 아래 줄 삭제
import airbridge from 'airbridge-web-sdk-loader'
```

---

### 제거 항목 2 — airbridgeInit 함수 호출 (useEffect 내부)

```javascript
// useEffect 안에서 아래 호출 삭제
airbridgeInit()
```

---

### 제거 항목 3 — airbridgeInit 함수 정의 전체 (약 214번째 줄)

```javascript
// 아래 함수 전체 삭제
const airbridgeInit = () => {
  const airBridgeInit = setInterval(() => {
    airbridge.init({
      app: 'ganpoomclient',
      webToken: 'fe83275ac55243a48520d9a37fcbec06',
      utmParsing: true,
      urlQueryMapping: {
        channel: "utm_source",
        campaign: "utm_campaign",
        campaign_id: "k_campaign",
        ad_group_id: "k_adgroup",
        ad_creative_id: "k_creative",
        content: "utm_content",
        term: ["k_keyword", "utm_term"],
        term_id: "k_keyword_id",
        medium: "utm_medium",
        sub_id_1: "k_media"
      }
    })
    clearInterval(airBridgeInit)
  })
}
```

---

## 배포 순서

```
① 간품 트래커(gp.js) 업데이트 — Claude가 담당 (미리 배포 가능)
② index.html 수정 (stub 추가 + _gpWrap 제거)
③ App.js 수정 (import + airbridgeInit 3곳 제거)
④ ②③ 동시 빌드 & 배포
⑤ 배포 후 검증
```

> ①은 미리 배포해도 완전히 안전하다.
> ②③은 반드시 **동시에** 배포해야 한다. 따로 배포 시 오류 발생 가능.

---

## 배포 후 검증 체크리스트

- [ ] 회원가입 후 Vercel 로그에 `airbridge.user.signup` 이벤트 수신 확인
- [ ] 비교견적 요청 후 Supabase `events` 테이블에 정상 기록 확인
- [ ] 로그아웃 시 오류 없는지 확인 (브라우저 콘솔 에러 없어야 함)
- [ ] 채널 어트리뷰션 정상 동작 확인 (UTM 파라미터 추적)
- [ ] 광고차단 프로그램 켠 상태에서 이벤트 수신 확인

---

## 롤백 방법

문제 발생 시 즉시 원상복구 가능:
1. `index.html`에서 stub 제거 + `_gpWrap` 복구
2. `App.js`에서 import / airbridgeInit 복구
3. 빌드 & 배포

---

## 이 작업 시작할 때 Claude에게 할 말

> **"에어브릿지 SDK 교체 이제 시작하자"**

Claude가 이 파일(`에어브릿지-SDK-교체-가이드.md`)을 읽고 `gp.js` 수정을 진행한다.
