// ============================================
// teck-tani.com 프로젝트 설정
// ============================================

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
  // 공공데이터포털 한국천문연구원 특일 정보 (getRestDeInfo: 공휴일+대체공휴일)
  HOLIDAY: "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo",
} as const;

// --- Google Analytics ---
export const GA_ID = "G-4K4035NP84";
