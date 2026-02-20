import KoreanLunarCalendar from "korean-lunar-calendar";

const cal = new KoreanLunarCalendar();

/**
 * 음력 → 양력 변환
 * @returns YYYY-MM-DD string or null if invalid
 */
export function lunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth = false
): string | null {
  try {
    cal.setLunarDate(year, month, day, isLeapMonth);
    const s = cal.getSolarCalendar();
    return `${s.year}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`;
  } catch {
    return null;
  }
}

/**
 * 양력 → 음력 변환
 * @returns { year, month, day, isLeapMonth } or null if invalid
 */
export function solarToLunar(
  year: number,
  month: number,
  day: number
): { year: number; month: number; day: number; isLeapMonth: boolean } | null {
  try {
    cal.setSolarDate(year, month, day);
    const l = cal.getLunarCalendar();
    return {
      year: l.year,
      month: l.month,
      day: l.day,
      isLeapMonth: l.intercalation ?? false,
    };
  } catch {
    return null;
  }
}

/**
 * 음력 날짜의 올해/내년 양력 날짜 계산 (프리셋용)
 */
export function getNextSolarDate(
  lunarMonth: number,
  lunarDay: number,
  referenceDate: Date
): string | null {
  const thisYear = referenceDate.getFullYear();
  // 올해 날짜 먼저 시도
  const thisYearSolar = lunarToSolar(thisYear, lunarMonth, lunarDay);
  if (thisYearSolar && new Date(thisYearSolar) >= referenceDate) {
    return thisYearSolar;
  }
  // 올해가 지났으면 내년
  return lunarToSolar(thisYear + 1, lunarMonth, lunarDay);
}
