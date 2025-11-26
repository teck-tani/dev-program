// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',

  // 🔽 정적 자원 경로 수정 (이전 단계에서 이미 추가)
  assetPrefix: '/dev-program/',

  // 🔽 Next.js 내부 라우팅 경로 수정 (다시 추가)
  basePath: '/dev-program',
};

export default nextConfig;