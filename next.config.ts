// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',

  // 🔽 assetPrefix와 basePath 설정을 모두 제거합니다.
  // 이 두 필드는 이제 없어야 합니다.
};

export default nextConfig;