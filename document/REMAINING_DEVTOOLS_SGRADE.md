# 개발도구 S급 업그레이드 - 미완성 작업

> **이 파일은 다음 세션에서 바로 실행할 수 있도록 작성되었습니다.**
> 작성일: 2026-02-20

---

## 완료된 작업 (4/12)

| # | 도구 | 상태 | 변경 내용 |
|---|------|------|----------|
| 1 | 정규식 테스터 | **완료** | 백트래킹 경고+해결팁, 매치 복사, 통계 바(매치수/그룹/실행시간) |
| 2 | JSON 포매터 | **완료** | 파일 업로드(드래그앤드롭), 다운로드, 키 정렬(A→Z), JSONPath 쿼리 |
| 3 | Cron 생성기 | **완료** | 타임존 선택(Intl API), 초단위 필드 토글, 필드별 유효성 검증 |
| 4 | UUID 생성기 | **완료** | v3(MD5)/v5(SHA-1) 네임스페이스 기반 생성, 5개 버전(v1/v3/v4/v5/v7), 프리셋 네임스페이스(DNS/URL/OID/X500)+커스텀 |

## 이미 S급인 도구 (수정 불필요, 3개)

| # | 도구 | 파일 | 근거 |
|---|------|------|------|
| 1 | 해시 생성기 | `hash-generator/HashGeneratorClient.tsx` (1312줄) | MD5(순수JS)+SHA전체+HMAC, 파일해시(드래그앤드롭,10개), 검증모드, 체크섬파일다운로드 |
| 2 | JWT 디코더 | `jwt-decoder/JwtDecoderClient.tsx` (829줄) | 디코드/인코드, HMAC검증(HS256/384/512), 만료카운트다운, 알고리즘정보, 클레임 툴팁 |
| 3 | 타임스탬프 변환 | `timestamp-converter/TimestampConverterClient.tsx` (543줄) | 4모드(변환/역변환/차이/배치), 16개 타임존, 7개 언어 코드스니펫, 상대시간 |

## 미완성 작업 (5개 도구)

### 1. URL 인코더 (`url-encoder/UrlEncoderClient.tsx`, 616줄)
**현재 상태**: URL/HTML 인코딩, URL 파서, 쿼리 에디터, 참조표, 이중인코딩 경고
**추가할 기능**:
- [ ] **배치 모드**: 여러 줄 텍스트를 한 번에 인코딩/디코딩 (textarea → 줄별 처리)
- [ ] **Base64 URL-safe 모드**: `+/=` → `-_` 변환 옵션

### 2. 마크다운 미리보기 (`markdown-preview/MarkdownPreviewClient.tsx`, 1133줄)
**현재 상태**: 6개 언어 구문 강조(JS/TS/Python/HTML/CSS/Bash/JSON), 이모지 100+, GFM, LaTeX, TOC, 파일 업로드, HTML/PDF 내보내기, 동기 스크롤
**추가할 기능**:
- [ ] **구문 강조 언어 확장**: Go, Java, Ruby, Rust, C/C++, SQL 추가
- [ ] **.md 파일 다운로드 버튼**
- [ ] **단어 수 표시** (워드 카운트 바)

### 3. CSS 축소기 (`css-minifier/CssMinifierClient.tsx`, 534줄)
**현재 상태**: 축소/정리 모드, CSS 린트(중괄호/세미콜론/중복), 최적화 리포트, diff 뷰, 통계, 샘플, 다운로드
**추가할 기능**:
- [ ] **Gzip 크기 추정**: CompressionStream API 또는 pako 라이브러리로 gzip 후 크기 표시
- [ ] **벤더 프리픽스 처리**: `-webkit-`, `-moz-` 등 자동 추가/제거

### 4. SQL 포매터 (`sql-formatter/SqlFormatterClient.tsx`, 651줄)
**현재 상태**: 6개 SQL 방언, sql-formatter 라이브러리(lazy-load), 구문 강조, 축소 모드, 파일 I/O, 샘플 쿼리
**추가할 기능**:
- [ ] **줄 번호 표시**: pre/code 블록에 줄 번호 오버레이
- [ ] **쿼리 복잡도 분석**: JOIN 수, 서브쿼리 깊이, 테이블 수 등

### 5. HTML 엔티티 (`html-entity/HtmlEntityClient.tsx`, 510줄)
**현재 상태**: 인코드/디코드, 3종 형식(named/decimal/hex), 엔티티 참조 그리드(카테고리/검색), 클릭복사
**추가할 기능**:
- [ ] **시각적 미리보기 패널**: 인코딩된 텍스트가 실제로 어떻게 보이는지 렌더링
- [ ] **엔티티 데이터 확장**: 수학 기호, 화살표 등 더 많은 엔티티 추가

---

## 실행 가이드 (다음 세션용)

```
1. 이 파일을 먼저 읽고 상태 파악
2. 각 도구 Client.tsx 파일을 읽고 현재 코드 확인
3. 도구별로 에이전트 병렬 실행 가능 (단, Edit/Write는 비백그라운드로)
4. 번역 키는 messages/ko.json, en.json에 추가
5. 완료 후 npm run build 테스트
6. 커밋 & 푸시
```

## 참고: 설치된 패키지
- `bcryptjs` + `@types/bcryptjs` (이전 세션에서 설치)
- `@noble/hashes` (이전 세션에서 설치)
