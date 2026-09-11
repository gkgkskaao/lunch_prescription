/**
 * CONTENT-DESIGNER 산출물 — normal 태그 커버리지 설계 (2026-06-24)
 *
 * 작업 내용:
 * 1. q3에 { label: '배달앱 쿠폰 있음', tags: ['normal'] } 선택지 추가 (broke/normal/rich 3지)
 * 2. 기존 results 6개에 normal 태그 병기 (방식 A)
 *
 * ── normal 태그 부여 결과 목록 ──
 *
 * [기존 태그 유지 + normal 추가]
 * pyeongnaengmyeon : ['mild', 'tired', 'broke'] → ['mild', 'tired', 'broke', 'normal']
 *   이유: mild+tired+normal 경로에서 score:3으로 확정 매핑
 *
 * tteokbokki       : ['spicy', 'broke'] → ['spicy', 'broke', 'normal']
 *   이유: spicy+broke/tired/normal 경로에서 spicy+normal=2점 커버
 *
 * jeyuk-bokkeum    : ['spicy', 'survive'] → ['spicy', 'survive', 'normal']
 *   이유: spicy+survive+normal 경로에서 score:3으로 확정 매핑
 *
 * samgyeopsal      : ['greasy', 'angry'] → ['greasy', 'angry', 'normal']
 *   이유: greasy+angry+normal 경로에서 score:3으로 확정 매핑
 *
 * salad            : ['mild', 'rich'] → ['mild', 'rich', 'normal']
 *   이유: mild+angry/survive+normal 경로에서 mild+normal=2점 커버
 *
 * budae-jjigae     : ['greasy', 'broke'] → ['greasy', 'broke', 'normal']
 *   이유: greasy+tired/angry/survive+normal 경로에서 greasy+normal=2점 커버
 *
 * [변경 없는 results]
 * maeun-galbijjim  : ['spicy', 'angry', 'rich'] — 유지 (spicy+angry+rich 전용)
 * cheese-donkatsu  : ['greasy', 'survive', 'rich'] — 유지 (greasy+survive+rich 전용)
 * soondubu-jjigae  : ['mild', 'tired', 'rich'] — 유지 (mild+tired+rich 전용)
 * kimchijjigae     : [] fallback — 유지
 *
 * ── 27경로 시뮬레이션 결과 ──
 *
 * total: 27 | fallback: 0 | max single: 4/27 = 14.8%
 *
 * distribution:
 * {
 *   "평양냉면":    4,
 *   "순두부찌개":  2,
 *   "삼겹살":      4,
 *   "샐러드":      2,
 *   "치즈 돈까스": 2,
 *   "떡볶이":      3,
 *   "매운 갈비찜": 4,
 *   "제육볶음":    2,
 *   "부대찌개":    4
 * }
 *
 * normal 경로 9개 상세 (동점은 무작위 — 실행마다 변동 가능):
 * mild+tired+normal    -> 평양냉면  (score:3, 확정)
 * mild+angry+normal    -> 평양냉면/샐러드 (score:2, 동점 무작위)
 * mild+survive+normal  -> 샐러드/제육볶음 (score:2, 동점 무작위)
 * spicy+tired+normal   -> 떡볶이/제육볶음 (score:2, 동점 무작위)
 * spicy+angry+normal   -> 매운갈비찜/떡볶이 (score:2, 동점 무작위)
 * spicy+survive+normal -> 제육볶음  (score:3, 확정)
 * greasy+tired+normal  -> 부대찌개/삼겹살 (score:2, 동점 무작위)
 * greasy+angry+normal  -> 삼겹살    (score:3, 확정)
 * greasy+survive+normal-> 부대찌개/치즈돈까스 (score:2, 동점 무작위)
 *
 * 판정: PASS (fallback 0, 최대 14.8% < 50%, 9개 결과 모두 등장)
 */

// normal 태그 추가된 results 6개 (변경 항목만 발췌)
const CHANGED_RESULTS = [
  { id: 'pyeongnaengmyeon', tags: ['mild', 'tired', 'broke', 'normal'] },
  { id: 'tteokbokki',       tags: ['spicy', 'broke', 'normal'] },
  { id: 'jeyuk-bokkeum',    tags: ['spicy', 'survive', 'normal'] },
  { id: 'samgyeopsal',      tags: ['greasy', 'angry', 'normal'] },
  { id: 'salad',            tags: ['mild', 'rich', 'normal'] },
  { id: 'budae-jjigae',     tags: ['greasy', 'broke', 'normal'] },
];

export default CHANGED_RESULTS;
