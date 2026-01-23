# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
Each tool page should include:
- `generateMetadata()` with title, description, keywords, OpenGraph, Twitter cards
- JSON-LD structured data (FAQPage, HowTo, WebApplication schemas)
- Proper `alternates.languages` for ko/en
