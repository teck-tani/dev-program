# FINALIZED_TOOLS.md — 수정 완료된 도구 목록

> **이 파일에 등록된 도구는 수정 금지.**
> 사용자가 직접 검수하여 최종 확정한 도구이므로, Claude는 이 도구들의 코드/번역/SEO를 변경하지 않는다.
> 버그 수정이나 변경이 필요할 경우 사용자가 명시적으로 요청해야만 수정 가능.

---

## 확정 도구 목록 (총 9개)

### 계산기 (4개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 공학용 계산기 | /calculator | 2026-02-12 | 기본+공학 계산, 히스토리, 키보드 입력 | 블로그
| 2 | 퇴직금 계산기 | /severance-calculator | 2026-02-17 | 퇴직금+세금+DC연금, 월급/3개월 토글, 날짜자동포맷+달력, 결과복사/인쇄 |
| 3 | 이자 계산기 | /interest-calculator | 2026-02-18 | 예금/적금, 단리/복리, 세금3종, 중도해지 시뮬레이션, 목표금액 역산, 월별상세 | 블로그 미작성
| 4 | 월급 계산기 | /salary-calculator | 2026-02-19 | 연봉/월급/역산 3모드, 실시간 자동계산, 국민연금 상한(590만), 도넛차트, 컴팩트 UI | 블로그 미작성

### 시간 (1개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 온라인 시계 | /clock | 2026-02-18 | 디지털/아날로그 모드, 24h/12h 전환(AM/PM), 세계시계 70+도시, 타임존 약어(KST/JST/EST), DST 표시, 드래그앤드롭, 주차 표시, 전체화면, 스톱워치/타이머/알람 연동 |

### 변환 (1개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | Base64 변환기 | /base64-encoder | 2026-02-18 | 텍스트/파일 인코딩·디코딩, URL-safe, 드래그앤드롭, 결과 복사 |

### 유틸리티 (2개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 바코드 생성기 | /barcode | 2026-02-12 | 다중 형식, 대량생성, 설정 영속화 |
| 2 | 로또 번호 생성기 | /lotto-generator | 2026-02-17 | 물리시뮬레이션 애니메이션, 고정/제외번호, 멀티세트, 통계, API연동 |

### 텍스트 (1개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 글자수 세기 | /character-counter | 2026-02-14 | 목표 글자수, UTF-8/EUC-KR 바이트, SNS 제한, 키워드 분석 | 블로그

---

## 규칙

1. **코드 수정 금지**: `src/app/[locale]/calculator/`, `src/app/[locale]/barcode/`, `src/app/[locale]/character-counter/`, `src/app/[locale]/severance-calculator/`, `src/app/[locale]/lotto-generator/`, `src/app/[locale]/base64-encoder/`, `src/app/[locale]/interest-calculator/`, `src/app/[locale]/salary-calculator/` 하위 파일 수정 불가
2. **번역 수정 금지**: `messages/ko.json`, `messages/en.json` 내 해당 도구 번역 키 수정 불가
   - Calculator: `Calculator.*`, `Index.tools.calculator`
   - Barcode: `Barcode.*`, `Index.tools.barcode`
   - CharacterCounter: `CharacterCounter.*`, `Index.tools.characterCounter`
   - SeveranceCalculator: `SeveranceCalculator.*`, `Index.tools.severanceCalculator`
   - Lotto: `Lotto.*`, `Index.tools.lottoGenerator`
   - Base64Encoder: `Base64Encoder.*`, `Index.tools.base64Encoder`
   - InterestCalculator: `InterestCalculator.*`, `Index.tools.interestCalculator`
   - PayCal: `PayCal.*`, `Index.tools.salaryCalculator`
3. **SEO 수정 금지**: 해당 도구의 `page.tsx` 내 JSON-LD, 메타데이터 수정 불가
4. **예외**: 사용자가 명시적으로 "이 도구 수정해" 라고 요청한 경우에만 수정 가능


