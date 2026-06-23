---
name: update-copy
description: "점심 처방전의 카피(처방 메시지, 공유 문구, 복약 정보, 퀴즈 질문/선택지)를 수정하는 스킬. 데이터 구조나 태그는 건드리지 않고 문구만 다듬는다. '카피 수정', '처방 메시지 바꿔줘', '문체 다듬어줘', '말투 손봐줘', '공유 문구 고쳐줘' 요청 시 사용. 결과 항목 추가/결과 풀 확장은 design-content 스킬을 쓴다."
---

# Update Copy — 카피 수정

`js/data.js`의 문구만 다듬는다. 구조·태그·엔진 계약은 건드리지 않으므로 에이전트 파이프라인 없이 직접 수행한다.

## 수정해도 되는 것

- `message` — 처방 메시지
- `share` — 카톡/공유 텍스트 (해시태그 포함)
- `dosage` / `sideEffect` / `combo` — 복약 정보 3칸 (약봉지 패러디)
- 퀴즈 `question` — 질문 문장
- 퀴즈 `options[].label` — 선택지 문구 (단, 같은 항목의 `tags`는 보존)
- `LOADING_MESSAGES` — 조제 중 로테이션 문구

## 건드리면 안 되는 것 (엔진 계약)

- **`tags`** (퀴즈 선택지·결과 양쪽) — 태그를 바꾸면 결과 매핑이 달라진다. label만 바꾸고 tags는 그대로 둔다.
- **`fallback: true`** 플래그 — 제거하면 점수 0 경로에서 엔진이 깨진다.
- **필드명·객체 구조** — `js/engine.js`·`js/ui.js`가 의존한다 (`menu`/`message`/`dosage`/`sideEffect`/`combo`).
- **`export` 구문** — `js/app.js`가 `import { DATA, LOADING_MESSAGES }` 한다.
- **HTML의 DOM ID** — 카피 작업은 `js/data.js`만 다룬다.

## 문체 가이드 (B급 감성)

- 반말 + 2인칭 직접 지칭. 공감 → 가벼운 팩폭 → 처방 흐름.
- `dosage`/`sideEffect`/`combo`: 약봉지 패러디 톤 ("면치기 금지" / "내일 아침 2차 매운맛" / "제로콜라 (양심)").
- `share`: 1인칭 인증 톤 + 이모지 1~2개 + 해시태그 3개 내외 (`#점심처방전 #{메뉴명} #밈성태그`).

> 톤 레퍼런스: `.claude/skills/design-menu-data/references/example-prescription.md`

## 작업 절차

1. `js/data.js`를 읽는다.
2. 요청된 문구만 수정한다 (tags·구조·export 보존).
3. 수정 후 모듈 로드 확인: `node -e "import('./js/data.js').then(m=>console.log('valid, results:',m.DATA.results.length))"`.
   - (PostToolUse 훅이 `node --check`로 구문도 자동 검증하지만, import 확인으로 export 무결성까지 본다.)
4. 여러 결과의 톤을 한꺼번에 손볼 때는 문체 일관성을 유지한다 — 한 항목만 톤이 튀지 않게.
