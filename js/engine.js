/**
 * 태그 교집합 점수로 최적 결과를 반환하는 순수 함수.
 * DOM/전역 상태 의존 없음 → 단위 테스트 가능.
 *
 * 동점 다수 시 무작위 1개 선택.
 * bestScore === 0 이면 fallback 반환 (현 데이터에선 q1 선택이 항상 score≥1을 보장).
 */
export function getResult(tags, results) {
  const fallback = results.find((r) => r.fallback);
  const candidates = results.filter((r) => !r.fallback);

  let bestScore = 0;
  let bestList = [];

  candidates.forEach((result) => {
    const score = result.tags.filter((t) => tags.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      bestList = [result];
    } else if (score === bestScore && score > 0) {
      bestList.push(result);
    }
  });

  if (bestScore === 0 || bestList.length === 0) return fallback || results[0];
  return bestList[Math.floor(Math.random() * bestList.length)];
}
