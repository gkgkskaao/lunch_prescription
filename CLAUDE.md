# CLAUDE.md — 점심 처방전

점심 "결정장애"를 약국 처방전 콘셉트로 풀어주는 **단일 서비스** 모바일 웹앱. 3문항 퀴즈 → 메뉴 "처방" → SNS 공유. North Star = **공유율**.

상세 배경은 [research.md](research.md), 로드맵·진행상황은 [plan.md](plan.md) 참고.

## 실행

ES Module을 쓰므로 **정적 서버 필수** (`file://` 직접 열기는 CORS로 실패):

```bash
npx serve .          # 또는
python -m http.server 8080
```

빌드 도구·번들러 없음. 의존성은 런타임 CDN뿐(Tailwind, html-to-image via esm.sh).

## 구조

```
index.html        # 마크업 + Tailwind config + OG/카카오 스캐폴드. 진입은 <script>import('./js/app.js')</script>
css/style.css     # 처방전 커스텀 CSS (절취선·바코드·스피너·토스트). ※인라인 아님
js/
  data.js         # export const DATA, LOADING_MESSAGES — 콘텐츠는 여기만 수정
  engine.js       # export getResult(tags, results) — 순수 함수, DOM 의존 0
  ui.js           # DOM 조작 (show/showQuestion/showLoading/renderResult/toast)
  share.js        # shareImage(카드 PNG), shareKakao
  url.js          # buildShareUrl / getSharedResultId (?rx=<id> 공유 복원)
  analytics.js    # track(event, params) — gtag/dataLayer 래퍼
  app.js          # 진입점: 상태 + 이벤트 바인딩 + URL 복원
```

## 엔진 계약 (깨지 않도록 주의)

**데이터 필드** (`js/data.js`의 `results[]`) — `js/ui.js`가 DOM에 매핑:
`id`, `tags`, `menu`(→#result-menu), `message`(→#result-message), `dosage`(→#rx-dosage), `sideEffect`(→#rx-sideeffect), `combo`(→#rx-combo), `share`. fallback 항목은 `fallback: true` **정확히 1개**.

**필수 DOM ID 18개** (`index.html`) — 변경·삭제 금지:
`landing-screen, quiz-screen, loading-screen, result-screen, start-btn, progress-text, progress-dots, question-text, options, loading-msg, result-menu, result-message, rx-dosage, rx-sideeffect, rx-combo, share-kakao, share-insta, retry-btn`

**매칭 로직**: `getResult`는 누적 태그 ∩ 결과 태그의 **교집합 크기**로 점수. 최고점 반환, 동점은 무작위, 0점은 fallback.

## 알려진 특성 (버그 아님)

- **fallback(김치찌개) 도달 불가**: q1(맛) 선택지가 항상 한 결과와 매칭 → 최소 점수 1. fallback은 안전망으로만 유지.
- **모든 태그 동등 가중치**: 맛(q1)이 멘탈(q2)+예산(q3) 조합에 밀릴 수 있음. 맛 가중치 도입은 plan.md Phase 2.1 예정.
- **동점 무작위**: 같은 점수 결과가 여럿이면 매번 무작위 → 시뮬레이션 분포가 실행마다 변동.

## 코드 규약

- **무빌드 ES Module.** 새 모듈은 `js/`에 두고 `import`/`export`로 연결. CDN 라이브러리는 동적 `import('https://esm.sh/...')`로 (초기 로드 비영향).
- **콘텐츠 수정은 `js/data.js`만.** 구조·`tags`·`export`·`fallback`은 보존.
- **B급 처방 문체**: 반말 2인칭, 공감→가벼운 팩폭→처방. `dosage/sideEffect/combo`는 약봉지 패러디, `share`는 1인칭 인증 + 해시태그 3개 내외(`#점심처방전 #{메뉴} #밈성태그`).
- **트래킹**: 사용자 행동 이벤트는 `track()` 경유. 새 인터랙션 추가 시 이벤트도 함께.

## 작업 도구 (.claude/)

콘텐츠/검증 작업은 하네스를 활용:
- **스킬** `design-menu-data`(데이터 설계 가이드), `update-copy`(카피만 수정), `validate-build`(정합성 체크리스트), `design-content`(결과 풀 확장 오케스트레이터).
- **에이전트** `content-designer`(데이터 설계), `validator`(정합성 검증).
- 데이터/카피 변경 후에는 `validate-build` 체크(DOM ID·모듈 계약·구조·태그 시뮬레이션·카드/트래킹 계약)를 돌린다.

## 검증 빠른 명령

```bash
# 모듈 계약 + 태그 시뮬레이션 (실제 엔진 import)
node -e "Promise.all([import('./js/data.js'),import('./js/engine.js')]).then(([d,e])=>{const{DATA}=d,{getResult}=e;const o=DATA.quiz.map(q=>q.options);function*P(i,a){if(i===o.length){yield a;return}for(const x of o[i])yield*P(i+1,a.concat(x.tags))}let t=0,f=0;for(const p of P(0,[])){t++;if(getResult(p,DATA.results).fallback)f++}console.log('paths',t,'fallback',f)})"
```

JS 파일 편집 시 PostToolUse 훅이 `node --check`로 구문을 자동 검증한다 (`.claude/settings.json`).
