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
    optimizePackageImports: ['react-icons', 'pdf-lib', 'jszip', 'html2canvas', 'sql-formatter'],
  },
  poweredByHeader: false,
  compress: true,
  redirects: async () => [
    // === 레거시 URL 리다이렉트 ===
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
    // === 시계 도구 → clock-tani.com으로 리다이렉트 ===
    {
      source: '/clock',
      destination: 'https://clock-tani.com/ko/clock',
      permanent: true,
    },
    {
      source: '/clock/timer',
      destination: 'https://clock-tani.com/ko/timer',
      permanent: true,
    },
    {
      source: '/:locale(ko|en)/clock',
      destination: 'https://clock-tani.com/:locale/clock',
      permanent: true,
    },
    {
      source: '/:locale(ko|en)/stopwatch',
      destination: 'https://clock-tani.com/:locale/stopwatch',
      permanent: true,
    },
    {
      source: '/:locale(ko|en)/timer',
      destination: 'https://clock-tani.com/:locale/timer',
      permanent: true,
    },
    {
      source: '/:locale(ko|en)/alarm',
      destination: 'https://clock-tani.com/:locale/alarm',
      permanent: true,
    },
    {
      source: '/:locale(ko|en)/server-time',
      destination: 'https://clock-tani.com/:locale/server-time',
      permanent: true,
    },
    {
      source: '/:locale(ko|en)/dday-counter',
      destination: 'https://clock-tani.com/:locale/dday-counter',
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: '/:all*(svg|jpg|png|webp|gif|ico|woff|woff2)',
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
