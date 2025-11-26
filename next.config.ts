// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',

  // 🔽 basePath를 제거하고, assetPrefix를 사용하여 정적 자원 경로만 수정합니다.
  assetPrefix: '/dev-program/', // 저장소 이름을 슬래시(/)로 닫아서 입력합니다.

  // basePath는 제거합니다. (주석 처리하거나 삭제)
  // basePath: '/dev-program', 
};

export default nextConfig;