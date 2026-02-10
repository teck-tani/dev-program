// ============================================
// teck-tani.com 프로젝트 설정
// ============================================

// --- API Keys ---
export const API_KEYS = {
  KOREA_EXIM: "9sYd8MjKwbfdZlFzlmcMH8FCQlvYMxBF", // 한국수출입은행 환율 API
} as const;

// --- Database ---
export const DB = {
  // TODO: DB 연결 시 설정 추가
  // HOST: "",
  // PORT: 5432,
  // NAME: "",
  // USER: "",
  // PASSWORD: "",
} as const;

// --- External API URLs ---
export const API_URLS = {
  KOREA_EXIM: "https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON",
} as const;

// --- Google Analytics ---
export const GA_ID = "G-4K4035NP84";
