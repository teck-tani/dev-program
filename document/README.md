# Tani DevTool

Korean/English bilingual utility web tools collection (online calculator, clock, encoder, converter, etc.)

- Production: https://teck-tani.com

## Quick Start

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 3. 프로덕션 빌드

```bash
npm run build
```

### 4. 프로덕션 서버 실행

```bash
npm run start
```

## Commands

| 명령어 | 설명 |
|--------|------|
| `npm install` | 의존성 패키지 설치 |
| `npm run dev` | 개발 서버 실행 (http://localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 코드 검사 |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **i18n**: next-intl (Korean/English)
- **Language**: TypeScript

## Project Structure

```
src/
├── app/
│   └── [locale]/           # 다국어 페이지 (ko, en)
│       ├── page.tsx        # 메인 페이지
│       ├── calculator/     # 계산기
│       ├── clock/          # 시계
│       └── ...             # 기타 도구들
├── components/             # 공통 컴포넌트
│   ├── Header.tsx          # 헤더 네비게이션
│   └── ToolCard.tsx        # 도구 카드
└── navigation.ts           # 라우팅 설정
messages/
├── ko.json                 # 한국어 번역
└── en.json                 # 영어 번역
```

## Deployment

Vercel에 자동 배포됩니다. `main` 브랜치에 push하면 자동으로 배포가 진행됩니다.

### 배포 전 체크리스트

```bash
# 1. 린트 검사
npm run lint

# 2. 빌드 테스트
npm run build

# 3. 커밋 & 푸시
git add .
git commit -m "커밋 메시지"
git push
```

## Troubleshooting

### 빌드 오류: Module not found

패키지가 설치되지 않은 경우:
```bash
npm install [패키지명]
```

### 타입 오류

TypeScript 타입 오류 발생 시:
```bash
# 타입 체크
npx tsc --noEmit
```

### 캐시 문제

빌드 캐시 문제 발생 시:
```bash
# Next.js 캐시 삭제 (Windows)
rmdir /s /q .next

# Next.js 캐시 삭제 (Mac/Linux)
rm -rf .next

# node_modules 재설치
rmdir /s /q node_modules   # Windows
rm -rf node_modules        # Mac/Linux
npm install
```

### 포트 충돌

3000 포트가 이미 사용 중인 경우:
```bash
# 다른 포트로 실행
npm run dev -- -p 3001
```
