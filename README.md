# 🚀 Ganpoom 링크 트래킹 시스템

완전하고 안정적인 에이전트 링크 추적 시스템

## ✨ 주요 기능

### 🔗 링크 관리
- ✅ 짧은 추적 링크 생성 (`ganpoom.com/?ref=Ab3kM9`)
- ✅ 에이전트별 링크 관리
- ✅ 실시간 클릭 추적
- ✅ 30일 쿠키 추적

### 📊 실시간 분석
- ✅ 링크 클릭 수 추적
- ✅ 견적요청 전환 추적
- ✅ 전환율 계산
- ✅ 에이전트별 성과 분석

### 👥 사용자 관리
- ✅ 관리자 대시보드
- ✅ 에이전트 개인 페이지
- ✅ 실시간 알림 시스템
- ✅ 자동 정산 계산

## 🛠️ 기술 스택

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## 💰 비용

- **개발**: 무료 (Cursor AI 사용)
- **운영**: 무료 시작 → 필요시 월 6만원

## 🚀 빠른 시작

### 1. 프로젝트 설정
```bash
npm install
npm run dev
```

### 2. 환경 변수 설정
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 데이터베이스 설정
Supabase에서 테이블 생성 (자동 스크립트 제공)

### 4. ganpoom.com에 추적 코드 추가
```html
<script src="https://your-tracking-domain.vercel.app/tracker.js"></script>
```

## 📁 프로젝트 구조

```
ganpoom-tracking/
├── pages/
│   ├── api/              # API 엔드포인트
│   ├── admin/            # 관리자 대시보드
│   ├── agent/            # 에이전트 페이지
│   └── index.js          # 메인 페이지
├── components/           # React 컴포넌트
├── lib/                  # 유틸리티 함수
├── public/
│   └── tracker.js        # ganpoom.com용 추적 스크립트
└── styles/               # CSS 스타일
```

## 🎯 다음 단계

1. ✅ 데모 테스트 완료
2. 🔄 프로젝트 초기 설정
3. ⏳ 데이터베이스 설계
4. ⏳ API 개발
5. ⏳ 관리자 대시보드
6. ⏳ 에이전트 페이지
7. ⏳ 배포 및 테스트






