// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',

  // 🔽 이 부분을 추가합니다.
  // GitHub Pages 저장소 이름에 맞게 모든 정적 자원의 경로를 수정합니다.
  basePath: '/dev-program',
  // Next.js 13+에서는 assetPrefix 대신 basePath를 사용하는 것이 권장됩니다.
};

export default nextConfig;