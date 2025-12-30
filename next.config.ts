// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export',  <-- 이 부분을 제거하거나 주석 처리합니다.
};

export default withNextIntl(nextConfig);