/* 공유 링크용 URL 헬퍼. 결과를 ?rx=<id>로 인코딩/복원한다. */

export function buildShareUrl(result) {
  const base = location.origin + location.pathname;
  return result && result.id
    ? `${base}?rx=${encodeURIComponent(result.id)}`
    : base;
}

export function getSharedResultId() {
  return new URLSearchParams(location.search).get('rx');
}
