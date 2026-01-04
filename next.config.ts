import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // 프로덕션 빌드 시 콘솔 로그 제거하여 스크립트 용량 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // 이미지 최적화 (WebP, AVIF 자동 변환)
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // 빌드 성능을 위해 나머지 기본값은 Next.js가 알아서 처리하도록 둡니다.
};

export default withNextIntl(nextConfig);