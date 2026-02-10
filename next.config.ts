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
  // React Icons 등 무거운 라이브러리의 임포트 최적화
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  compress: true,
  redirects: async () => [
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