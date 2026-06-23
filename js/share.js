/* 공유 로직.
 * - shareImage: 처방전 카드를 PNG로 렌더 → Web Share API(파일) 우선, 미지원 시 다운로드 폴백. (North Star 핵심)
 * - shareKakao: Kakao SDK 연동(키 설정 시) → 미설정 시 공유 문구 클립보드 복사 폴백.
 */

import { toast } from './ui.js';
import { track } from './analytics.js';
import { buildShareUrl } from './url.js';

const HTML_TO_IMAGE_CDN = 'https://esm.sh/html-to-image@1.11.11';
let _lib = null;

async function loadLib() {
  if (!_lib) _lib = await import(HTML_TO_IMAGE_CDN);
  return _lib;
}

async function renderCardPng(cardEl) {
  // 명조 폰트·이모지가 캡처에 들어가도록 폰트 로드 대기
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const { toPng } = await loadLib();
  return toPng(cardEl, { pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' });
}

export async function shareImage(cardEl, result) {
  if (!cardEl) return;
  let dataUrl;
  try {
    dataUrl = await renderCardPng(cardEl);
  } catch (_) {
    toast('이미지 생성에 실패했어요. 화면을 캡처해 주세요 📸');
    return;
  }

  const fileName = `점심처방전_${result ? result.menu : '결과'}.png`;

  // 1) Web Share API (파일 공유 지원 시 — 모바일)
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        text: result ? result.share : '점심 처방전',
        url: buildShareUrl(result),
      });
      track('image_share', { menu: result && result.menu });
      return;
    }
  } catch (_) {
    /* 공유 취소 또는 미지원 → 다운로드 폴백 */
  }

  // 2) 다운로드 폴백 (데스크톱 등)
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  a.click();
  track('image_save', { menu: result && result.menu });
  toast('처방전 이미지를 저장했어요! 스토리에 올려보세요 📸');
}

export function shareKakao(result) {
  const text = result ? result.share : '';

  // 실제 카카오 연동 (index.html에 SDK + Kakao.init(KEY) 추가 시 자동 활성화)
  if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: result ? `오늘의 처방: ${result.menu}` : '점심 처방전',
          description: text,
          imageUrl: location.origin + '/og-image.png',
          link: { mobileWebUrl: buildShareUrl(result), webUrl: buildShareUrl(result) },
        },
      });
      return;
    } catch (_) {
      /* SDK 오류 → 클립보드 폴백 */
    }
  }

  // 폴백: 공유 문구 클립보드 복사
  if (navigator.clipboard && text) {
    navigator.clipboard.writeText(text).then(
      () => toast('공유 문구를 복사했어요! 카톡에 붙여넣기 💬'),
      () => toast('화면을 캡처해서 공유해보세요! 💬'),
    );
  } else {
    toast('화면을 캡처해서 공유해보세요! 💬');
  }
}
