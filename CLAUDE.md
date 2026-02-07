# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Work Tracking

**반드시 `WORK_LOG.md`를 매 세션 시작 시 읽고, 작업 완료 시 업데이트할 것.**
- `WORK_LOG.md` - 전체 도구 현황, 진행중/완료 작업, 버그, 아이디어 기록


## Project Overview

**teck-tani.com** - A Korean/English bilingual utility web tools collection (online calculator, clock, encoder, converter, etc.)

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Framework & Stack
- **Next.js 16** with App Router
- **Tailwind CSS 4** for styling
- **next-intl** for i18n (Korean/English)
- **TypeScript**

### Routing & Locales
- All pages under `src/app/[locale]/` - URL pattern: `/ko/tool-name`, `/en/tool-name`
- Supported locales: `ko` (default), `en`
- Locale config in `src/navigation.ts`

### Adding a New Tool

1. **Create page directory**: `src/app/[locale]/[tool-name]/`
   - `page.tsx` - Server component with metadata, SEO, JSON-LD schemas
   - `[ToolName]Client.tsx` - Client component with `"use client"` directive

2. **Page template pattern** (see `base64-encoder/page.tsx`):
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

3. **Add translations** in `messages/ko.json` and `messages/en.json`:
   - `Index.tools.[toolKey]` - Tool name for homepage cards
   - `[ToolName].meta.*` - SEO metadata (title, description, keywords, ogTitle, ogDescription)
   - `[ToolName].*` - All UI text

4. **Add to Header menu**: `src/components/Header.tsx` → `menuCategories` array
   - Categories: `calculators`, `time`, `utilities`

5. **Optional: Add to homepage**: `src/app/[locale]/page.tsx` → `toolCategories` array

### Key Files
- `src/navigation.ts` - Locale routing setup, exports `Link`, `locales`
- `src/i18n/request.ts` - next-intl config, loads messages
- `src/components/Header.tsx` - Navigation menu with `menuCategories`
- `messages/ko.json`, `messages/en.json` - All translations
- `src/app/sitemap.ts` - Dynamic sitemap generation

### Translation Pattern
```typescript
// Server component
const t = await getTranslations({ locale, namespace: 'ToolName' });

// Client component
const t = useTranslations('ToolName');
t('keyName')           // Simple key
t.raw('htmlContent')   // For HTML content (use with dangerouslySetInnerHTML)
```

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
