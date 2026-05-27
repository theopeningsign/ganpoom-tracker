# 간품 Android 앱 — 간품 트래커 연동 가이드

> **배경**: 에어브릿지 제거 후 `rfp_est` 이벤트 핸들러가 비어있는 상태.
> 간품 트래커 서버(`https://ganpoom-tracker-htkz.vercel.app`)로 이벤트를 전송해야 함.

---

## 현재 문제

`WebPackingActivity.kt` 에서 견적요청 이벤트를 받아도 아무것도 안 함:

```kotlin
// WebPackingActivity.kt - AppEvent 클래스 내부
if (eventName.contains("rfp_est")) {
    // facebook 이벤트 로깅 제거  ← 비어있음
}
```

그리고 앱이 로드하는 URL이 `https://www.ganmain.com` 이라서
간품 트래커 JS 스크립트가 실행되지 않음.

---

## 해결 방법

### 방법 A — 앱에서 직접 API 호출 (권장)

`rfp_est` 이벤트를 받는 시점에 간품 트래커 API로 HTTP POST 요청 전송.

#### 1. WebPackingActivity.kt 수정

```kotlin
// AppEvent 클래스 내 callbackEvent 메서드
if (eventName.contains("rfp_est")) {
    sendGanpoomTrackEvent("comparison.request")
}
```

#### 2. sendGanpoomTrackEvent 함수 추가

`WebPackingActivity.kt` 또는 별도 유틸 파일에 추가:

```kotlin
private fun sendGanpoomTrackEvent(eventCategory: String) {
    Thread {
        try {
            val url = java.net.URL("https://ganpoom-tracker-htkz.vercel.app/api/events/track")
            val conn = url.openConnection() as java.net.HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true

            val body = """
                {
                    "event_category": "$eventCategory",
                    "platform": "app",
                    "device_type": "mobile",
                    "os_name": "Android",
                    "channel": "unattributed"
                }
            """.trimIndent()

            conn.outputStream.use { it.write(body.toByteArray()) }
            conn.inputStream.close() // 응답 소비
            conn.disconnect()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }.start()
}
```

---

### 방법 B — ganmain.com에 트래커 스크립트 추가 (서버 작업)

`ganmain.com` 서버의 HTML `<head>` 태그 안에 아래 스크립트 추가:

```html
<script src="https://ganpoom-tracker-htkz.vercel.app/ganpoom-tracker.js" async></script>
```

단, 이 방법은 `ganmain.com` 서버 코드 수정이 필요하고,
Android WebView의 User Agent에 식별자가 없어서 `platform: 'app'`으로
정확히 구분되지 않을 수 있음 → 방법 A 권장.

---

## 이벤트 카테고리 매핑

| 앱 이벤트 (`eventName`) | 트래커 이벤트 (`event_category`) |
|---|---|
| `rfp_est` | `comparison.request` |
| `call`, `booking` | `phone.click` |
| `contract_download` | `comparison.contract` |

---

## 참고: iOS 앱은 이미 해결됨

iOS 앱은 `https://www.ganpoom.com`을 로드하고
Custom UA에 `IOS_KEY:APP_{countryCode}` 패턴을 포함하고 있어서
간품 트래커가 자동으로 `platform: 'app'`으로 감지함. (2026-04-28 적용)

Android만 위 작업 필요.
