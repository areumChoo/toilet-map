# 화장실 비밀번호 지도

> **https://toilet-map-sigma.vercel.app**

주변 건물 화장실 비밀번호를 조회하고 등록할 수 있는 크라우드소싱 지도 앱입니다. 지도에서 건물을 선택하면 다른 사용자들이 공유한 화장실 비밀번호를 확인하고, 직접 새로운 비밀번호를 등록하거나 기존 비밀번호에 투표할 수 있습니다.

## 주요 기능

- **비밀번호 등록/조회** — 건물 화장실 비밀번호를 등록하고, 다른 사용자가 등록한 비밀번호를 조회
- **맞아요/틀려요 투표** — 비밀번호 정확도를 크라우드소싱으로 검증하는 투표 시스템
- **비밀번호 신선도 표시** — 마지막 확인일 기준 최근(7일)/보통(30일)/오래됨 표시
- **간단평가 리뷰** — 청결도, 휴지 유무, 남녀공용, 비데, 장애인 화장실, 기저귀 교환대 등 시설 평가
- **지도 기반 탐색** — Kakao Map으로 현재 위치 주변 건물 탐색
- **다중 화장실 지원** — 한 건물 내 여러 화장실(1층, 2층 등)을 구분하여 관리
- **어뷰징 방지** — IP 기반 rate limiting으로 중복 등록 및 도배 방지

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| 언어 | TypeScript 5 |
| 백엔드/DB | Supabase (PostgreSQL, Edge Functions) |
| 지도 | Kakao Map SDK |

## 시작하기

### 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 변수를 설정합니다.

```env
NEXT_PUBLIC_KAKAO_MAP_KEY=<카카오 맵 JavaScript 키>
NEXT_PUBLIC_SUPABASE_URL=<Supabase 프로젝트 URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Supabase Publishable Key>
SUPABASE_SERVICE_ROLE_KEY=<Supabase Service Role Key>
```

### 설치 및 실행

```bash
npm install
npm run dev
```
### 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── buildings/
│   │   │   ├── route.ts                 # 건물 조회/등록
│   │   │   └── [id]/
│   │   │       ├── toilets/route.ts     # 화장실 조회/등록
│   │   │       ├── passwords/route.ts   # 비밀번호 조회/등록
│   │   │       └── reviews/route.ts     # 리뷰 조회/등록
│   │   └── passwords/
│   │       └── [id]/vote/route.ts       # 비밀번호 투표
│   ├── layout.tsx                        # 루트 레이아웃
│   └── page.tsx                          # 메인 페이지 (지도)
├── components/
│   ├── KakaoMap.tsx          # 카카오 맵 컴포넌트
│   ├── BuildingPanel.tsx     # 건물 정보 바텀시트
│   ├── PasswordCard.tsx      # 비밀번호 카드 (투표 포함)
│   ├── PasswordForm.tsx      # 비밀번호 등록 폼
│   ├── ReviewSection.tsx     # 리뷰 섹션
│   ├── ReviewCard.tsx        # 리뷰 카드
│   └── ReviewSummary.tsx     # 리뷰 요약 통계
├── hooks/
│   └── useGeolocation.ts     # GPS 위치 훅
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트
│   ├── supabase-server.ts    # Supabase 서버 클라이언트
│   ├── rate-limit.ts         # IP 기반 Rate Limiting
│   ├── local-actions.ts      # localStorage 중복 방지
│   └── constants.ts          # 상수 정의
└── types/
    └── index.ts              # TypeScript 타입 정의
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/buildings` | 지도 영역 내 건물 목록 조회 |
| POST | `/api/buildings` | 건물 등록 (주소 기반 upsert) |
| GET | `/api/buildings/[id]/toilets` | 건물 내 화장실 목록 조회 |
| POST | `/api/buildings/[id]/toilets` | 화장실 등록 |
| GET | `/api/buildings/[id]/passwords` | 건물 비밀번호 목록 조회 |
| POST | `/api/buildings/[id]/passwords` | 비밀번호 등록 |
| GET | `/api/buildings/[id]/reviews` | 리뷰 조회 (요약 포함) |
| POST | `/api/buildings/[id]/reviews` | 리뷰 등록 |
| POST | `/api/passwords/[id]/vote` | 비밀번호 맞아요/틀려요 투표 |
