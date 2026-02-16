# FINALIZED_TOOLS.md — 수정 완료된 도구 목록

> **이 파일에 등록된 도구는 수정 금지.**
> 사용자가 직접 검수하여 최종 확정한 도구이므로, Claude는 이 도구들의 코드/번역/SEO를 변경하지 않는다.
> 버그 수정이나 변경이 필요할 경우 사용자가 명시적으로 요청해야만 수정 가능.

---

## 확정 도구 목록 (총 4개)

### 계산기 (2개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 공학용 계산기 | /calculator | 2026-02-12 | 기본+공학 계산, 히스토리, 키보드 입력 |
| 2 | 퇴직금 계산기 | /severance-calculator | 2026-02-17 | 퇴직금+세금+DC연금, 월급/3개월 토글, 날짜자동포맷+달력, 결과복사/인쇄 |

### 유틸리티 (1개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 바코드 생성기 | /barcode | 2026-02-12 | 다중 형식, 대량생성, 설정 영속화 |

### 텍스트 (1개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 글자수 세기 | /character-counter | 2026-02-14 | 목표 글자수, UTF-8/EUC-KR 바이트, SNS 제한, 키워드 분석 |

---

## 규칙

1. **코드 수정 금지**: `src/app/[locale]/calculator/`, `src/app/[locale]/barcode/`, `src/app/[locale]/character-counter/`, `src/app/[locale]/severance-calculator/` 하위 파일 수정 불가
2. **번역 수정 금지**: `messages/ko.json`, `messages/en.json` 내 해당 도구 번역 키 수정 불가
   - Calculator: `Calculator.*`, `Index.tools.calculator`
   - Barcode: `Barcode.*`, `Index.tools.barcode`
   - CharacterCounter: `CharacterCounter.*`, `Index.tools.characterCounter`
   - SeveranceCalculator: `SeveranceCalculator.*`, `Index.tools.severanceCalculator`
3. **SEO 수정 금지**: 해당 도구의 `page.tsx` 내 JSON-LD, 메타데이터 수정 불가
4. **예외**: 사용자가 명시적으로 "이 도구 수정해" 라고 요청한 경우에만 수정 가능


