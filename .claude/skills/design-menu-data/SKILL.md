---
name: design-menu-data
description: "점심 처방전의 퀴즈·처방 데이터(js/data.js의 DATA 객체)를 설계하는 가이드. 퀴즈 3문항 + 태그 체계 + 처방 결과 + fallback 스키마, 태그 교집합 시뮬레이션, B급 처방 문체를 다룬다. 새 처방 결과 추가, 결과 풀 확장, 처방 카피 작성, 퀴즈 문항 작성 시 사용."
---

# Design Menu Data — 처방 데이터 설계 가이드

`js/data.js`의 `DATA` 객체를 설계·확장하는 절차. 엔진(`js/engine.js`의 `getResult`)이 이 데이터를 읽어 태그 교집합으로 결과를 처방하고, `js/ui.js`가 화면에 채운다. 엔진과의 계약(필드명)을 정확히 지켜야 화면이 깨지지 않는다.

> 이 프로젝트는 **단일 서비스**다. 데이터는 외부 JSON이 아니라 `js/data.js`의 ES Module `export const DATA`로 인라인돼 있다. (Phase 3에서 `data/content.json` 외부화 예정 — plan.md 참고.)

## 데이터 스키마 (js/data.js)

```js
export const DATA = {
  quiz: [
    {
      id: 'q1',
      question: '질문 문장?',
      options: [
        { label: '선택지 문구', tags: ['태그A'] }
      ],
    },
    // q2, q3 ...
  ],
  results: [
    {
      tags: ['태그A', '태그B', '태그C'],
      menu: '메뉴명',
      message: '처방 메시지',
      dosage: '복용법',
      sideEffect: '예상 부작용',
      combo: '함께 복용',
      share: '공유 텍스트 #해시태그',
    },
    {
      fallback: true,
      tags: [],
      menu: '...', message: '...', dosage: '...',
      sideEffect: '...', combo: '...', share: '...',
    },
  ],
};

export const LOADING_MESSAGES = ['처방전 조제 중...', /* ... */];
```

**필드를 정확히 지키는 이유:** `js/ui.js`의 `renderResult()`가 `getElementById`로 채운다 — `result-menu`←`menu`, `result-message`←`message`, `rx-dosage`←`dosage`, `rx-sideeffect`←`sideEffect`, `rx-combo`←`combo`. 필드명이 틀리면 해당 칸이 빈다. (`share`는 카톡 공유 문구로 `js/share.js`가 읽는다.)

## 퀴즈 설계 규칙

- **문항 3개 고정.** 진행 점(`progress-dots`)과 UX가 3문항 전제로 맞춰져 있다.
- **각 선택지의 `tags`는 1개.** 축을 나눈다: **q1 = 맛**(mild/spicy/greasy), **q2 = 멘탈**(tired/angry/survive), **q3 = 예산**(broke/rich). 축이 겹치지 않는다.
- 선택지는 문항당 2~3개. 서로 다른 태그를 부여해 결과를 분기시킨다. (현재 q1·q2는 3지, q3는 2지.)

## 태그 → 결과 매핑 (엔진 동작)

`getResult(tags, results)`는 사용자가 누적한 태그와 각 결과의 `tags` 배열의 **교집합 크기**를 점수로 매긴다. 최고 점수 결과를 반환하고, 동점이면 무작위 선택, **점수 0이면 `fallback`** 을 반환한다.

설계 함의:
- 결과의 `tags`는 보통 3개(맛 1 + 멘탈 1 + 예산 1). "이 조합의 사람"을 정의한다.
- **모든 태그가 동등 가중치다.** 맛 1차 매핑을 의도해도 멘탈+예산 조합이 맛을 이길 수 있다 (research.md §7-4 / plan.md Phase 2.1의 가중치 개선 대상). 결과 추가 시 이 특성을 염두에 둔다.
- 결과 개수는 현재 3개(+fallback). plan.md Phase 2.2는 8~12개로 확장 목표.

## ⚠️ fallback 도달성 (현 구조의 알려진 특성)

현재 q1의 모든 선택지(mild/spicy/greasy)가 각각 한 결과의 태그에 들어 있어, **어떤 경로든 최소 점수 1** 이다. 따라서 `fallback`(김치찌개)은 정상 플로우에서 **도달 불가**다 (research.md §7-1). 이건 버그가 아니라 현 데이터의 특성이며, fallback은 "예외 경로용 안전망"으로 유지한다. 결과 풀 확장 시 의도적으로 노출하려면 q1 외 축에서만 매칭되는 조합을 남겨야 한다.

## 태그 교집합 시뮬레이션 (필수 자체 검증)

설계 후, 가능한 답변 경로(문항별 선택지의 곱)를 돌려 각 경로가 어떤 결과로 가는지 확인한다. **실제 엔진을 import**해 검증한다 (로직 재복사 금지 — 엔진 변경 시 자동 반영):

```bash
node -e "
Promise.all([import('./js/data.js'),import('./js/engine.js')]).then(([d,e])=>{
  const {DATA}=d,{getResult}=e;
  const opts=DATA.quiz.map(q=>q.options);
  function* paths(i,acc){if(i===opts.length){yield acc;return;}for(const o of opts[i])yield* paths(i+1,acc.concat(o.tags));}
  let total=0,fb=0;const tally={};
  for(const p of paths(0,[])){total++;const r=getResult(p,DATA.results);if(r.fallback)fb++;tally[r.menu]=(tally[r.menu]||0)+1;}
  console.log('total:',total,'| fallback:',fb,'| ratio:',(fb/total).toFixed(2));
  console.log('distribution:',JSON.stringify(tally));
});
"
```

**판정 기준:** 특정 결과로만 쏠리거나(분포 불균형) 의도치 않은 fallback이 다수면 태그를 조정한다. 현재 기준선: 18경로, fallback 0, 분포 {평양냉면:6, 매운갈비찜:7, 치즈돈까스:5}.

## 처방 문체 (B급 감성)

기존 처방 카피의 톤을 유지한다:
- **반말 + 2인칭 직접 지칭.** "맵고 자극적인 거에 절여진 혀로 평냉을 시키네. 어른 다 됐다."
- **공감 → 가벼운 팩폭 → 처방** 흐름. 손님의 상태를 콕 집어 놀리듯 위로하고 메뉴로 마무리.
- **`dosage`/`sideEffect`/`combo`는 약봉지 패러디.** "면치기 금지, 천천히 음미" / "내일 아침 2차 매운맛" / "제로콜라 (양심)".
- **`share`는 1인칭 인증 톤 + 해시태그 3개 내외.** `#점심처방전 #{메뉴명} #밈성_해시태그`.

> 실제 항목 예시는 `references/example-prescription.md` 참조 (작성 톤·구조 템플릿).

## 산출

- 데이터는 `js/data.js`의 `DATA`에 직접 반영하거나, 큰 작업이면 `_workspace/01_content-designer_results.js`에 초안을 쓰고 검토 후 병합한다.
- 시뮬레이션 결과(총 경로 수 / fallback 경로 수 / 분포)를 반환 보고에 포함한다.
