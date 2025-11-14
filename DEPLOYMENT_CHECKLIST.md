# 🚀 배포 전 체크리스트

## ✅ 완료된 것들
- [x] 시스템 개발 완료
- [x] Supabase 데이터베이스 스키마 생성
- [x] 환경변수 설정 완료
- [x] 더미 데이터 제거 완료
- [x] API 연결 검증 완료

## 📋 이제 해야 할 일들

### 1️⃣ 로컬 테스트 (지금 바로!)
```bash
npm run dev
```

**확인 사항:**
- [ ] `http://localhost:3000` 접속 가능
- [ ] 관리자 페이지 접속 가능 (비밀번호 입력)
- [ ] 에이전트 생성 가능
- [ ] 에이전트 목록 조회 가능
- [ ] 통계 페이지 데이터 표시 확인 (에이전트 없으면 0으로 표시)

### 2️⃣ Supabase 데이터베이스 확인
Supabase 대시보드에서 확인:
- [ ] 테이블 4개 생성됨 (`agents`, `link_clicks`, `quote_requests`, `user_sessions`)
- [ ] RLS 정책 적용됨
- [ ] 샘플 데이터 없음 (깨끗한 상태)

### 3️⃣ 빌드 테스트
```bash
npm run build
```

**확인 사항:**
- [ ] 빌드 성공 (에러 없음)
- [ ] 경고 메시지 확인 (중요한 경고는 수정)

### 4️⃣ Vercel 배포

#### 4-1. GitHub에 푸시 (아직 안 했다면)
```bash
git add .
git commit -m "배포 준비 완료"
git push origin main
```

#### 4-2. Vercel 연결
1. https://vercel.com 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭
4. 이 저장소 선택
5. 환경변수 설정:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://jxhwlwftwhqkvnhbjacm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHdsd2Z0d2hxa3ZuaGJqYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjIwNjMsImV4cCI6MjA3ODYzODA2M30.ScVCizlk_QTAixKRJtQSl9Tpg4QAU1ULWPQbtkxvRHE
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHdsd2Z0d2hxa3ZuaGJqYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA2MjA2MywiZXhwIjoyMDc4NjM4MDYzfQ.n0Vwta_nTVpRHFQ6SpsO7_cdrPWUJR6_h-sphbeeeQ0
   NEXT_PUBLIC_SITE_URL=https://www.ganpoom.com
   NODE_ENV=production
   ```
6. "Deploy" 클릭

#### 4-3. 배포 후 확인
- [ ] 배포 성공 (초록색 ✅)
- [ ] 배포된 URL 접속 가능 (예: `https://ganpoom-tracking.vercel.app`)
- [ ] 모든 페이지 정상 작동
- [ ] API 엔드포인트 작동 확인 (`/api/stats/dashboard` 등)

### 5️⃣ ganpoom.com에 추적 스크립트 추가

#### 배포 후 실제 URL 확인
배포가 완료되면 Vercel에서 실제 URL을 확인하세요 (예: `https://ganpoom-tracking.vercel.app`)

#### ganpoom.com HTML에 추가
```html
<!-- ganpoom.com의 </head> 태그 바로 앞에 추가 -->
<script src="https://[YOUR-VERCEL-URL]/ganpoom-tracker.js"></script>
```

**예시:**
```html
<script src="https://ganpoom-tracking.vercel.app/ganpoom-tracker.js"></script>
</head>
```

### 6️⃣ 커스텀 도메인 설정 (선택사항)
원하시면 `tracking.ganpoom.com` 같은 커스텀 도메인도 연결할 수 있어요:
1. Vercel 프로젝트 → Settings → Domains
2. 도메인 추가
3. DNS 설정 (Vercel이 안내해줌)

### 7️⃣ 최종 테스트

#### 실제 추적 테스트
1. 에이전트 생성 (`/admin/agents`)
2. 링크 생성 (예: `ganpoom.com/?ref=Ab3kM9`)
3. 해당 링크로 접속
4. 대시보드에서 클릭 수 증가 확인
5. 견적요청 제출
6. 대시보드에서 견적요청 수 증가 확인

## 🎯 체크리스트 요약

### 필수 (지금 해야 할 것)
- [ ] 로컬 테스트 (`npm run dev`)
- [ ] 빌드 테스트 (`npm run build`)
- [ ] GitHub에 푸시
- [ ] Vercel 배포
- [ ] ganpoom.com에 스크립트 추가

### 선택사항
- [ ] 커스텀 도메인 연결
- [ ] 비밀번호 변경 (보안 강화)
- [ ] 모니터링 설정

## ⚠️ 주의사항

1. **환경변수 보안**
   - `.env.local` 파일은 GitHub에 푸시하지 마세요 (이미 `.gitignore`에 있음)
   - Vercel에만 환경변수 추가

2. **비밀번호 보안**
   - `components/PasswordProtection.js`의 비밀번호를 운영용으로 변경하세요

3. **트래픽 모니터링**
   - Supabase 무료 플랜: 500MB DB, 1GB 대역폭
   - 트래픽이 많아지면 Pro 플랜 업그레이드 필요

## 📞 문제 발생시

### 빌드 에러
- 터미널에서 `npm run build` 실행해서 에러 확인
- 에러 메시지를 알려주시면 수정해드려요

### 배포 후 작동 안 함
- Vercel 로그 확인 (Deployments → 해당 배포 → View Function Logs)
- 환경변수 제대로 설정됐는지 확인

### 추적이 안 됨
- ganpoom.com의 스크립트 태그 확인
- 브라우저 콘솔에서 에러 확인 (F12)
- 네트워크 탭에서 API 호출 확인

