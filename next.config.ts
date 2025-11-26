// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',

  // 🔽 assetPrefix만 남기고 basePath는 제거합니다.
  assetPrefix: '/dev-program/',

  // basePath는 완전히 제거
};

export default nextConfig;