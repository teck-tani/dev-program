# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Work Tracking

**반드시 `document/WORK_LOG.md`를 매 세션 시작 시 읽고, 작업 완료 시 업데이트할 것.**
- `document/WORK_LOG.md` - 전체 도구 현황, 진행중/완료 작업, 버그, 아이디어 기록

## Finalized Tools (수정 금지)

**`document/FINALIZED_TOOLS.md`에 등록된 도구는 절대 수정하지 말 것.**
- 사용자가 직접 검수 완료한 도구 → 코드/번역/SEO 일체 변경 금지
- 수정은 사용자가 명시적으로 요청한 경우에만 허용

## Project Overview

**teck-tani.com** - Korean/English bilingual utility web tools collection (56 tools across 6 categories). Deployed on Vercel.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured (Playwright dev dependency exists but no config).

## Architecture

### Framework & Stack
- **Next.js 16** with App Router (SSG via `generateStaticParams` + `force-static`)
- **React 19**
- **Tailwind CSS 4** for styling
- **next-intl** for i18n (Korean/English)
- **TypeScript** (strict mode, path alias `@/*` → `./src/*`)

### Routing & Locales
- All pages under `src/app/[locale]/` - URL pattern: `/ko/tool-name`, `/en/tool-name`
- Supported locales: `ko` (default), `en` — `localePrefix: 'always'`
- Locale config in `src/navigation.ts`
- `src/middleware.ts` converts 307 redirects to 301 for SEO, handles locale detection

### Tool Registry — Single Source of Truth
**`src/config/tools.ts`** is the central registry for all 56 tools.
- `ALL_TOOLS` array defines every tool's `href`, `labelKey`, `icon`, `category`
- 6 categories: `calculators`, `time`, `image`, `text`, `life`, `devtools`
- Exports: `getToolsByCategory()`, `getCategoriesWithTools()`, `findToolByPathname()`, `getAllToolHrefs()`
- Header, homepage, and sitemap all derive from this file

### Adding a New Tool

1. **Add to tool registry**: `src/config/tools.ts` → `ALL_TOOLS` array (href, labelKey, icon, category)

2. **Create page directory**: `src/app/[locale]/[tool-name]/`
   - `page.tsx` - Server component with metadata, SEO, JSON-LD schemas
   - `[ToolName]Client.tsx` - Client component with `"use client"` directive

3. **Page template pattern** (see `base64-encoder/page.tsx`):
   ```typescript
   export function generateStaticParams() {
     return locales.map((locale) => ({ locale }));
   }
   export const dynamic = 'force-static';
   export const revalidate = false;

   export async function generateMetadata(props) {
     // Use getTranslations with namespace '[ToolName].meta'
   }
   ```

4. **Add translations** in `messages/ko.json` and `messages/en.json`:
   - `Index.tools.[toolKey]` - Tool name for homepage cards
   - `[ToolName].meta.*` - SEO metadata (title, description, keywords, ogTitle, ogDescription)
   - `[ToolName].*` - All UI text

5. **Verify Header/homepage**: Tools appear in Header menu and homepage automatically via `src/config/tools.ts` categories.

6. **GitHub 공개 저장소 업데이트**: `https://github.com/teck-tani/teck-tani.com` README.md에 새 도구 추가
   - 해당 카테고리 테이블에 한국어 도구명 + `/ko/` 링크 추가 후 push

### Key Files
- `src/config/tools.ts` - **Central tool registry** (ALL_TOOLS, categories, lookup helpers)
- `src/config/index.ts` - API URLs, GA ID, DB config
- `src/config/server.ts` - API keys (server-only import)
- `src/navigation.ts` - Locale routing setup, exports `Link`, `locales`
- `src/middleware.ts` - i18n middleware with 301 redirect optimization
- `src/i18n/request.ts` - next-intl config, loads messages
- `src/components/Header.tsx` - Navigation with mobile drawer, fullscreen toggle, settings
- `src/contexts/ThemeContext.tsx` - Dark/light theme (localStorage + `data-theme` attribute on body)
- `messages/ko.json`, `messages/en.json` - All translations (~560KB ko, ~500KB en)
- `src/app/globals.css` - Global styles including `.seo-*` classes (~53KB)
- `src/app/sitemap.ts` - Dynamic sitemap generation (derives from `getAllToolHrefs()`)

### Layout Provider Chain (`src/app/[locale]/layout.tsx`)
```
NextIntlClientProvider → ThemeProvider → PWARegister + LazyGTM + GoogleAdsense + FeedbackButton
```
Layout only loads `Common`, `Index`, `Header`, `Footer` message namespaces (~6KB) to avoid sending full translation files to client.

### Translation Pattern
```typescript
// Server component
const t = await getTranslations({ locale, namespace: 'ToolName' });

// Client component
const t = useTranslations('ToolName');
t('keyName')           // Simple key
t.raw('htmlContent')   // For HTML content (use with dangerouslySetInnerHTML)
```

### Theme System
- `ThemeContext.tsx` stores theme in `localStorage.globalTheme`
- Applies `data-theme="dark"` or `data-theme="light"` on `<body>`
- CSS targets: `body[data-theme="dark"] .seo-card { ... }`
- Prevents hydration mismatch with mount check

### API Routes (`src/app/api/`)
- `/api/exchange-rate` + `/api/exchange-rate/history` - Korea Exim Bank exchange rates
- `/api/lotto` + `/api/lotto/update` - Lottery number data
- `/api/holidays` - Korean public holidays
- `/api/ip-info` - IP geolocation proxy
- `/api/server-time` - Server timestamp

### UI Layout Rules
- **제목은 헤더(Header)에만 표시** — 본문(page.tsx)에 별도의 제목(h1)/부제를 넣지 않는다. 헤더 컴포넌트가 이미 도구명을 보여주므로 중복 금지.
- 모바일에서는 헤더가 도구명을 짧게 표시하고, 데스크톱에서는 전체 제목을 표시한다.

### SEO Requirements

#### Meta & JSON-LD (in `page.tsx`)
- `generateMetadata()` with title, description, keywords, OpenGraph, Twitter cards
- JSON-LD structured data: **FAQPage**, **HowTo**, **WebApplication** schemas
- Proper `alternates.languages` for ko/en

#### SEO Bottom Content Template
모든 도구 페이지 하단(위젯 아래)에 아래 섹션들을 포함할 것.
참고 모델: `calculator/page.tsx`, `stopwatch/page.tsx`

**[필수 — 모든 페이지]**
1. **도구 설명** (What is this?) — 이 도구가 무엇이며 어떤 문제를 해결하는지 1~2문단
2. **주요 기능** (Key Features) — 핵심 기능 3~6개를 카드형/리스트로 간결하게
3. **사용법** (How to Use) — 3~6단계 가이드 → HowTo JSON-LD와 내용 일치시킬 것
4. **활용 예시** (Use Cases) — 실제 활용 시나리오 3~6개 (아이콘+제목+설명)
5. **FAQ** — 자주 묻는 질문 4~8개 → FAQPage JSON-LD와 내용 일치시킬 것
6. **개인정보 안내** (Privacy Notice) — "데이터는 브라우저(localStorage)에만 저장되며 서버로 전송되지 않습니다" 1문단

**[선택 — 도구 특성에 따라]**
7. **유의사항/팁** — 정밀도 한계, 모바일 제한사항, 주의점 등

**규칙:**
- 모든 텍스트는 `messages/ko.json`, `messages/en.json`에 번역 키로 관리 (하드코딩 금지)
- HTML이 필요한 경우 `t.raw()` + `dangerouslySetInnerHTML` 패턴 사용
- `<article>` 태그로 감싸서 시맨틱 HTML 유지
- 공통 `.seo-*` CSS 클래스 사용 (`globals.css` 정의, 다크모드 자동 대응)

### Performance Optimizations (in `next.config.ts`)
- `optimizePackageImports` for `react-icons`, `mathjs`, `recharts`, `pdf-lib`, `jszip`, etc.
- Asset caching: 1-year `Cache-Control` headers for static files
- Image optimization: AVIF & WebP formats
- Production console.log removal
- Legacy URL 301 redirects: `/pay-cal` → `/dutch-pay`, `/lotto` → `/lotto-generator`, `/clock/timer` → `/timer`
