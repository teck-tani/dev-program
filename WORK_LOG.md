# WORK_LOG.md

> 이 파일은 Claude Code가 세션 간 작업 진행상황을 기억하기 위한 파일입니다.
> git에 커밋되므로 집/회사 어디서든 동일한 컨텍스트를 공유합니다.

---

## 전체 도구 목록 & 현황 (32개 도구)

| # | 도구 | 경로 | 현재 수준 | 핵심 개선사항 |
|---|------|------|-----------|-------------|
| 1 | 공학용 계산기 | calculator | A- | Tier 1~3 업그레이드 완료. 경쟁사 대비 상위 2~3위권 |
| 2 | 이자 계산기 | interest-calculator | B | GrowthChart i18n 버그, 세금옵션 3가지 필요, 월별 내역표 |
| 3 | 연봉 계산기 | salary-calculator | B | 소득세율 5단계→8단계, 기준연도 미표시, 연간 실수령 미표시 |
| 4 | 퇴직금 계산기 | severance-calculator | B- | 계산과정 미표시, 퇴직소득세 미계산, 날짜입력 UX |
| 5 | 나이 계산기 | korean-age-calculator | B | 상세나이(년/월/일) 미표시, 별자리, 만나이통일법 설명 |
| 6 | 더치페이 | dutch-pay | C+ | **결과 공유/복사 전혀 없음(치명적)**, 비균등분할, 항목별 정산 |
| 7 | 배란일 계산기 | ovulation-calculator | B- | locale 버그, 단일주기만 표시, 생리기간 입력 없음 |
| 8 | 세계시계 | clock | A- | 시간대비교 슬라이더, 24h 타임라인바, 도시DB 확대 |
| 9 | 스톱워치 | stopwatch | A- | 탭 제목 시간표시, 전체화면, 랩 그래프 |
| 10 | 타이머 | timer | D+ | **프리셋 없음, 프로그레스바 없음, 탭제목 없음, 포모도로 없음** |
| 11 | 환율 계산기 | money-converter | B+ | 환율 차트 구현완료(recharts), 전일대비 변동, API키 환경변수 이동완료 |
| 12 | 단위 변환기 | unit-converter | D+ | **카테고리 4개뿐(경쟁사 20+)**, 한국단위(평/근) 없음, 다크모드 미지원 |
| 13 | 파일사이즈 변환기 | file-size-converter | B+ | 이진/십진 구분, 전송시간 계산 |
| 14 | 색상 변환기 | color-converter | B- | CMYK 없음, RGBA 없음, 대비비율 체크 없음 |
| 15 | JSON 포맷터 | json-formatter | C+ | Syntax Highlighting 없음, Tree View 없음, 파일 업로드 없음 |
| 16 | SQL 포맷터 | sql-formatter | C+ | 자체구현 엔진 품질이슈, Dialect 미지원, Highlighting 없음 |
| 17 | Base64 인코더 | base64-encoder | B | 실시간 변환, 이미지 미리보기, 드래그앤드롭 |
| 18 | URL 인코더 | url-encoder | B | 실시간 변환, URL 파서, 이중인코딩 감지 |
| 19 | Cron 생성기 | cron-generator | C | **다음 실행시간 표시 없음(핵심기능 누락)**, 6-field 미지원 |
| 20 | IP 주소 조회 | ip-address | B- | 임의 IP/도메인 조회 불가, IPv6 미지원 |
| 21 | 텍스트 비교 | text-diff | C+ | Side-by-Side 뷰 없음, Character-level diff 없음 |
| 22 | QR 생성기 | qr-generator | C+ | QR 유형(Wi-Fi,vCard) 없음, 로고삽입 불가, SVG 미지원 |
| 23 | 바코드 생성기 | barcode | B | PC 다운로드 없음, 크기 커스터마이징, i18n 버그 |
| 24 | 로또 생성기 | lotto-generator | B | 다중세트, 제외번호, 당첨확인, 공유 |
| 25 | 사다리 게임 | ladder-game | B- | 개별선택 모드, 캔버스 반응형, 프리셋 |
| 26 | 유튜브 썸네일 | youtube-thumbnail | B | 해상도 표시, 동영상 정보, 라이트박스 |
| 27 | 특수문자 | special-characters | D | **이모지만 있음, 실제 특수문자 없음(페이지명과 불일치)** |
| 28 | 글자수 세기 | character-counter | B | 읽기시간, SNS 가이드, 키워드분석 |
| 29 | 맞춤법 검사 | spell-checker | F | **11개 패턴 하드코딩, 사실상 작동 안함. API 연동 필수** |
| 30 | 이미지 압축 | image-compressor | B- | JPEG만 출력, PNG 투명도 손실 무경고, 비교뷰 없음 |
| 31 | PDF 관리 | pdf-manager | C | 병합/분할만(경쟁사 20+ 기능), 페이지 미리보기 없음 |
| 32 | 통화쌍 페이지 | money-converter/[pair] | B | 환율 차트 미구현 |

---

## 긴급 버그 (즉시 수정 필요)

1. ~~**[Calculator]** FAQ에 "키보드 지원" 명시되어 있으나 실제 미구현~~ ✅ 해결 (키보드 완전 지원)
2. **[Interest Calculator]** GrowthChart 범례 "원금", "이자 수익" 한국어 하드코딩 → 영어 페이지에서도 한국어 표시
3. **[Ovulation Calculator]** locale을 `document.documentElement.lang`으로 감지 → `useLocale()` 사용해야 함
4. **[Salary Calculator]** 소득세율 5단계만 구현(8단계 필요, 최고 45% 누락)
5. **[Barcode]** 모바일 다운로드 버튼 "다운로드" 한국어 하드코딩
6. **[Image Compressor]** PNG 투명도 손실 시 사용자 경고 없음 (데이터 손상)
7. **[Exchange Rate]** API 키 소스코드 하드코딩 (보안 이슈)
8. **[Sitemap]** text-diff, ladder-game, cron-generator 누락
9. **[Spell Checker]** 홈페이지/Header/Sitemap 어디에도 등록 안됨
10. **[Footer]** 저작권 연도 2024 고정

---

## 사이트 공통 개선사항

### SEO 긴급
- sitemap 누락 도구 3개 추가
- JSON-LD 누락 4개 페이지 추가 (character-counter, image-compressor, pdf-manager, spell-checker)
- 홈페이지 WebSite + ItemList JSON-LD 추가
- OG 이미지 전체 없음

### UX 공통
- 도구 검색 기능 없음 (30개+ 도구인데)
- 최근 사용 / 즐겨찾기 기능 없음
- 데스크톱 상단 네비게이션 없음 (햄버거만)
- Header aria-label 한국어 하드코딩
- 도구 목록 5곳 산재 → 단일 config로 통합 필요

### 구조
- 유틸리티 카테고리 17개 과다 → 세분화 필요
- Footer에 도구 링크/About/Privacy 없음
- Breadcrumb 없음

---

## 우선순위별 작업 TODO

### Phase 1: 긴급 버그 수정 (1-2일) ✅ 완료
- [x] Calculator 키보드 입력 지원 추가 (0-9, +-*/, Enter, Backspace, Esc)
- [x] Interest Calculator GrowthChart i18n 수정 (chartPrincipal, chartInterest 키 추가)
- [x] Ovulation Calculator locale 버그 수정 (document.documentElement.lang → useLocale())
- [x] Barcode 다운로드 버튼 i18n 수정 (ko/en download 키 추가)
- [x] Sitemap 누락 도구 4개 추가 (text-diff, ladder-game, cron-generator, spell-checker)
- [x] Spell Checker Header 등록 + 번역 전체 추가 (meta, input, result, common, why 섹션)
- [x] Exchange Rate API 키 환경변수로 이동 (.env.local + process.env.EXCHANGE_RATE_API_KEY)
- [x] Footer 저작권 연도 동적 변경 (new Date().getFullYear() + {year} 플레이스홀더)
- [x] Salary Calculator 소득세율 8단계 보완 (5→8단계, 최고 45%, 누진공제액 수정)

### Phase 2: 핵심 기능 추가 - 가장 약한 도구 개선 (3-5일) ✅ 완료
- [x] Timer: 프리셋 버튼(1m~1h), 원형 SVG 프로그레스바, 탭 제목 업데이트, Notification API
- [x] Unit Converter: 8개 카테고리(면적/부피/데이터/시간 추가), 한국단위(평/근/리), 다크모드
- [x] Special Characters: 6개 특수문자 카테고리(수학/화살표/통화/문장/기술/선) ~160개, 검색 기능
- [x] Cron Generator: 다음 5회 실행시간 표시 (커스텀 파서 구현)
- [x] Dutch Pay: 결과 텍스트 복사 + Web Share API (클립보드 fallback)
- [x] Calculator: 결과 복사 기능 (LuCopy/LuCheck 아이콘)

### Phase 3: 경쟁력 강화 (5-10일)
- [x] Calculator: Tier 1~3 전면 업그레이드 (키보드, 복사, +/-, |x|, 1/x, ANS, EXP, 괄호카운터, sinh/cosh/tanh, mod, cbrt, x³)
- [x] Exchange Rate: 환율 추이 차트 (recharts, history API 활용)
- [ ] JSON Formatter: Syntax Highlighting + Tree View
- [ ] Text Diff: Side-by-Side View + Character-level diff
- [ ] Image Compressor: 출력포맷 선택(WebP), PNG 투명도 경고, 비교뷰
- [ ] Interest Calculator: 세금옵션 3가지, 월별 상세내역
- [ ] Salary Calculator: 연간 실수령, 기준연도 표시, 월급 입력 모드
- [ ] QR Generator: Wi-Fi/vCard 유형, SVG 다운로드, 로고 삽입

### Phase 4: 사이트 전체 UX (3-5일)
- [ ] 홈페이지 도구 검색 기능
- [ ] 인기 도구 섹션 활성화
- [ ] 도구 목록 단일 config 통합
- [ ] 데스크톱 상단 네비게이션
- [ ] Breadcrumb 추가
- [ ] SEO: JSON-LD 누락 보완, OG 이미지

### Phase 5: 추가 개선 (ongoing)
- [ ] Spell Checker API 연동 (부산대/네이버)
- [ ] PDF Manager 기능 확대 (회전, 이미지변환, 압축)
- [ ] Color Converter CMYK/RGBA 추가
- [ ] Severance Calculator 계산과정 표시, 퇴직소득세
- [ ] Ovulation Calculator 멀티사이클 예측
- [ ] Stopwatch 탭 제목, 전체화면
- [ ] Lotto Generator 다중세트, 당첨확인

---

## 진행중인 작업
- Phase 3 진행중 (Calculator 완료, Exchange Rate 차트 완료)

## 완료된 작업
- [x] Calculator Tier 1~3 전면 업그레이드 (2026-02-07)
- [x] Exchange Rate 환율 차트 프론트엔드 (2026-02-07)
- [x] Phase 2: 핵심 기능 6건 추가 완료 (2026-02-07)
- [x] Phase 1: 긴급 버그 9건 수정 완료 (2026-02-07)
- [x] 전체 도구 스캔 & 글로벌 경쟁사 대비 분석 (2026-02-07)
- [x] WORK_LOG.md 생성 & CLAUDE.md 연동 (2026-02-07)

## 보류/아이디어
- 환율 계산기 차트 (Phase 3에 포함)
- 모바일에서 SEO 콘텐츠 display:none 처리 → 구글 모바일 우선 인덱싱에 부정적 가능성

---
*마지막 업데이트: 2026-02-07 (공학용계산기 Tier1~3, 환율차트)*
