이# 점심 처방전 — MVP 빌드업 & 리팩토링 실행 계획

> 작성일: 2026-06-23
> 기준 문서: [research.md](research.md) · [lunch_prescription_blueprint.md](lunch_prescription_blueprint.md)
> 현재 상태: Phase 0·2 완료. Phase 1은 카카오 공유·OG 이미지까지 라이브 연결 완료, GA4 측정 ID만 잔여. `js/` 7모듈.

---

## 0. 목표와 원칙

**목표**: 인라인 프로토타입을 → 유지보수 가능한 구조로 분리하고, 설계도의 North Star(**공유율**)를 실제로 끌어올리는 MVP를 완성한다.

**우선순위 원칙**
1. **공유율에 직접 기여하는 것 먼저.** 카드 이미지화·실제 공유·트래킹이 1순위. (research.md §7-2,3)
2. **빌드 부담 최소화.** 현재 무빌드(브라우저로 바로 실행)의 장점을 가능한 유지. ES Module 분리까지는 빌드 없이 가능.
3. **로직과 데이터(콘텐츠) 분리.** 콘텐츠는 기획자가 코드 없이 수정 가능해야 한다.

**범위 밖(MVP 이후)**: 로그인, 사용자 계정, 추천 개인화/ML, 다국어.

---

## 1. 현 상태에서 즉시 고칠 핵심 이슈 (research.md §7 대응)

| # | 이슈 | 조치 | 단계 |
|---|------|------|------|
| 1 | ~~fallback(김치찌개) 도달 불가 죽은 코드~~ | ~~매칭 로직 재설계 or 의도적 노출 경로 마련~~ | ✅ Phase 2.5 완료 |
| 2 | ~~공유율(North Star) 측정 코드 없음~~ | 이벤트 트래킹 도입 | 🚧 Phase 1 코드완료(GA4 ID 대기) |
| 3 | ~~공유가 프로토타입(클립보드/토스트)만~~ | 카드 이미지화 + 실제 공유 | 🚧 Phase 1 코드완료(실측·키 대기) |
| 4 | ~~맛(q1) 가중치 미반영 → 메뉴 어긋남~~ | ~~가중치 도입~~ | ✅ Phase 2.1 완료 |
| 5 | ~~데이터 인라인 하드코딩~~ | ~~모듈/JSON 분리~~ | ✅ Phase 0 완료 |
| 6 | ~~결과 풀 3개로 협소~~ | ~~콘텐츠 확장~~ | ✅ Phase 2.2 완료 |

---

## ✅ Phase 0 — 코드 분리 리팩토링 (구조 정비) — 완료 (2026-06-23)

> 기능 변경 없이 **동작 동일성 유지**한 채로 파일만 분리한다. 이후 모든 작업의 토대.

### 0.1 목표 디렉터리 구조

```
lunch_prescription/
├── index.html              # 마크업 + <script type="module"> 진입점만
├── css/
│   └── style.css           # 현재 <style> 블록의 커스텀 CSS 이전
├── js/
│   ├── data.js             # DATA, LOADING_MESSAGES (export)
│   ├── engine.js           # getResult() 등 순수 함수 (테스트 대상)
│   ├── ui.js               # show(), showQuestion(), showResult(), toast() — DOM 조작
│   ├── share.js            # 공유 로직 (Phase 1에서 확장)
│   ├── analytics.js        # 이벤트 트래킹 (Phase 1에서 채움, 우선 빈 스텁)
│   └── app.js              # 진입점: 상태 + 이벤트 바인딩, 위 모듈 조립
└── (research.md, plan.md, blueprint.md)
```

### 0.2 분리 매핑 (현 index.html → 신규 위치)

- 커스텀 `<style>` (L37–113) → `css/style.css`, `<link>`로 연결.
- `DATA`, `LOADING_MESSAGES` (L239–313) → `js/data.js` → `export const DATA`, `export const LOADING_MESSAGES`.
- `getResult()` (L389–405) → `js/engine.js` → `export function getResult(tags, results)`. **순수 함수**로 유지(DOM 의존 0) → 단위 테스트 가능.
- `show / showQuestion / showResult / showLoading / toast` → `js/ui.js`.
- 전역 상태(`selectedTags` 등) + 이벤트 리스너(L433–450) → `js/app.js`.
- Tailwind config `<script>`는 CDN 특성상 `index.html` `<head>`에 유지.

### 0.3 무빌드 ES Module 적용

- `index.html`: `<script type="module" src="js/app.js"></script>` 하나로 진입.
- 모듈 간 `import`/`export`로 연결 → 번들러 불필요.
- ⚠️ `file://` 직접 열기는 CORS로 모듈 로드가 막힐 수 있음 → **로컬 정적 서버** 필요. `npx serve` 또는 VS Code Live Server 사용. (README에 실행법 명시)

### 0.4 검증
- 분리 전/후 동작 동일 확인: 4화면 전환, 3문항 응답, 2.5초 로딩, 결과 카드 렌더, 토스트.
- `engine.js`에 최소 테스트(노드 or 브라우저 콘솔)로 주요 태그 조합 → 기대 메뉴 매핑 확인.

**완료 기준(DoD)**: 기존과 시각·동작 동일 + 콘텐츠를 `data.js`만 고쳐 바꿀 수 있음.

---

## 🚧 Phase 1 — MVP 핵심 기능 (공유율 드라이브) — 진행 중 (2026-06-23 착수)

> North Star = 공유율. 이 Phase가 MVP의 본질.
> 카카오 공유·이미지 공유·OG 에셋까지 라이브 연결 완료. GA4 측정 ID만 남음 (아래 ⏳ 표시).

### 1.1 처방전 카드 이미지화 (최우선) — ✅ 코드 완료
- 결과 카드(`.rx-card`)를 PNG로 변환 → 저장/공유. `js/share.js`의 `shareImage()`.
- `html-to-image`를 **esm.sh CDN 동적 import**로 로드 (무빌드 유지, 초기 로드 비영향).
- 모바일 **Web Share API**(`navigator.canShare({files})`) 우선 → 미지원 시 **다운로드 폴백**.
- 폰트 로드 대기(`document.fonts.ready`) + `pixelRatio: 2`로 명조·이모지·바코드 캡처 품질 확보.
- '스토리 공유' 버튼(`share-insta`)이 이 함수를 호출 → 인스타/이미지 공유 일원화.
- ✅ 브라우저 실측 완료, `og-image.png` 에셋 추가 완료(저장소 루트).

### 1.2 실제 공유 연동 — ✅ 카카오 라이브 연결 완료
- **카카오**: `index.html`에 Kakao SDK `<script>` + `Kakao.init(KEY)` 적용 완료. `js/share.js`의 `shareKakao()`가 `Kakao.Share.sendDefault` 호출. `window.Kakao` 미초기화 시에만 공유 문구 클립보드 복사 폴백으로 동작.
  - ⚠️ **주의**: JS 키가 저장소에 평문으로 커밋되어 있음(공개 GitHub repo). 카카오 디벨로퍼스 콘솔에서 **허용 도메인 화이트리스트**가 걸려 있는지 확인 필요.
- **인스타**: 카드 이미지 저장/공유로 일원화(1.1) — 토스트 "이미지 저장됨 → 스토리에 올려보세요".

### 1.3 이벤트 트래킹 (North Star 측정) — ✅ 코드 완료
- `js/analytics.js`의 `track(event, params)`: `gtag`(GA4) 또는 `dataLayer` 전송, 미연결 시 개발 콘솔. try/catch로 UX 비차단.
- 호출 완료 이벤트 6종: `quiz_start`, `question_answered`, `result_view`, `share_click`, `image_save`(+`image_share`), `retry`.
- ⏳ **GA4 연결 필요**: 측정 ID 발급 → `index.html`에 gtag 스니펫 추가 → 자동 수집. (validate-build 체크 6번이 이벤트 호출 존재를 검증.)

### 1.4 결과 공유/복원 URL — ✅ 코드 완료
- 각 결과에 안정 `id` 부여(`pyeongnaengmyeon` 등). `js/url.js`가 `?rx=<id>` 인코딩.
- 공유 링크 클릭 시 `restoreFromUrl()`이 **결과 카드부터 노출**(`result_view` with `via: 'shared_link'`).
- OG/Twitter 메타 태그 정적 추가. ⏳ **메뉴별 동적 OG는 SSR 필요 → Phase 3**.

**완료 기준(DoD)**: 모바일에서 결과 카드를 1탭으로 저장/공유 ✅(실측완료) + 공유 클릭 트래킹 ✅ + 공유 링크로 결과 재현 ✅.

**Phase 1 잔여(외부 의존):** GA4 측정 ID 발급뿐 (카카오 JS 키·og-image.png는 연결 완료).

---

## Phase 2 — 추천 품질 & 콘텐츠 확장

### 2.1 매칭 엔진 개선 (research.md §6, §7-4) — ✅ 완료 (2026-06-24)
- **맛(q1) 가중치 도입**: q1 태그(mild/spicy/greasy)에 ×2 가중치 적용 → 맛이 1차, 멘탈·예산이 tie-break.
  - spicy 선택 시 9경로 전부 spicy 결과만 반환 확인.
  - 동점 경로 18 → 15로 감소, 최대 쏠림 14.8% 유지, fallback 0.
- **fallback(김치찌개)**: 의도된 안전망으로 유지 (도달 불가는 알려진 특성, `engine.js` 주석에 명시됨).

### 2.2 콘텐츠 풀 확장 (research.md §7-6) — ✅ 완료 (2026-06-24)
- 결과 메뉴 3개 → 12개로 확장 (신규: 떡볶이·순두부찌개·제육볶음·삼겹살·샐러드·부대찌개·비빔밥·라멘·마라탕).
- q3 예산 문항 선택지 2개 → 3개로 확장 (`broke` / `normal(배달앱 쿠폰 있음)` / `rich`).
- 총 조합: 맛(3) × 멘탈(3) × 예산(3) = 27경로. fallback 도달 0, 최대 쏠림 14.8%(삼겹살·떡볶이 4경로).
- `js/data.js`만 수정, 엔진·DOM 계약 무변경.

### 2.3 완전 결정론적 매핑 & 결과 12개 → 18개 확장 — ✅ 완료 (2026-07-25)
- **문제**: 2.1 가중치 도입 후에도 27경로 중 15경로(56%)가 동점 → 같은 답변에도 매번 다른 메뉴가 무작위로 나옴. "처방전" 컨셉(같은 증상엔 같은 처방)과 불일치한다는 사용자 피드백으로 재설계.
- **설계**: 맛×멘탈 9개 조합마다 결과 2개씩 배정 — "넓은" 결과(예산 2개 커버, 4태그) + "좁은" 결과(예산 1개 커버, 3태그). 9조합×2 = 18결과로 27경로를 겹침 없이 정확히 분할.
- **구현**: 기존 3개(`tteokbokki`/`malatang`/`budae-jjigae`)는 태그 1개씩만 추가해 재활용, 나머지 6개(`oil-pasta`/`janchi-guksu`/`maeun-ramyeon`/`jjamppong`/`gopchang`/`wang-donkatsu`) 신규 작성.
- **검증**: 27경로 전수 시뮬레이션 → 동점 0, fallback 0, 결과 18개 전부 최소 1경로 이상 사용, 최대 쏠림 2/27(7.4%, 기존 14.8%에서 개선).
- **동점 무작위 로직**은 `engine.js`에 안전장치로 유지하되 현재 데이터에서는 발동 안 함 — 향후 콘텐츠 추가 시 반드시 재시뮬레이션 필요.

### 2.4 (선택, 보류) 리플레이 다양성
- 2.3에서 "같은 답 = 같은 메뉴"를 설계 원칙으로 확정했으므로, 동점 회피/다양화 아이디어는 보류. 필요해지면 "다시하기" 시 직전 결과와 다른 답변 조합을 유도하는 방향으로 재검토.

### 2.5 김치찌개 정식 승격 + 편의점 세트 2종 추가, 결과 18 → 21개 확장 — ✅ 완료 (2026-07-26)
- **문제**: fallback(김치찌개)이 27경로 완전 결정론적 매핑(2.3) 이후 구조적으로 도달 불가 — "한국인이 가장 많이 먹는 메뉴가 절대 안 나온다"는 사용자 피드백으로 재설계. fallback 메커니즘(방어 코드) 자체와 "김치찌개라는 특정 메뉴가 그 역할을 전담해야 하는 것"은 별개 문제로 분리.
- **설계**: 기존 3개 결과(`pyeongnaengmyeon`/`budae-jjigae`/`malatang`)에서 예산(budget) 슬롯 1개씩을 양도받아 신규 3개를 끼워 넣음 — `kimchijjigae`(fallback 해제, `mild+tired+normal`), `cvs-dosirak`(편의점 도시락, `greasy+tired+normal`), `cvs-ramen`(편의점 컵라면, `spicy+survive+broke`). fallback 역할은 `chikin`(치킨, tags: [])이 신규 승계.
- **검증**: 27경로 전수 시뮬레이션(실제 `engine.js` import, q1 ×2 가중치) → 동점 0, fallback 도달 0(chikin 0회 사용은 정상 — 안전망), 정식 결과 21개 전부 최소 1경로 이상 사용. 결과 총 22개(정식 21 + fallback 1).
- `js/data.js`만 수정, 엔진·DOM 계약 무변경. 설계 산출물/검증 리포트는 `_workspace/01_content-designer_results.js`, `_workspace/02_validator_report.md`에 보존.

---

## Phase 3 — 데이터 외부화 & 확장 기반

> 상용화 신호가 보이면 진행. 코드 주석의 "상용화 시 /data API 분리" 실현.

### 3.1 콘텐츠 JSON 분리
- `data.js` → `data/content.json`(quiz·results) + fetch 로더.
- 기획자가 JSON만 수정 → 배포 없이 콘텐츠 갱신 가능(추후 CMS 후보).

### 3.2 (필요 시) 경량 백엔드
- 공유 OG 동적 생성, 집계 API, 인기 메뉴 통계 등 요구가 생기면 서버리스(예: 정적 호스팅 + 함수) 도입.
- 현 단계에선 **불필요** — 정적 호스팅(Netlify/Vercel/GitHub Pages)으로 충분.

---

## 4. 단계별 우선순위 & 의존성

```
Phase 0 (구조 분리)  ──▶ Phase 1 (공유/트래킹) ──▶ Phase 2 (추천/콘텐츠)
        │                                                   │
        └───────────────── Phase 3 (데이터 외부화) ◀────────┘  (상용화 신호 후)
```

- **Phase 0은 모든 후속 작업의 선행 조건**(인라인 상태로는 확장이 누적 부담).
- Phase 1은 MVP의 핵심 가치(공유율)를 만들므로 0 직후 즉시.
- Phase 2는 1로 데이터가 쌓이기 시작한 뒤 근거 기반으로.

---

## 5. 운영/품질 항목 (전 단계 공통)

- **README.md**: 로컬 실행법(정적 서버 필요), 디렉터리 구조, 콘텐츠 수정 방법.
- **테스트**: `engine.js` 매칭 로직 단위 테스트(태그 조합 → 기대 메뉴). 빌드 없이 돌릴 수 있는 경량 러너 선호.
- **접근성 유지**: 기존 `prefers-reduced-motion`, `aria-hidden`, `lang` 등 회귀 금지.
- **성능**: Tailwind CDN은 프로토타입용 — 트래픽 증가 시 빌드 타임 Tailwind(PostCSS)로 전환 검토(번들 축소).
- **배포**: 정적 호스팅 + 커스텀 도메인. 캐시 무효화 전략.

---

## 6. 즉시 착수 가능한 첫 작업 (Definition of "Start")

1. Phase 0.1~0.2: `index.html`에서 CSS·DATA·엔진·UI·앱 로직을 위 구조로 분리.
2. `engine.js`의 `getResult`를 순수 함수로 추출하고 매핑 검증 스크립트 작성.
3. README에 정적 서버 실행법 추가.

> 이 세 가지가 끝나면 Phase 1(카드 이미지화·트래킹)으로 넘어간다.
```