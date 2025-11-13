# Ganpoom 링크 트래킹 시스템

## 프로젝트 구조
```
ganpoom-tracking/
├── frontend/              # 에이전트용 링크 생성 대시보드
│   ├── pages/
│   │   ├── dashboard.html # 에이전트 대시보드
│   │   └── analytics.html # 성과 분석 페이지
│   └── js/
├── backend/               # API 서버
│   ├── api/
│   │   ├── links.js      # 링크 생성/관리 API
│   │   └── tracking.js   # 트래킹 데이터 수집 API
│   └── database/
├── sdk/                   # ganpoom.com에 설치할 트래킹 SDK
│   └── ganpoom-tracker.js
└── database/
    ├── links.sql         # 링크 정보 테이블
    └── events.sql        # 트래킹 이벤트 테이블
```

## 핵심 기능
1. 에이전트별 고유 링크 생성
2. 링크 클릭 → 견적요청 연결 추적
3. 실시간 성과 분석 대시보드
4. 에이전트별 커미션 계산
