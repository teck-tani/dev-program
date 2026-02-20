# FINALIZED_TOOLS.md — 수정 완료된 도구 목록

> **이 파일에 등록된 도구는 수정 금지.**
> 사용자가 직접 검수하여 최종 확정한 도구이므로, Claude는 이 도구들의 코드/번역/SEO를 변경하지 않는다.
> 버그 수정이나 변경이 필요할 경우 사용자가 명시적으로 요청해야만 수정 가능.

---

## 확정 도구 목록 (총 33개)

### 계산기 (15개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 공학용 계산기 | /calculator | 2026-02-12 | 기본+공학 계산, 히스토리, 키보드 입력 | 블로그
| 2 | 퇴직금 계산기 | /severance-calculator | 2026-02-17 | 퇴직금+세금+DC연금, 월급/3개월 토글, 날짜자동포맷+달력, 결과복사/인쇄 |
| 3 | 이자 계산기 | /interest-calculator | 2026-02-18 | 예금/적금, 단리/복리, 세금3종, 중도해지 시뮬레이션, 목표금액 역산, 월별상세 | 블로그 미작성
| 4 | 월급 계산기 | /salary-calculator | 2026-02-19 | 연봉/월급/역산 3모드, 실시간 자동계산, 국민연금 상한(590만), 도넛차트, 컴팩트 UI | 블로그 미작성
| 5 | 배란일 계산기 | /ovulation-calculator | 2026-02-19 | 배란일/가임기/안전기간, 신뢰도 점수, BBT 차트+상승감지, 약물경고 4종, 임신테스트 추천, 증상기록 10종, 생식력 점수, PMS 예상 | 블로그 미작성
| 6 | 만나이 계산기 | /korean-age-calculator | 2026-02-19 | 만/세는/연 3종 나이, 나이비교 탭, 띠 궁합(육합/삼합/충), 띠별 성격, 달력아이콘, UTC버그수정, 날짜검증 | 블로그 미작성
| 7 | 더치페이 계산기 | /dutch-pay | 2026-02-19 | 균등/항목별/가중치 3모드, 최소거래 알고리즘, 팁 계산, 히스토리, 이미지저장, 결과공유 | 블로그 미작성
| 8 | BMI 계산기 | /bmi-calculator | 2026-02-19 | 성인/소아청소년, kg↔lb 단위전환, BMI게이지, 추이차트, 정상체중범위, WHO기준 6단계 | 블로그 미작성
| 9 | 부가세 계산기 | /vat-calculator | 2026-02-19 | 공급가액/합계/부가세 3모드, 일반/간이/영세율, 실시간계산, 히스토리, 결과복사 | 블로그 미작성
| 10 | 대출 상환 계산기 | /loan-calculator | 2026-02-19 | 원리금균등/원금균등/만기일시 3방식, 거치기간, 중도상환 시뮬레이션, 상환스케줄, 방식비교표, 도넛차트 | 블로그 미작성
| 11 | 전월세 전환 계산기 | /rent-conversion | 2026-02-19 | 전세↔월세 양방향 전환, 법정전환율(4.5%), 전환율 커스텀, 공식 안내, 인라인 유효성검증, 접근성(aria-live/radiogroup) | 블로그 미작성
| 12 | 할인율 계산기 | /discount-calculator | 2026-02-19 | 할인율/할인가/마진 3모드, 인상안내, 마크업율, 결과복사, 실시간계산 | 블로그 미작성
| 13 | 4대보험 계산기 | /insurance-calculator | 2026-02-19 | 2026년 연금개혁 반영(국민연금 4.75%, 건강보험 3.595%, 장기요양 13.14%), 기업규모별 고용보험, 근로자/사업주 분리, 실수령액 | 블로그 미작성
| 14 | 주식 수익률 계산기 | /stock-calculator | 2026-02-19 | 현재 상태 그대로 확정 | 블로그 미작성
| 15 | 프리랜서 3.3% 계산기 | /freelancer-tax | 2026-02-19 | 양방향 계산(계약→실수령/실수령→계약), 도넛차트, 월간/연간 요약, 복사/공유, 만나이계산기 스타일 UI | 블로그 미작성

### 시간 (1개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 온라인 시계 | /clock | 2026-02-18 | 디지털/아날로그 모드, 24h/12h 전환(AM/PM), 세계시계 70+도시, 타임존 약어(KST/JST/EST), DST 표시, 드래그앤드롭, 주차 표시, 전체화면, 스톱워치/타이머/알람 연동 |

### 변환 (2개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | Base64 변환기 | /base64-encoder | 2026-02-18 | 텍스트/파일 인코딩·디코딩, URL-safe, 드래그앤드롭, 결과 복사 |
| 2 | 단위 변환기 | /unit-converter | 2026-02-20 | 12개 카테고리(길이/무게/넓이/부피/온도/속도/데이터/시간/압력/에너지/전력/요리), 한국 전통단위(리/근/평), 정밀도 선택(2~8자리), 반응형 레이아웃(모바일 1열↔데스크톱 3열), 스왑 버튼, 빠른 참조표, 복사/공유 |

### 유틸리티 (14개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 바코드 생성기 | /barcode | 2026-02-12 | 다중 형식, 대량생성, 설정 영속화 |
| 2 | 로또 번호 생성기 | /lotto-generator | 2026-02-17 | 물리시뮬레이션 애니메이션, 고정/제외번호, 멀티세트, 통계, API연동 |
| 3 | QR코드 생성기 | /qr-generator | 2026-02-20 | 텍스트/URL·WiFi·vCard 3종, 색상 커스터마이징, 로고 삽입(H등급 자동), PNG·SVG 다운로드, 클립보드 복사, 공유 |
| 4 | 이미지 압축기 | /image-compressor | 2026-02-20 | JPEG·WebP·PNG·AVIF(감지) 4종, ZIP 다운로드, Before/After 비교 슬라이더, 투명도 경고, 일괄처리, 설정변경 재압축 |
| 5 | 이미지 리사이즈 | /image-resize | 2026-02-20 | 디바이스별 프리셋 13종(소셜/모바일/웹), 스마트 크롭(Sobel 엣지+2D전처리합), 맞추기(레터박스), 퍼센트/픽셀 모드, 일괄처리, ZIP 다운로드 |
| 6 | 이미지 포맷변환 | /image-converter | 2026-02-20 | PNG·JPG·WebP·AVIF(브라우저감지) 4종+HEIC입력, 업로드즉시자동변환, 설정변경즉시재변환, ZIP 다운로드(JSZip), EXIF경고, 접근성(role/tabIndex/aria-label) |
| 7 | 파비콘 생성기 | /favicon-generator | 2026-02-20 | 7종 크기(16~512), ICO 바이너리 직접 생성, PNG 개별다운로드, HTML 코드스니펫 복사, 드래그앤드롭, 미리보기, Blob URL 관리, 키보드 접근성(role=button/tabIndex/aria-pressed) |
| 8 | 파일 크기 변환기 | /file-size-converter | 2026-02-20 | 7단위(Bit~PB) 실시간 변환, 이진/십진 토글(1024/1000), 전송시간 계산(6종), 저장용량 비교, 빠른선택, 공유 |
| 9 | 유튜브 썸네일 추출기 | /youtube-thumbnail | 2026-02-20 | 5화질(1280×720~120×90) 추출, 다운로드/전체다운로드, 라이트박스(ESC닫기), oEmbed 메타데이터, 최근검색 히스토리(10개/localStorage), 마지막URL복원, 중복제거/최신순 정렬 |
| 10 | 이모지 모음 & 특수문자 | /special-characters | 2026-02-20 | 카테고리 탭(전체/이모지/특수문자), 최근 사용(localStorage, 20개), 키워드 이름 검색(한/영), 즐겨찾기, 대량 선택·복사, 유니코드+HTML엔티티 표시, 이모지 8카테고리+특수문자 6카테고리 |
| 11 | PDF 합치기/분리 | /pdf-manager | 2026-02-20 | 합치기(드래그앤드롭 정렬, pdfjs 실시간 썸네일), 분리(범위 지정, 개별ZIP/선택페이지합치기), 워터마크(한글 지원·캔버스PNG, 대각선/중앙, 크기/투명도 조절), H1 제거, 번역완비 |
| 12 | 색상 코드 변환기 | /color-converter | 2026-02-20 | HEX/RGB/HSL/HSV/CMYK 5종 실시간 변환, CSS 색상 이름 표시(60종), Tailwind v3 색상 매핑(192종), Eyedropper API, CSS 그라디언트 생성기(선형/방사형), URL 파라미터 공유, H1 중복 제거 |
| 13 | 사다리 타기 | /ladder-game | 2026-02-20 | 2~10명 참가자, Canvas 사다리 렌더링, 레이스/순차 2모드, PATH_COLORS 10색, 반응형 캔버스, styled-jsx 다크모드 |
| 14 | 랜덤 생성기 | /random-generator | 2026-02-20 | 8탭(숫자/이름/색상/주사위/동전/셔플/팀나누기/가중치), 로또 프리셋, RPG 주사위(NdS±M), 한국어/영어 이름, 보색/유사색/단색 팔레트, 팀 라운드로빈, 가중치 확률 시각화바 |
| 15 | 비밀번호 생성기 | /password-generator | 2026-02-20 | 랜덤 문자/패스프레이즈 2모드, crypto.getRandomValues, HIBP 유출 확인(k-anonymity), 엔트로피 강도미터, 해독시간 추정, 프리셋 4종(은행/WiFi/PIN/일반), 모호한 문자 제외, 한국어/영어 패스프레이즈, 히스토리 50개 |

### 텍스트 (2개)
| # | 도구명 | 경로 | 확정일 | 비고 |
|---|--------|------|--------|------|
| 1 | 글자수 세기 | /character-counter | 2026-02-14 | 목표 글자수, UTF-8/EUC-KR 바이트, SNS 제한, 키워드 분석 | 블로그
| 2 | 텍스트 비교기 | /text-diff | 2026-02-20 | LCS 줄+문자 단위 diff, modify 블록 페어링 버그수정, 통합/나란히 뷰, 스크롤 동기화, 디바운스 300ms, isIdentical 옵션 반영, 모바일 반응형, SEO 6섹션 완비 |

---

## 규칙

1. **코드 수정 금지**: `src/app/[locale]/calculator/`, `src/app/[locale]/barcode/`, `src/app/[locale]/character-counter/`, `src/app/[locale]/severance-calculator/`, `src/app/[locale]/lotto-generator/`, `src/app/[locale]/base64-encoder/`, `src/app/[locale]/interest-calculator/`, `src/app/[locale]/salary-calculator/`, `src/app/[locale]/ovulation-calculator/`, `src/app/[locale]/korean-age-calculator/`, `src/app/[locale]/dutch-pay/`, `src/app/[locale]/bmi-calculator/`, `src/app/[locale]/vat-calculator/`, `src/app/[locale]/loan-calculator/`, `src/app/[locale]/rent-conversion/`, `src/app/[locale]/discount-calculator/`, `src/app/[locale]/insurance-calculator/`, `src/app/[locale]/stock-calculator/`, `src/app/[locale]/freelancer-tax/`, `src/app/[locale]/qr-generator/`, `src/app/[locale]/image-compressor/`, `src/app/[locale]/image-resize/`, `src/app/[locale]/image-converter/`, `src/app/[locale]/favicon-generator/`, `src/app/[locale]/file-size-converter/`, `src/app/[locale]/youtube-thumbnail/`, `src/app/[locale]/special-characters/`, `src/app/[locale]/unit-converter/`, `src/app/[locale]/pdf-manager/`, `src/app/[locale]/color-converter/`, `src/app/[locale]/text-diff/`, `src/app/[locale]/ladder-game/`, `src/app/[locale]/random-generator/`, `src/app/[locale]/password-generator/` 하위 파일 수정 불가
2. **번역 수정 금지**: `messages/ko.json`, `messages/en.json` 내 해당 도구 번역 키 수정 불가
   - Calculator: `Calculator.*`, `Index.tools.calculator`
   - Barcode: `Barcode.*`, `Index.tools.barcode`
   - CharacterCounter: `CharacterCounter.*`, `Index.tools.characterCounter`
   - SeveranceCalculator: `SeveranceCalculator.*`, `Index.tools.severanceCalculator`
   - Lotto: `Lotto.*`, `Index.tools.lottoGenerator`
   - Base64Encoder: `Base64Encoder.*`, `Index.tools.base64Encoder`
   - InterestCalculator: `InterestCalculator.*`, `Index.tools.interestCalculator`
   - PayCal: `PayCal.*`, `Index.tools.salaryCalculator`
   - OvulationCalculator: `OvulationCalculator.*`, `Index.tools.ovulationCalculator`
   - KoreanAgeCalculator: `KoreanAgeCalculator.*`, `Index.tools.koreanAgeCalculator`
   - DutchPay: `DutchPay.*`, `Index.tools.dutchPay`
   - BmiCalculator: `BmiCalculator.*`, `Index.tools.bmiCalculator`
   - VatCalculator: `VatCalculator.*`, `Index.tools.vatCalculator`
   - LoanCalculator: `LoanCalculator.*`, `Index.tools.loanCalculator`
   - RentConversion: `RentConversion.*`, `Index.tools.rentConversion`
   - DiscountCalculator: `DiscountCalculator.*`, `Index.tools.discountCalculator`
   - InsuranceCalculator: `InsuranceCalculator.*`, `Index.tools.insuranceCalculator`
   - StockCalculator: `StockCalculator.*`, `Index.tools.stockCalculator`
   - FreelancerTax: `FreelancerTax.*`, `Index.tools.freelancerTax`
   - QrGenerator: `QrGenerator.*`, `Index.tools.qrGenerator`
   - ImageCompressor: `ImageCompressor.*`, `Index.tools.imageCompressor`
   - ImageResize: `ImageResize.*`, `Index.tools.imageResize`
   - ImageConverter: `ImageConverter.*`, `Index.tools.imageConverter`
   - FileSizeConverter: `FileSizeConverter.*`, `Index.tools.fileSizeConverter`
   - FaviconGenerator: `FaviconGenerator.*`, `Index.tools.faviconGenerator`
   - YoutubeThumbnail: `YoutubeThumbnail.*`, `Index.tools.youtubeThumbnail`
   - SpecialCharacters: `SpecialCharacters.*`, `Index.tools.specialCharacters`
   - UnitConverter: `UnitConverter.*`, `Index.tools.unitConverter`
   - PDFManager: `PDFManager.*`, `Index.tools.pdfManager`
   - ColorConverter: `ColorConverter.*`, `Index.tools.colorConverter`
   - TextDiff: `TextDiff.*`, `Index.tools.textDiff`
   - LadderGame: `LadderGame.*`, `Index.tools.ladderGame`
   - RandomGenerator: `RandomGenerator.*`, `Index.tools.randomGenerator`
   - PasswordGenerator: `PasswordGenerator.*`, `Index.tools.passwordGenerator`
3. **SEO 수정 금지**: 해당 도구의 `page.tsx` 내 JSON-LD, 메타데이터 수정 불가
4. **예외**: 사용자가 명시적으로 "이 도구 수정해" 라고 요청한 경우에만 수정 가능


