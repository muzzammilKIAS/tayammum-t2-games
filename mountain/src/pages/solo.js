import '../styles/game.css';
import { $, $$, esc, fmt, render, storage, brand } from '../lib/dom.js';
import { sets, findSet, questionsForSet, publicQuestion, recordAnswer, newPlayer, accuracy, altitude, stars } from '../../shared/game.js';
import { avatarSVG, cleanAvatar } from '../../shared/avatar.js';
import { avatarPicker } from '../components/avatar-picker.js';
import { renderQuestion, renderFeedback } from '../components/question.js';
import { createMountain } from '../components/mountain.js';
import { sfx, shake, flash, floatScore, confetti, banner, combo, crossedCheckpoint } from '../lib/fx.js';

const app = $('#app');
const PROGRESS = 'tm-solo';
let progress = storage.get(PROGRESS, { sets: {} });
progress.sets ??= {};
let avatar = cleanAvatar(storage.get('tm-avatar'));
const name = () => storage.get('tm-name', '') || 'Saya';

const save = () => storage.set(PROGRESS, progress);
const starRow = (n, max = 3) => `<span class="stars" aria-label="${n} daripada ${max} bintang">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}">★</i>`).join('')}</span>`;

function shell(inner, cls) {
  document.body.className = `solo ${cls}`;
  render(app, `<header class="topbar">${brand()}<div class="topbar-actions"><a class="ghost-link" href="solo.html">Peta solo</a><a class="ghost-link" href="./">Laman utama</a></div></header><main class="solo-main">${inner}</main>`);
}

/* ---------- PETA ---------- */
function showMap() {
  const done = Object.values(progress.sets).reduce((n, l) => n + (l.stars || 0), 0);
  shell(`
  <section class="solo-head">
    <div><span class="eyebrow">PENDAKIAN SOLO</span><h1>Pilih set Tayammum</h1><p class="lead">Ikut rentak sendiri. Tiga set soalan Tayammum untuk Tingkatan 2: asas, tebus dan klinik fiqah. Sasaran ulang kaji ialah 80%.</p></div>
    <div class="solo-me"><div class="solo-me-av">${avatarSVG(avatar, { label: name() })}</div><div><strong>${esc(name())}</strong><span>${done} / ${sets.length * 3} bintang</span><button class="btn btn-quiet btn-sm" id="edit">Tukar avatar</button></div></div>
  </section>
  <section class="set-picks solo-sets"><span class="field-label">Set guru · ulang kaji Tayammum</span>${sets.map(t => { const rec = progress.sets[t.id]; return `
    <button class="set-row" data-set="${t.id}"><span class="set-badge">${t.round === 2 ? '↺' : '★'}</span><span class="level-info"><small>SET GURU · ${esc(t.subtitle.toUpperCase())}</small><strong>${esc(t.title)}</strong><span class="set-meta">${t.questions.length} soalan · tanpa pemasa${rec ? ` · terbaik ${rec.bestAccuracy}%` : ''}</span></span><span class="jm-meta">${starRow(rec?.stars || 0)}</span></button>`; }).join('')}</section>`, 'screen-map');
  $$('[data-set]').forEach(b => b.onclick = () => play(b.dataset.set));
  $('#edit').onclick = () => {
    shell('<section class="panel wide" id="pick"></section>', 'screen-avatar');
    avatarPicker($('#pick'), { avatar, name: name(), doneLabel: 'Simpan', onBack: showMap, onDone: a => { avatar = a; storage.set('tm-avatar', a); showMap(); } });
  };
}

/* ---------- MAIN ---------- */
function play(setId) {
  const set = findSet(setId);
  const level = { name: set.title, topics: set.topics };
  const questions = questionsForSet(set.id);
  const TOTAL = questions.length, tag = 'Set Guru', store = progress.sets;
  const me = newPlayer({ id: 'me', name: name(), avatar, online: true });
  const started = Date.now();
  shell(`<section class="solo-play">
    <div class="solo-side"><div class="solo-map" id="map"></div>
      <div class="solo-stats" id="stats"></div></div>
    <div class="solo-q"><div class="hud-title"><span>${tag} · ${esc(level.name)}</span><span class="hud-topics">${level.topics.map(esc).join(' + ')}</span></div><section id="qwrap" class="q-wrap"></section></div>
  </section>`, 'screen-play');
  const map = createMountain($('#map'), { total: TOTAL, compact: true, me: 'me' });
  let view;
  const updateSide = () => {
    map.update([{ ...me, rank: 1, altitude: altitude(me, TOTAL) }]);
    $('#stats').innerHTML = [['Altitud', `${fmt(altitude(me, TOTAL))} m`], ['Skor', fmt(me.score)], ['Soalan', `${Math.min(me.index + 1, TOTAL)}/${TOTAL}`], ['Rentetan', me.streak]].map(([l, v]) => `<div><small>${l}</small><strong>${v}</strong></div>`).join('');
  };
  const ask = () => {
    updateSide();
    const q = { ...publicQuestion(questions[me.index]), index: me.index, total: TOTAL, timer: 0 };
    const shownAt = Date.now();
    view?.destroy();
    view = renderQuestion($('#qwrap'), q, { onSubmit: answer => {
      const before = me.correct;
      const fb = recordAnswer(me, questions, q.id, answer, { elapsedMs: Date.now() - shownAt, calm: true });
      updateSide();
      const card = $('#qwrap');
      if (fb.correct) {
        sfx.correct(fb.streak); shake(); flash('gold');
        floatScore(`+${fmt(fb.score)}`, card);
        combo(fb.streak, card);
      } else { sfx.wrong(); shake(); flash('red'); }
      renderFeedback(card, fb, { answer, question: q, onNext: () => me.finished ? finish() : ask() });
      const cp = fb.correct && !me.finished ? crossedCheckpoint(before, me.correct, TOTAL) : null;
      if (cp) banner(cp.title, cp.sub);
    } });
    $('#qwrap').scrollIntoView({ block: 'nearest' });
  };
  const finish = () => {
    view?.destroy();
    const acc = accuracy(me), st = stars(acc), rec = store[setId] || {};
    const isBest = !rec.best || me.score > rec.best;
    store[setId] = { best: Math.max(rec.best || 0, me.score), bestAccuracy: Math.max(rec.bestAccuracy || 0, acc), stars: Math.max(rec.stars || 0, st), plays: (rec.plays || 0) + 1 };
    save();
    const next = sets[sets.findIndex(x => x.id === setId) + 1], secs = Math.round((Date.now() - started) / 1000), summit = me.correct === TOTAL;
    shell(`<section class="panel center finish">
      <span class="eyebrow">${esc(tag.toUpperCase())} · ${esc(level.name.toUpperCase())}</span>
      <div class="finish-scene ${summit ? 'summit' : ''}">${avatarSVG(avatar, { label: name() })}</div>
      <h1>${summit ? 'Puncak ditawan!' : `Anda mendaki ${fmt(altitude(me, TOTAL))} m`}</h1>
      <div class="big-stars">${starRow(st)}</div>
      ${isBest ? '<span class="tag ok">Rekod peribadi baharu!</span>' : ''}
      <div class="summary-grid">
        <div><small>Skor</small><strong>${fmt(me.score)}</strong></div><div><small>Ketepatan</small><strong>${acc}%</strong></div>
        <div><small>Betul / Salah</small><strong>${me.correct} / ${me.wrong}</strong></div><div><small>Rentetan terbaik</small><strong>${me.bestStreak}</strong></div>
        <div><small>Masa</small><strong>${Math.floor(secs / 60)}m ${secs % 60}s</strong></div><div><small>Skor terbaik</small><strong>${fmt(store[setId].best)}</strong></div>
      </div>
      <p class="hint">${acc >= 80 ? 'Sasaran 80% dicapai. Tahniah!' : 'Sasaran ulang kaji ialah 80%. Baca semula penjelasan, kemudian cuba lagi.'}</p>
      <div class="row-actions"><button class="btn btn-ghost" id="retry">↺ Ulang set</button>${next ? `<button class="btn btn-gold" id="next">${esc(next.title)} →</button>` : ''}<button class="btn btn-primary" id="map-btn">Pilih set lain</button></div>
    </section>`, 'screen-ended');
    if (summit) { sfx.summit(); shake(2); confetti(110); } else { sfx.milestone(); confetti(45); }
    $('#retry').onclick = () => play(setId);
    $('#map-btn').onclick = showMap;
    $('#next')?.addEventListener('click', () => play(next.id));
  };
  ask();
}

const qset = new URLSearchParams(location.search).get('set');
if (qset && findSet(qset)) play(qset); else showMap();
