/* DOM 조작 전담. 순수 함수에 가깝게 — 상태는 app.js가 보유. */

const SCREENS = ['landing-screen', 'quiz-screen', 'loading-screen', 'result-screen'];
const $ = (id) => document.getElementById(id);

export function show(screenId) {
  SCREENS.forEach((id) => {
    const el = $(id);
    el.classList.toggle('hidden', id !== screenId);
    if (id !== screenId) el.classList.remove('flex');
    else el.classList.add('flex');
  });
}

export function showQuestion(q, index, total, onSelect) {
  $('question-text').textContent = q.question;
  $('progress-text').textContent = `${index + 1} / ${total}`;

  [...$('progress-dots').children].forEach((dot, i) => {
    dot.className = 'dot flex-1 h-1 rounded ' +
      (i < index ? 'bg-emerald-300' : i === index ? 'bg-emerald-500' : 'bg-emerald-100');
  });

  const optionsEl = $('options');
  optionsEl.innerHTML = '';
  q.options.forEach((option) => {
    const btn = document.createElement('button');
    btn.className =
      'w-full text-left px-[18px] py-4 text-[14px] font-medium text-rx-sub bg-white ' +
      'border-[1.5px] border-emerald-700/15 rounded-xl transition ' +
      'hover:bg-rx-surface hover:border-rx-accent hover:text-rx-deep active:scale-[0.98]';
    btn.textContent = option.label;
    btn.addEventListener('click', () => onSelect(option.tags));
    optionsEl.appendChild(btn);
  });
}

export function showLoading(messages, callback) {
  show('loading-screen');
  const msgEl = $('loading-msg');
  let i = 0;
  msgEl.textContent = messages[0];
  const interval = setInterval(() => {
    i = (i + 1) % messages.length;
    msgEl.textContent = messages[i];
  }, 700);
  setTimeout(() => {
    clearInterval(interval);
    try {
      callback();
    } catch (e) {
      console.error('[showLoading] 결과 렌더 실패:', e);
    }
  }, 2500);
}

export function renderResult(result) {
  $('result-menu').textContent = result.emoji ? `${result.emoji} ${result.menu}` : result.menu;
  $('result-message').textContent = result.message;
  $('rx-dosage').textContent = result.dosage;
  $('rx-sideeffect').textContent = result.sideEffect;
  $('rx-combo').textContent = result.combo;
  if (result.barcode) $('barcode-num').textContent = result.barcode;
}

export function toast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('toast-visible'), 10);
  setTimeout(() => {
    t.classList.remove('toast-visible');
    setTimeout(() => t.remove(), 300);
  }, 2500);
}
