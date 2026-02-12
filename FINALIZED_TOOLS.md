# FINALIZED_TOOLS.md — 수정 완료된 도구 목록

> **이 파일에 등록된 도구는 수정 금지.**
> 사용자가 직접 검수하여 최종 확정한 도구이므로, Claude는 이 도구들의 코드/번역/SEO를 변경하지 않는다.
> 버그 수정이나 변경이 필요할 경우 사용자가 명시적으로 요청해야만 수정 가능.

---

## 확정 도구 목록

| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 공학용 계산기 | /calculator | 2026-02-12 | 기본+공학 계산, 히스토리, 키보드 입력 |
| 2 | 바코드 생성기 | /barcode | 2026-02-12 | 다중 형식, 대량생성, 설정 영속화 |

---

## 규칙

1. **코드 수정 금지**: `src/app/[locale]/calculator/`, `src/app/[locale]/barcode/` 하위 파일 수정 불가
2. **번역 수정 금지**: `messages/ko.json`, `messages/en.json` 내 해당 도구 번역 키 수정 불가
   - Calculator: `Calculator.*`, `Index.tools.calculator`
   - Barcode: `Barcode.*`, `Index.tools.barcode`
3. **SEO 수정 금지**: 해당 도구의 `page.tsx` 내 JSON-LD, 메타데이터 수정 불가
4. **예외**: 사용자가 명시적으로 "이 도구 수정해" 라고 요청한 경우에만 수정 가능
