// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',

  // 🔽 assetPrefix를 다시 추가합니다. (저장소명 포함)
  assetPrefix: '/dev-program/',

  // 🔽 trailingSlash: true를 추가하여 정적 자원의 경로 처리를 명확하게 합니다.
  trailingSlash: true,

  // basePath는 계속 제거합니다.
};

export default nextConfig;