# 점심 처방전 — MVP 빌드업 & 리팩토링 실행 계획

> 작성일: 2026-06-23
> 기준 문서: [research.md](research.md) · [lunch_prescription_blueprint.md](lunch_prescription_blueprint.md)
> 현재 상태: Phase 0 완료 + Phase 1 브라우저 실측 완료(외부 키/에셋만 잔여). `js/` 8모듈.

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
| 1 | fallback(김치찌개) 도달 불가 죽은 코드 | 매칭 로직 재설계 or 의도적 노출 경로 마련 | Phase 2 |
| 2 | ~~공유율(North Star) 측정 코드 없음~~ | 이벤트 트래킹 도입 | 🚧 Phase 1 코드완료(GA4 ID 대기) |
| 3 | ~~공유가 프로토타입(클립보드/토스트)만~~ | 카드 이미지화 + 실제 공유 | 🚧 Phase 1 코드완료(실측·키 대기) |
| 4 | 맛(q1) 가중치 미반영 → 메뉴 어긋남 | 가중치 도입 or 설계 정합 | Phase 2 |
| 5 | ~~데이터 인라인 하드코딩~~ | ~~모듈/JSON 분리~~ | ✅ Phase 0 완료 |
| 6 | 결과 풀 3개로 협소 | 콘텐츠 확장 | Phase 2 |

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
> **코드 구현분은 완료**, 외부 키/에셋 연결만 남음 (아래 ⏳ 표시).

### 1.1 처방전 카드 이미지화 (최우선) — ✅ 코드 완료
- 결과 카드(`.rx-card`)를 PNG로 변환 → 저장/공유. `js/share.js`의 `shareImage()`.
- `html-to-image`를 **esm.sh CDN 동적 import**로 로드 (무빌드 유지, 초기 로드 비영향).
- 모바일 **Web Share API**(`navigator.canShare({files})`) 우선 → 미지원 시 **다운로드 폴백**.
- 폰트 로드 대기(`document.fonts.ready`) + `pixelRatio: 2`로 명조·이모지·바코드 캡처 품질 확보.
- '스토리 공유' 버튼(`share-insta`)이 이 함수를 호출 → 인스타/이미지 공유 일원화.
- ⏳ **브라우저 실측 필요**: 정적 서버 띄워 실제 PNG 품질·Web Share 동작 확인. `og-image.png` 에셋 추가.

### 1.2 실제 공유 연동 — 🟡 스캐폴드 완료 (키 대기)
- **카카오**: `js/share.js`의 `shareKakao()`가 `Kakao.Share.sendDefault` 호출 준비 완료. `window.Kakao` 미초기화 시 **공유 문구 클립보드 복사 폴백**.
  - ⏳ 카카오 디벨로퍼스 JS 키 발급 → `index.html`의 주석 처리된 SDK 2줄 해제 + 키 교체 → 자동 활성화.
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

**Phase 1 잔여(외부 의존):** ① 카카오 JS 키 ② GA4 측정 ID ③ og-image.png 에셋.

---

## Phase 2 — 추천 품질 & 콘텐츠 확장

### 2.1 매칭 엔진 개선 (research.md §6, §7-4)
- **맛(q1) 가중치 도입**: 설계도 §3는 맛을 1차 기준으로 의도. 현재는 동등 가중치라 맛이 멘탈+예산에 밀림.
  - 방안 A(권장): 맛 태그 점수 가중(예: ×2) → 맛이 1차, 멘탈/예산이 동점 tie-break.
  - 방안 B: 2단계 매칭 — 맛으로 후보군 1차 확정 후 멘탈/예산으로 세부 선택.
- **fallback 재설계** (research.md §7-1): 현재 도달 불가.
  - 옵션 1: 진짜 무응답/엣지 케이스에서만 노출되게 두되, 코드 주석으로 "의도된 안전망"임을 명시.
  - 옵션 2: 김치찌개를 일반 결과로 승격하고 별도 디폴트 카피 제공.
- 변경 시 `engine.js` 순수 함수 유지 → **단위 테스트로 회귀 방지**.

### 2.2 콘텐츠 풀 확장 (research.md §7-6)
- 결과 메뉴를 3개 → 8~12개로 확장하여 입력 조합 대비 결과 다양성 확보.
- 태그 체계 정리: 맛(3) × 멘탈(3) × 예산(2) = 18 조합 대비 결과 매핑 표 작성(기획 협업).
- 카피 톤("킹받는 츤데레") 가이드 문서화하여 신규 메뉴 추가 시 일관성 유지.

### 2.3 (선택) 문항/리플레이 다양성
- 동점 랜덤(현 동작)을 유지하되, "다시하기" 시 직전 결과 회피 옵션 검토.

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