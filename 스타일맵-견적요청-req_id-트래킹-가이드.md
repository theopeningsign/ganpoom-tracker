# 스타일맵 견적요청 req_id 트래킹 가이드

기존 `계약성사까지추적해볼까.md`에서 일반 견적(`v4/rfp_estimate`, `rfp_maintenance`)은 완료됨.
이 가이드는 **스타일맵 전용 견적요청(`style_rfp_estimate`)** 의 나머지 수정 사항이다.

---

## 현재 상황

- 네트워크 탭 확인 결과: `style_rfp_estimate` 응답이 `{"res":0,"msg":"성공"}` → req_id 없음
- 트래커에 `airbridge.ecommerce.order.completed` 이벤트는 기록되지만 req_id=null

---

## 수정 1. 백엔드 (`authApi.js`)

**파일 위치:**
```
backend-master/routes/apis/authApi.js
```

**수정 위치:** `style_rfp_estimate` 라우터 성공 응답 부분 (약 12717번째 줄)

앞뒤 코드로 위치 파악:
```javascript
        if (result.affectedRows > 0) {

          Promise.all([newStyleDeliverToPartner(...), reqClinetStyleUserBizmsg(...)])
            .then((resolve) => {
              db.releaseConnection(connection)
            })

            res.json({           // ← 이 부분 수정
            res: 0,
            msg: '성공'
          })
```

**수정 전:**
```javascript
res.json({
  res: 0,
  msg: '성공'
})
```

**수정 후:**
```javascript
res.json({
  res: 0,
  msg: '성공',
  req_id: result.insertId
})
```

> `result.insertId`는 바로 위 INSERT 쿼리 결과다. 이미 `newStyleDeliverToPartner(connection, result.insertId, ...)` 에서 사용 중이므로 별도 선언 필요 없음.

---

## 수정 2. 프론트엔드 (`ConceptModal.js`)

**파일 위치:**
```
ganpoomreact/src/Components/Client/StyleMap/ConceptModal.js
```

**수정 위치:** `sendConcept` 함수 내부, `if (window.airbridge)` 블록 닫힌 직후 (약 106번째 줄)

아래 코드에서 `}` 를 찾아서 (if window.airbridge 닫는 괄호) 바로 아래에 추가한다.

**추가 전:**
```javascript
          }	          // ← if (!process.env...) 닫는 괄호
        }             // ← if (window.airbridge) 닫는 괄호
    }else {
```

**추가 후:**
```javascript
          }	          // ← if (!process.env...) 닫는 괄호
        }             // ← if (window.airbridge) 닫는 괄호

      // ✅ 추가: req_id와 함께 트래커에 직접 전송
      if (window.GanpoomTracker && ret.data.req_id) {
        window.GanpoomTracker.track('airbridge.ecommerce.order.completed', {
          req_id: ret.data.req_id
        })
      }
    }else {
```

> 핵심: `if (window.GanpoomTracker...)` 블록은 `if (window.airbridge)` 와 **같은 들여쓰기 레벨**이어야 한다. `if (ret.status === 200...)` 블록 **안에** 위치해야 함.

---

## 배포 순서

```
① 백엔드(backend-master) 배포
② 네트워크 탭에서 style_rfp_estimate 응답에 req_id 있는지 확인
③ 프론트엔드(ganpoomreact) 배포
```

---

## 검증 방법

1. 스타일맵에서 견적 요청 제출
2. 네트워크 탭 → `style_rfp_estimate` 응답에 `req_id` 있는지 확인
3. Supabase `events` 테이블에서 `event_category = 'airbridge.ecommerce.order.completed'` 행의 `req_id` 컬럼 확인
