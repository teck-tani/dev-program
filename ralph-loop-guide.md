# Ralph Loop 사용법

## 기본 명령어

```bash
/ralph-loop:ralph-loop "<프롬프트>" [옵션]
```

/ralph-loop:ralph-loop "버그 수정해줘" --max-iterations 10


# 테스트 통과할 때까지 반복 (최대 10번)
/ralph-loop:ralph-loop "auth.ts 버그 수정하고 테스트 통과시켜" --completion-promise "TESTS PASS" --max-iterations 10


## 옵션

| 옵션 | 설명 |
|------|------|
| `--max-iterations <n>` | 최대 반복 횟수 (없으면 무한 루프) |
| `--completion-promise <text>` | 완료 신호 문구 |

## 사용 예시

```bash
# 기본 사용
/ralph-loop:ralph-loop "캐시 레이어 리팩토링"

# 최대 반복 횟수 지정
/ralph-loop:ralph-loop "테스트 추가" --max-iterations 20

# 완료 조건 지정
/ralph-loop:ralph-loop "auth.ts 버그 수정" --completion-promise "FIXED" --max-iterations 10
```

## 완료 신호

작업 완료 시 Claude가 출력해야 하는 형식:
```
<promise>TASK COMPLETE</promise>
```

## 루프 취소

```bash
/ralph-loop:cancel-ralph
```

## 작동 원리

1. 동일한 프롬프트가 반복 전달됨
2. Claude가 파일 수정 작업 수행
3. 종료 시도 시 stop hook이 가로챔
4. 같은 프롬프트 다시 전달
5. 이전 작업 결과(파일, git 히스토리)를 보고 개선
6. completion-promise 감지 또는 max-iterations 도달 시 종료

## 적합한 작업

✅ 명확한 성공 기준이 있는 작업
✅ 반복적 개선이 필요한 작업
✅ 신규 프로젝트 개발

## 부적합한 작업

❌ 사람의 판단이 필요한 설계 결정
❌ 일회성 작업
❌ 성공 기준이 불명확한 작업
