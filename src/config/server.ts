import 'server-only';

// ============================================
// 서버 전용 설정 (API Keys)
// 클라이언트에서 import 시 빌드 오류 발생
// ============================================

export const SERVER_KEYS = {
    // 한국수출입은행 환율 API
    KOREA_EXIM: '9sYd8MjKwbfdZlFzlmcMH8FCQlvYMxBF',
    // 공공데이터포털 한국천문연구원 특일 정보 API
    HOLIDAY: 'dc26e812ba17da8c95a6d4bb4ad961dd5613bf971275823e400bb3679ed46037',
} as const;
