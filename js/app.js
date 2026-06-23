/* 진입점: 상태 보유 + 이벤트 바인딩 + 모듈 조립 */

import { DATA, LOADING_MESSAGES } from './data.js';
import { getResult } from './engine.js';
import { show, showQuestion, showLoading, renderResult } from './ui.js';
import { shareKakao, shareImage } from './share.js';
import { track } from './analytics.js';
import { getSharedResultId } from './url.js';

let selectedTags = [];
let currentQuestionIndex = 0;
let currentResult = null;

function startQuiz() {
  selectedTags = [];
  currentQuestionIndex = 0;
  track('quiz_start');
  show('quiz-screen');
  showQuestion(DATA.quiz[0], 0, DATA.quiz.length, selectOption);
}

function selectOption(tags) {
  track('question_answered', { index: currentQuestionIndex, tags });
  selectedTags = selectedTags.concat(tags);
  currentQuestionIndex++;
  if (currentQuestionIndex < DATA.quiz.length) {
    showQuestion(DATA.quiz[currentQuestionIndex], currentQuestionIndex, DATA.quiz.length, selectOption);
  } else {
    showLoading(LOADING_MESSAGES, handleShowResult);
  }
}

function handleShowResult() {
  const result = getResult(selectedTags, DATA.results);
  currentResult = result;
  track('result_view', { menu: result.menu });
  renderResult(result);
  show('result-screen');
}

/* 공유 링크(?rx=<id>)로 들어오면 결과 화면부터 노출 */
function restoreFromUrl() {
  const sharedId = getSharedResultId();
  if (!sharedId) return false;
  const result = DATA.results.find((r) => r.id === sharedId);
  if (!result) return false;
  currentResult = result;
  track('result_view', { menu: result.menu, via: 'shared_link' });
  renderResult(result);
  show('result-screen');
  return true;
}

document.getElementById('start-btn').addEventListener('click', startQuiz);
document.getElementById('retry-btn').addEventListener('click', () => {
  track('retry');
  show('landing-screen');
});
document.getElementById('share-kakao').addEventListener('click', () => {
  track('share_click', { channel: 'kakao' });
  shareKakao(currentResult);
});
document.getElementById('share-insta').addEventListener('click', () => {
  track('share_click', { channel: 'image' });
  shareImage(document.querySelector('.rx-card'), currentResult);
});

restoreFromUrl();
