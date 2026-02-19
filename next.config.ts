import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // 무거운 라이브러리의 배럴 파일 임포트 최적화
  experimental: {
    optimizePackageImports: ['react-icons', 'mathjs', 'recharts'],
  },
  poweredByHeader: false,
  compress: true,
  redirects: async () => [
    // === 레거시 URL 리다이렉트 (다국어 전환 이전 경로) ===
    // bare path (locale 없음) → /ko/ 기본
    {
      source: '/pay-cal',
      destination: '/ko/dutch-pay',
      permanent: true,
    },
    {
      source: '/clock/timer',
      destination: '/ko/timer',
      permanent: true,
    },
    {
      source: '/spell-checker',
      destination: '/ko',
      permanent: true,
    },
    {
      source: '/lotto',
      destination: '/ko/lotto-generator',
      permanent: true,
    },
    // locale-prefixed 레거시 경로 → 올바른 경로로 301
    {
      source: '/:locale(ko|en)/pay-cal',
      destination: '/:locale/dutch-pay',
      permanent: true,
    },
    {
      source: '/:locale(ko|en)/clock/timer',
      destination: '/:locale/timer',
      permanent: true,
    },
    {
      source: '/:locale(ko|en)/spell-checker',
      destination: '/:locale',
      permanent: true,
    },
    {
      source: '/:locale(ko|en)/lotto',
      destination: '/:locale/lotto-generator',
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: '/:all*(svg|jpg|png)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};

export default withNextIntl(nextConfig);