# Validator Report — q3 선택지 확장(2→3개) 검증

검증 일시: 2026-06-24
검증 대상: js/data.js, js/engine.js, index.html

---

## 1. 모듈 계약

| 항목 | 결과 | 근거 |
|------|------|------|
| `export const DATA` 존재 | PASS | data.js 3행: `export const DATA = {` |
| `export const LOADING_MESSAGES` 존재 | PASS | data.js 141행: `export const LOADING_MESSAGES = [` |
| `DATA.quiz` 3문항 | PASS | q1·q2·q3 각 1개, 배열 길이 3 |
| q3 선택지 3개 | PASS | broke / normal / rich 3개 옵션 확인 |
| `fallback: true` 정확히 1개 | PASS | data.js 128행 김치찌개 단 1개만 존재 |

---

## 2. 처방 필드 완전성

results 총 10개 (비-fallback 9개 + fallback 1개).

| id | tags | menu | message | dosage | sideEffect | combo | share | 결과 |
|----|------|------|---------|--------|------------|-------|-------|------|
| pyeongnaengmyeon | O | O | O | O | O | O | O | PASS |
| maeun-galbijjim | O | O | O | O | O | O | O | PASS |
| cheese-donkatsu | O | O | O | O | O | O | O | PASS |
| tteokbokki | O | O | O | O | O | O | O | PASS |
| soondubu-jjigae | O | O | O | O | O | O | O | PASS |
| jeyuk-bokkeum | O | O | O | O | O | O | O | PASS |
| samgyeopsal | O | O | O | O | O | O | O | PASS |
| salad | O | O | O | O | O | O | O | PASS |
| budae-jjigae | O | O | O | O | O | O | O | PASS |
| kimchijjigae (fallback) | O(빈배열) | O | O | O | O | O | O | PASS |

모든 필드 완전성: **PASS**

---

## 3. 필수 DOM ID 18개

`index.html` 내 Grep 결과.

| id | 존재 |
|----|------|
| landing-screen | PASS (64행) |
| quiz-screen | PASS (83행) |
| loading-screen | PASS (100행) |
| result-screen | PASS (106행) |
| start-btn | PASS (75행) |
| progress-text | PASS (87행) |
| progress-dots | PASS (89행) |
| question-text | PASS (95행) |
| options | PASS (96행) |
| loading-msg | PASS (102행) |
| result-menu | PASS (126행) |
| result-message | PASS (127행) |
| rx-dosage | PASS (136행) |
| rx-sideeffect | PASS (140행) |
| rx-combo | PASS (144행) |
| share-kakao | PASS (159행) |
| share-insta | PASS (163행) |
| retry-btn | PASS (169행) |

18개 전부 존재: **PASS**

---

## 4. 태그 시뮬레이션 (27경로)

실행: `node -e "Promise.all([import('./js/data.js'),import('./js/engine.js')]).then(...)"`

실행 결과:
```
paths 27 fallback 0
{
  "평양냉면": 6,
  "순두부찌개": 2,
  "매운 갈비찜": 3,
  "제육볶음": 5,
  "치즈 돈까스": 3,
  "떡볶이": 3,
  "부대찌개": 1,
  "삼겹살": 4
}
```

| 항목 | 결과 | 근거 |
|------|------|------|
| 총 경로 = 27 | PASS | 3×3×3 = 27 경로 전부 순회 |
| fallback = 0 | PASS | q1 선택이 항상 score>=1 보장 |
| 최대 독식 < 14경로(50%) | PASS | 최다 평양냉면 6경로(22.2%) |

**WARN: 샐러드(id=salad) 도달 경로 0**

- 원인: salad 태그 = `['mild', 'rich', 'normal']`. `normal`과 `rich`는 q3의 서로 다른 선택지라 동시 선택 불가 → 실제 최대 교집합 1점.
- 경합 상황: `mild + X + rich` 경로에서 순두부찌개(mild·tired·rich, 점수 2)와 매운 갈비찜(spicy·angry·rich, 점수 2)이 항상 앞서 샐러드(점수 1)를 이긴다. `mild + X + normal` 경로에서도 평양냉면(mild·tired·broke·normal, 점수 2) 또는 제육볶음(spicy·survive·normal, 점수 2) 등이 먼저 선택된다.
- 이는 FAIL이 아닌 **WARN**으로 분류 (분포 50% 쏠림 없음, fallback=0). 단, 현행 태그 구성으로 샐러드는 실제 처방 불가 상태.
- 수정 책임 위치: `js/data.js` → `salad` 항목의 `tags` 배열
- 권장 수정 예: `['mild', 'rich', 'normal']` → `['mild', 'survive', 'rich']` 또는 `['mild', 'tired', 'normal']` 등 q1·q2·q3 각 1개씩 조합으로 변경

---

## 5. JS 구문

```
node --check js/data.js → SYNTAX OK
```

| 파일 | 결과 |
|------|------|
| js/data.js | PASS |

---

## 종합 결과

| 검증 항목 | 결과 |
|-----------|------|
| 1. 모듈 계약 | PASS |
| 2. 처방 필드 완전성 | PASS |
| 3. 필수 DOM ID 18개 | PASS |
| 4. 태그 시뮬레이션 | PASS (WARN 1개) |
| 5. JS 구문 | PASS |

**FAIL: 0개 / WARN: 1개**

WARN 내용: `salad`(id=salad) 태그 `['mild', 'rich', 'normal']`에 q3 동일 문항 태그(`normal`, `rich`) 2개가 포함돼 구조적으로 도달 불가. 27개 경로 중 샐러드 처방 0회. 수정 필요 위치: `js/data.js` salad 항목 `tags` 배열.
