/* 트래킹 래퍼 (North Star = 공유율).
 * gtag(GA4) 또는 dataLayer가 있으면 전송, 없으면(개발 중) 콘솔 디버그.
 * GA4 연결: index.html에 gtag 스니펫 + 측정 ID 추가하면 자동 활성화 (현재 미연결).
 * 트래킹 실패가 UX를 막지 않도록 전부 try/catch.
 */

const DEV =
  location.protocol === 'file:' ||
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1';

export function track(event, params = {}) {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event, ...params });
    }
  } catch (_) {
    /* 트래킹 실패는 조용히 무시 */
  }
  if (DEV) console.debug('[track]', event, params);
}
