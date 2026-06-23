---
name: design-content
description: "점심 처방전의 처방 결과 콘텐츠를 설계·확장하는 오케스트레이터. content-designer → validator 파이프라인으로 js/data.js의 결과 풀을 추가·보강하고 엔진 정합성을 검증한다. '결과 추가', '메뉴 추가', '결과 풀 확장', '처방 늘려줘', '다시 설계', '재실행', '보완' 요청 시 사용. 기존 문구만 고치는 경우는 update-copy 스킬을 쓴다."
---

# Design Content — 처방 콘텐츠 설계 오케스트레이터

점심 처방전의 퀴즈·처방 결과 콘텐츠를 설계하거나 확장하는 과정을 조율한다. **실행 모드는 서브 에이전트 파이프라인**: content-designer → validator 를 순차 호출한다.

> 단일 서비스 구조라 원본 하네스의 page-builder 단계(업종별 HTML 생성)는 없다. HTML은 `index.html` 하나로 고정. 이 오케스트레이터는 주로 **plan.md Phase 2.2(결과 풀 3→8~12개 확장)** 에서 쓴다.

모든 Agent 호출은 `model: "claude-sonnet-4-6"`으로 한다.

## Phase 0: 컨텍스트 확인

작업 시작 시 실행 모드를 판별한다:

- `_workspace/01_content-designer_results.js` 존재 + 사용자가 부분 수정 요청 → **부분 재실행** (content-designer만 재호출)
- 산출물 없음 → **초기 실행** (Phase 1부터)

## Phase 1: 입력 수집

사용자에게 확인한다 (모르면 합리적 기본값 + 가정 명시):
- **추가/변경할 결과 수**와 방향 (예: "느끼+빡침+거지 조합 커버하는 결과 2개 추가")
- **퀴즈 변경 여부** — 문항/선택지/태그를 바꾸면 기존 결과 매핑 전체가 흔들리므로 신중히.
- **유지할 톤** — 기존 B급 처방 문체 유지가 기본.

## Phase 2: 콘텐츠 설계 (content-designer)

`content-designer` 에이전트를 `subagent_type`으로 호출한다. Phase 1 입력을 전달하고, 설계 산출(결과 항목 + 태그 경로 시뮬레이션 요약)을 받는다. 산출은 `_workspace/01_content-designer_results.js`에 쓰고, 검토 후 `js/data.js`에 병합한다.

## Phase 3: 검증 (validator)

`validator` 에이전트를 호출한다. `js/data.js`(병합본)와 `index.html`을 교차 검증해 `_workspace/02_validator_report.md`를 받는다.

- **PASS** → 사용자에게 결과 요약 + 분포 변화 보고.
- **FAIL** → 리포트가 지목한 위치를 content-designer에 **1회 재호출**해 수정 → validator 재검증. 재실패 시 누락을 명시해 보고하고 멈춘다.

## 데이터 전달 프로토콜

- **반환값 기반** — 각 서브 에이전트 결과를 오케스트레이터가 수집.
- **파일 기반** — 중간 산출물은 `_workspace/{phase}_{agent}_{artifact}` 컨벤션. 최종물만 `js/data.js`에 병합하고 `_workspace/` 중간 파일은 보존한다 (감사 추적).

## 에러 핸들링

- 1회 재시도 후 재실패 시, 해당 산출물 없이 진행하되 보고서에 누락을 명시한다.
- 태그 매핑이 깨지거나(특정 결과 독식/의도치 않은 fallback 다수) JSON 모듈 로드 실패는 치명적 — 발견 즉시 멈추고 보고한다.

## 테스트 시나리오

- **정상 흐름:** "느끼+버팀+거지 조합 결과 추가해줘" → content-designer가 결과 1개 추가 + 시뮬레이션 → validator PASS → 분포 변화 보고.
- **에러 흐름:** content-designer가 새 결과 태그를 기존과 중복시켜 매핑 쏠림 발생 → validator WARN/FAIL → content-designer 재호출 → 재검증 PASS.

## 산출물 체크리스트

- [ ] `js/data.js` — quiz 3문항 + results(+fallback 1개), 필드 정확
- [ ] 모듈 export 무결성 (DATA, LOADING_MESSAGES)
- [ ] validator PASS 리포트 (`_workspace/02_validator_report.md`)
- [ ] 태그 시뮬레이션 분포 균형
