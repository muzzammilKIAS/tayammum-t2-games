import '../styles/game.css';
import { $, $$, esc, fmt, render, storage, brand } from '../lib/dom.js';
import { levels, sets, findSet, questionsFor, questionsForSet, publicQuestion, recordAnswer, newPlayer, accuracy, altitude, stars } from '../../shared/game.js';
import { avatarSVG, cleanAvatar } from '../../shared/avatar.js';
import { avatarPicker } from '../components/avatar-picker.js';
import { renderQuestion, renderFeedback } from '../components/question.js';
import { createMountain } from '../components/mountain.js';
import { sfx, shake, flash, floatScore, confetti, banner, combo, crossedCheckpoint } from '../lib/fx.js';

const app = $('#app');
const PROGRESS = 'rmc-solo';
let progress = storage.get(PROGRESS, { levels: {}, unlockAll: false });
progress.sets ??= {};
let avatar = cleanAvatar(storage.get('rmc-avatar'));
const name = () => storage.get('rmc-name', '') || 'Saya';

const unlocked = id => progress.unlockAll || id === 1 || (progress.levels[id - 1]?.bestAccuracy ?? 0) >= 60;
const save = () => storage.set(PROGRESS, progress);
const starRow = (n, max = 3) => `<span class="stars" aria-label="${n} daripada ${max} bintang">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}">★</i>`).join('')}</span>`;

function shell(inner, cls) {
  document.body.className = `solo ${cls}`;
  render(app, `<header class="topbar">${brand()}<div class="topbar-actions"><a class="ghost-link" href="solo.html">Peta solo</a><a class="ghost-link" href="./">Laman utama</a></div></header><main class="solo-main">${inner}</main>`);
}

/* ---------- PETA ---------- */
function showMap() {
  const done = Object.values(progress.levels).reduce((s, l) => s + (l.stars || 0), 0);
  shell(`
  <section class="solo-head">
    <div><span class="eyebrow">PENDAKIAN SOLO</span><h1>Peta ekspedisi anda</h1><p class="lead">Ikut rentak sendiri. Capai ketepatan 60% untuk membuka level seterusnya.</p></div>
    <div class="solo-me"><div class="solo-me-av">${avatarSVG(avatar, { label: name() })}</div><div><strong>${esc(name())}</strong><span>${done} / ${levels.filter(l => l.available).length * 3} bintang</span><button class="btn btn-quiet btn-sm" id="edit">Tukar avatar</button></div></div>
  </section>
  <section class="set-picks solo-sets"><span class="field-label">Set guru · ulang kaji pelajaran</span>${sets.map(t => { const rec = progress.sets[t.id]; return `
    <button class="set-row" data-set="${t.id}"><span class="set-badge">${t.round === 2 ? '↺' : '★'}</span><span class="level-info"><small>SET GURU · ${esc(t.subtitle.toUpperCase())}</small><strong>${esc(t.title)}</strong><span class="set-meta">${t.questions.length} soalan · tanpa pemasa${rec ? ` · terbaik ${rec.bestAccuracy}%` : ''}</span></span><span class="jm-meta">${starRow(rec?.stars || 0)}</span></button>`; }).join('')}</section>
  <ol class="journey-map">${[...levels].reverse().map(l => {
    const rec = progress.levels[l.id], open = l.available && unlocked(l.id);
    return `<li class="jm-node ${l.id % 2 ? 'left' : 'right'} ${open ? 'open' : 'locked'} ${rec ? 'played' : ''}">
      <button class="jm-card" data-level="${l.id}" ${open ? '' : 'disabled'}>
        <span class="jm-badge">${l.id === 7 ? '⚑' : l.id}</span>
        <span class="jm-body"><small>LEVEL ${l.id} · ${esc(l.name.toUpperCase())}</small>
          ${l.available ? l.topics.map(t => `<span class="ar" lang="ar" dir="rtl">${esc(t.title)}</span>`).join('') : '<span class="muted">Topik 13 & 14 belum tersedia dalam sumber.</span>'}
          <span class="jm-meta">${!l.available ? '<span class="tag">Akan datang</span>' : open ? `${starRow(rec?.stars || 0)}${rec ? `<span>Terbaik ${fmt(rec.best)} · ${rec.bestAccuracy}%</span>` : '<span>Belum dicuba</span>'}` : '<span class="tag">🔒 Perlu 60% di level sebelum</span>'}</span>
        </span>
      </button></li>`;
  }).join('')}<li class="jm-base">⛺ BASE CAMP</li></ol>
  <label class="switch teacher"><input type="checkbox" id="unlock" ${progress.unlockAll ? 'checked' : ''}><span class="switch-ui" aria-hidden="true"></span><span><strong>Buka semua level</strong><small>Pilihan guru / demonstrasi.</small></span></label>`, 'screen-map');
  $$('[data-level]').forEach(b => b.onclick = () => play(+b.dataset.level));
  $$('[data-set]').forEach(b => b.onclick = () => play(b.dataset.set));
  $('#unlock').onchange = e => { progress.unlockAll = e.target.checked; save(); showMap(); };
  $('#edit').onclick = () => {
    shell('<section class="panel wide" id="pick"></section>', 'screen-avatar');
    avatarPicker($('#pick'), { avatar, name: name(), doneLabel: 'Simpan', onBack: showMap, onDone: a => { avatar = a; storage.set('rmc-avatar', a); showMap(); } });
  };
}

/* ---------- MAIN ---------- */
function play(levelId) {
  const set = typeof levelId === 'string' ? findSet(levelId) : null;
  const level = set ? { name: set.title, topics: set.topics.map(title => ({ title })) } : levels[levelId - 1];
  const questions = set ? questionsForSet(set.id) : questionsFor(levelId, 12);
  const TOTAL = questions.length, tag = set ? 'Set Guru' : `Level ${levelId}`, store = set ? progress.sets : progress.levels;
  const me = newPlayer({ id: 'me', name: name(), avatar, online: true });
  const started = Date.now();
  shell(`<section class="solo-play">
    <div class="solo-side"><div class="solo-map" id="map"></div>
      <div class="solo-stats" id="stats"></div></div>
    <div class="solo-q"><div class="hud-title"><span>${tag} · ${esc(level.name)}</span><span class="hud-topics" lang="ar" dir="rtl">${level.topics.map(t => esc(t.title)).join(' + ')}</span></div><section id="qwrap" class="q-wrap"></section></div>
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
      const fb = recordAnswer(me, questions, q.id, answer, { elapsedMs: Date.now() - shownAt, calm: !!set });
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
    const acc = accuracy(me), st = stars(acc), rec = store[levelId] || {};
    const isBest = !rec.best || me.score > rec.best;
    store[levelId] = { best: Math.max(rec.best || 0, me.score), bestAccuracy: Math.max(rec.bestAccuracy || 0, acc), stars: Math.max(rec.stars || 0, st), plays: (rec.plays || 0) + 1 };
    save();
    const next = set ? null : levels[levelId], secs = Math.round((Date.now() - started) / 1000), summit = me.correct === TOTAL;
    shell(`<section class="panel center finish">
      <span class="eyebrow">${esc(tag.toUpperCase())} · ${esc(level.name.toUpperCase())}</span>
      <div class="finish-scene ${summit ? 'summit' : ''}">${avatarSVG(avatar, { label: name() })}</div>
      <p class="fb-ar" lang="ar" dir="rtl">${summit ? 'أَحْسَنْتَ! وَصَلْتَ إِلَى الْقِمَّةِ' : 'أَحْسَنْتَ!'}</p>
      <h1>${summit ? 'Puncak ditawan!' : `Anda mendaki ${fmt(altitude(me, TOTAL))} m`}</h1>
      <div class="big-stars">${starRow(st)}</div>
      ${isBest ? '<span class="tag ok">Rekod peribadi baharu!</span>' : ''}
      <div class="summary-grid">
        <div><small>Skor</small><strong>${fmt(me.score)}</strong></div><div><small>Ketepatan</small><strong>${acc}%</strong></div>
        <div><small>Betul / Salah</small><strong>${me.correct} / ${me.wrong}</strong></div><div><small>Rentetan terbaik</small><strong>${me.bestStreak}</strong></div>
        <div><small>Masa</small><strong>${Math.floor(secs / 60)}m ${secs % 60}s</strong></div><div><small>Skor terbaik</small><strong>${fmt(store[levelId].best)}</strong></div>
      </div>
      ${set ? `<p class="hint">${acc >= 80 ? 'Sasaran 80% dicapai. أَحْسَنْتَ!' : 'Sasaran ulang kaji ialah 80%. Baca semula penjelasan, kemudian cuba lagi.'}</p>` : acc < 60 ? '<p class="hint">Capai 60% untuk membuka level seterusnya.</p>' : ''}
      <div class="row-actions"><button class="btn btn-ghost" id="retry">↺ Ulang level</button>${next?.available && unlocked(next.id) ? `<button class="btn btn-gold" id="next">Level ${next.id} →</button>` : ''}<button class="btn btn-primary" id="map-btn">Peta ekspedisi</button></div>
    </section>`, 'screen-ended');
    if (summit) { sfx.summit(); shake(2); confetti(110); } else { sfx.milestone(); confetti(45); }
    $('#retry').onclick = () => play(levelId);
    $('#map-btn').onclick = showMap;
    $('#next')?.addEventListener('click', () => play(next.id));
  };
  ask();
}

const params = new URLSearchParams(location.search), qs = +params.get('level'), qset = params.get('set');
if (qset && findSet(qset)) play(qset);
else if (qs && levels[qs - 1]?.available && unlocked(qs)) play(qs); else showMap();
