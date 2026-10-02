import { $, $$, esc, fmt } from '../lib/dom.js';

export const typeLabel = { vocabulary: 'Kosa kata', translation: 'Terjemahan', 'fill-blank': 'Lengkapkan ayat', 'multiple-choice': 'Soal jawab', arrange: 'Susun ayat' };
const letters = ['A', 'B', 'C', 'D', 'E'];

/**
 * Papar soalan. Panggil onSubmit(jawapan) sekali sahaja; null bermakna masa tamat.
 * @returns {{destroy:Function, lastAnswer:()=>any}}
 */
export function renderQuestion(el, q, { onSubmit, remaining = null }) {
  let sent = false, chosen = null, timerId = null;
  const arabicMain = q.questionAr ? `<p class="q-main ar" lang="ar" dir="rtl">${esc(q.questionAr).replace('＿＿＿', '<span class="blank">＿＿＿</span>')}</p>` : `<p class="q-main ms${(q.questionMs || '').length > 40 ? ' long' : ''}">${esc(q.questionMs)}</p>`;
  el.innerHTML = `
  <article class="q-card" data-type="${q.type}">
    <header class="q-head"><span class="q-type">${typeLabel[q.type] || 'Soalan'}</span><span class="q-count">Soalan ${q.index + 1} / ${q.total}</span></header>
    ${q.timer ? `<div class="q-timer" role="timer" aria-label="Masa berbaki"><i></i><span></span></div>` : ''}
    <p class="q-prompt">${esc(q.prompt)}</p>
    ${q.image ? `<figure class="q-media"><img src="${esc(q.image)}" alt="${esc(q.imageAlt || '')}"></figure>` : ''}
    ${q.audio ? `<button type="button" class="q-audio" data-audio aria-label="Dengar audio sebutan"><span aria-hidden="true">🔊</span> Dengar sebutan</button>` : ''}
    ${q.type === 'arrange' ? '' : arabicMain}
    <div class="q-body"></div>
    <p class="q-topic" lang="ar" dir="rtl">${esc(q.topicTitle)}</p>
  </article>`;
  const body = $('.q-body', el);
  let clip = null;
  const audioBtn = $('[data-audio]', el);
  if (audioBtn) audioBtn.onclick = () => { clip ??= new Audio(q.audio); clip.currentTime = 0; audioBtn.classList.add('playing'); clip.onended = () => audioBtn.classList.remove('playing'); clip.play().catch(() => audioBtn.classList.remove('playing')); };

  const submit = answer => {
    if (sent) return; sent = true; chosen = answer; clearInterval(timerId);
    el.querySelector('.q-card').classList.add('is-sent');
    $$('button', body).forEach(b => b.disabled = true);
    onSubmit(answer);
  };

  if (q.type === 'arrange') {
    const placed = [];
    const arTokens = q.tokens.some(t => /[\u0600-\u06FF]/.test(t)), tokAttr = arTokens ? 'dir="rtl" lang="ar"' : 'dir="ltr" lang="ms"'; // token Melayu: kiri ke kanan
    body.innerHTML = `<div class="arrange-line" ${tokAttr} aria-label="Ayat anda"></div><div class="arrange-bank" ${tokAttr}></div><div class="arrange-actions"><button class="btn btn-ghost" data-reset>Set semula</button><button class="btn btn-primary" data-check disabled>Semak jawapan</button></div>`;
    const line = $('.arrange-line', body), bank = $('.arrange-bank', body);
    const draw = () => {
      line.innerHTML = placed.length ? placed.map((i, k) => `<button class="token placed" data-k="${k}">${esc(q.tokens[i])}</button>`).join('') : '<span class="arrange-hint">Ketik perkataan di bawah mengikut susunan yang betul</span>';
      bank.innerHTML = q.tokens.map((t, i) => `<button class="token" data-i="${i}" ${placed.includes(i) ? 'disabled aria-hidden="true"' : ''}>${esc(t)}</button>`).join('');
      $('[data-check]', body).disabled = placed.length !== q.tokens.length;
      $$('[data-i]', bank).forEach(b => b.onclick = () => { if (!sent) { placed.push(+b.dataset.i); draw(); } });
      $$('[data-k]', line).forEach(b => b.onclick = () => { if (!sent) { placed.splice(+b.dataset.k, 1); draw(); } });
    };
    draw();
    $('[data-reset]', body).onclick = () => { placed.length = 0; draw(); };
    $('[data-check]', body).onclick = () => submit(placed.map(i => q.tokens[i]));
  } else {
    body.innerHTML = `<div class="options ${q.optionsDir === 'rtl' ? 'opt-ar' : 'opt-ms'}">${q.options.map((o, i) => `<button class="option" data-i="${i}"><span class="opt-key">${letters[i]}</span><span class="opt-text" ${q.optionsDir === 'rtl' ? 'lang="ar" dir="rtl"' : ''}>${esc(o)}</span></button>`).join('')}</div>`;
    $$('.option', body).forEach(b => b.onclick = () => { b.classList.add('picked'); submit(+b.dataset.i); });
  }

  if (q.timer) {
    const limit = q.timer * 1000, end = Date.now() + (remaining ?? limit);
    const bar = $('.q-timer i', el), label = $('.q-timer span', el);
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      bar.style.transform = `scaleX(${left / limit})`;
      label.textContent = `${Math.ceil(left / 1000)}s`;
      el.querySelector('.q-timer').classList.toggle('low', left < 5000);
      if (left <= 0) submit(null);
    };
    tick(); timerId = setInterval(tick, 200);
  }
  const onKey = e => { if (sent || q.type === 'arrange' || e.target.closest('input')) return; const i = letters.indexOf(e.key.toUpperCase()); const n = +e.key - 1; const k = i >= 0 ? i : n; if (k >= 0 && k < q.options.length) $$('.option', body)[k].click(); };
  document.addEventListener('keydown', onKey);
  return { destroy() { clearInterval(timerId); clip?.pause(); document.removeEventListener('keydown', onKey); }, lastAnswer: () => chosen, question: q };
}

/** Tanda jawapan pada kad dan papar maklum balas. */
export function renderFeedback(el, fb, { onNext, answer, question, nextLabel }) {
  if (question && question.type !== 'arrange') {
    $$('.option', el).forEach((b, i) => {
      const text = question.options[i];
      if (text === fb.correctText) b.classList.add('correct');
      else if (i === answer) b.classList.add('wrong');
    });
  }
  const explain = fb.explanation && fb.explanation !== fb.correctText
    ? (/[A-Za-z]{3,}/.test(fb.explanation) ? `<p class="fb-explain ms" dir="ltr" lang="ms">${esc(fb.explanation)}</p>` : `<p class="fb-explain" lang="ar" dir="auto">${esc(fb.explanation)}</p>`) : '';
  const box = document.createElement('div');
  box.className = `feedback ${fb.correct ? 'is-correct' : 'is-wrong'}`;
  box.setAttribute('role', 'status');
  box.innerHTML = fb.correct
    ? `<div class="fb-icon" aria-hidden="true">✓</div><p class="fb-ar" lang="ar" dir="rtl">أَحْسَنْتَ!</p><h3>Betul!</h3><div class="fb-gain"><span>+${fmt(fb.score)} mata</span><span>+${fmt(fb.metres)} m</span>${fb.streak >= 2 ? `<span>🔥 ${fb.streak} berturut</span>` : ''}</div>${explain}`
    : `<div class="fb-icon" aria-hidden="true">${fb.timedOut ? '⌛' : '↺'}</div><p class="fb-ar" lang="ar" dir="rtl">حَاوِلْ مَرَّةً أُخْرَى</p><h3>${fb.timedOut ? 'Masa tamat' : 'Belum tepat'}</h3><p class="fb-answer">Jawapan betul: <strong lang="ar" dir="auto">${esc(fb.correctText)}</strong></p>${explain}<p class="fb-note">Altitud kekal. Cuba lagi pada soalan seterusnya!</p>`;
  const btn = document.createElement('button');
  btn.className = 'btn btn-gold btn-xl'; btn.innerHTML = `${nextLabel || (fb.finished ? 'Lihat keputusan' : 'Teruskan mendaki')} <span aria-hidden="true">↑</span>`;
  btn.onclick = () => { btn.disabled = true; onNext(); };
  box.append(btn);
  el.querySelector('.q-card').append(box);
  btn.focus({ preventScroll: true });
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
