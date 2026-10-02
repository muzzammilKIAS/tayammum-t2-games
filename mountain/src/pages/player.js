import '../styles/game.css';
import { $, esc, fmt, render, toast, storage, brand } from '../lib/dom.js';
import { connect } from '../lib/net.js';
import { avatarSVG, cleanAvatar } from '../../shared/avatar.js';
import { avatarPicker } from '../components/avatar-picker.js';
import { renderQuestion, renderFeedback } from '../components/question.js';
import { sfx, shake, flash, floatScore, confetti, banner, combo, crossedCheckpoint } from '../lib/fx.js';

const app = $('#app');
const KEY = 'rmc-player';
const state = { code: new URLSearchParams(location.search).get('code')?.replace(/\D/g, '').slice(0, 6) || '', name: storage.get('rmc-name', ''), avatar: cleanAvatar(storage.get('rmc-avatar')), id: null, token: null, room: null, me: null, screen: 'code', q: null, pending: null };

const { socket, request } = connect({ onStatus: s => {
  document.body.dataset.conn = s;
  if (s === 'online' && state.token && state.code) resume(true);
} });
socket.on('room', room => { state.room = room; const me = room.players.find(p => p.id === state.id); if (me) state.me = { ...state.me, ...me }; refresh(); });
socket.on('question', q => { if (!state.id) return; if (q) showQuestion(q); else if (state.room?.status === 'playing' && state.me?.finished) showFinished(); });
socket.on('feedback', fb => { if (state.id) showStoredFeedback(fb); });
socket.on('ended', me => { if (me) state.me = me; showEnded(); });
socket.on('removed', () => { forget(); screen('message', { title: 'Anda telah dikeluarkan', text: 'Guru telah mengeluarkan anda daripada sesi ini. Anda boleh menyertai semula dengan kod baharu.' }); });
socket.on('expired', () => { forget(); screen('message', { title: 'Sesi tamat tempoh', text: 'Sesi ini tidak lagi aktif.' }); });

function forget() { storage.remove(KEY); state.id = state.token = null; }
async function resume(quiet = false) {
  try {
    const res = await request('resume', { code: state.code, token: state.token });
    state.id = res.id; state.room = res.room; state.me = res.me;
    if (res.room.status === 'ended') return showEnded();
    if (res.room.status === 'lobby') return showLobby();
    if (state.me.finished && !state.pending) showFinished();
  } catch (e) { forget(); if (!quiet) toast(e.message, 'warn'); showCode(); }
}

function shell(inner, cls = '') {
  document.body.className = `player ${cls}`;
  render(app, `<header class="player-top">${brand()}${state.room ? `<span class="code-chip">Kod <strong>${state.room.code}</strong></span>` : ''}</header><main class="player-main">${inner}</main>`);
}
function screen(name, data) { state.screen = name; if (name === 'message') shell(`<section class="panel center"><h1>${esc(data.title)}</h1><p class="lead">${esc(data.text)}</p><a class="btn btn-primary btn-xl" href="/join.html">Sertai sesi lain</a><a class="ghost-link" href="/">Laman utama</a></section>`); }

/* ---------- SERTAI ---------- */
function showCode(error = '') {
  state.screen = 'code';
  shell(`<section class="panel join-panel">
    <div class="join-hero" aria-hidden="true"><svg viewBox="0 0 200 90"><path d="M0 90 60 30 90 55 130 10 200 90z" fill="#2f6b57"/><path d="m130 10 12 18-12-4-10 6z" fill="#f4efe0"/><path d="M130 10V-4l14 5-14 4" fill="#d7633f"/></svg></div>
    <span class="eyebrow">SERTAI EKSPEDISI</span><h1>Masukkan kod permainan</h1><p class="lead">Kod 6 digit dipaparkan pada skrin guru.</p>
    <form id="f" class="stack" novalidate><label class="sr" for="code">Kod permainan</label>
    <input id="code" class="code-input" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="000 000" value="${esc(state.code.replace(/^(\d{3})(\d+)/, '$1 $2'))}" aria-describedby="err">
    <p class="form-error" id="err" role="alert">${esc(error)}</p>
    <button class="btn btn-gold btn-xl">Seterusnya →</button></form>
    <a class="ghost-link" href="/solo.html">Tiada kod? Cuba pendakian solo</a></section>`, 'screen-join');
  const input = $('#code');
  input.oninput = () => { const d = input.value.replace(/\D/g, '').slice(0, 6); input.value = d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d; };
  $('#f').onsubmit = e => { e.preventDefault(); const d = input.value.replace(/\D/g, ''); if (d.length !== 6) { $('#err').textContent = 'Kod mesti 6 digit.'; return; } state.code = d; showName(); };
  if (!state.code) input.focus();
}
function showName(error = '') {
  state.screen = 'name';
  shell(`<section class="panel join-panel"><span class="eyebrow">KOD ${state.code.replace(/^(\d{3})/, '$1 ')}</span><h1>Siapa nama anda?</h1><p class="lead">Nama ini akan dipaparkan di atas gunung pada skrin kelas.</p>
    <form id="f" class="stack" novalidate><label class="sr" for="name">Nama panggilan</label>
    <input id="name" class="name-input" maxlength="20" autocomplete="nickname" placeholder="Contoh: Aisyah" value="${esc(state.name)}" aria-describedby="err">
    <p class="form-error" id="err" role="alert">${esc(error)}</p>
    <button class="btn btn-gold btn-xl">Pilih avatar →</button></form><button class="ghost-link" id="back">← Tukar kod</button></section>`, 'screen-join');
  const input = $('#name'); input.focus();
  $('#back').onclick = () => showCode();
  $('#f').onsubmit = e => {
    e.preventDefault(); const n = input.value.replace(/\s+/g, ' ').trim();
    if (n.length < 2 || n.length > 20) return $('#err').textContent = 'Gunakan 2–20 aksara.';
    if (/[<>&"'`\\]/.test(n)) return $('#err').textContent = 'Elakkan simbol khas seperti < > & " \'.';
    state.name = n; storage.set('rmc-name', n); showAvatar();
  };
}
function showAvatar() {
  state.screen = 'avatar';
  shell('<section class="panel wide" id="pick"></section>', 'screen-avatar');
  avatarPicker($('#pick'), { avatar: state.avatar, name: state.name, doneLabel: 'Sertai lobi', onBack: () => showName(), onDone: join });
}
async function join(avatar) {
  state.avatar = avatar; storage.set('rmc-avatar', avatar);
  try {
    const res = await request('join', { code: state.code, name: state.name, avatar });
    state.id = res.id; state.token = res.token; state.room = res.room; state.me = res.me;
    storage.set(KEY, { code: state.code, token: res.token });
    history.replaceState(null, '', `?code=${state.code}`);
    if (res.room.status === 'lobby') showLobby();
  } catch (e) {
    if (/Nama/.test(e.message)) showName(e.message);
    else if (/Kod|tamat|kunci|bermula|penuh/i.test(e.message)) showCode(e.message);
    else toast(e.message, 'error');
  }
}

/* ---------- LOBI ---------- */
function showLobby() {
  state.screen = 'lobby';
  const r = state.room;
  shell(`<section class="panel center lobby-wait">
    <span class="eyebrow">${esc(r.label)} · ${esc(r.title.toUpperCase())}</span>
    <div class="wait-avatar">${avatarSVG(state.me?.avatar || state.avatar, { label: state.name })}<span class="wait-ring"></span></div>
    <h1>Anda di Base Camp, ${esc(state.me?.name || state.name)}!</h1>
    <p class="lead">Lihat nama anda di skrin guru. Pendakian akan bermula sebentar lagi.</p>
    <div class="wait-topics">${r.topics.map(t => `<span lang="ar" dir="rtl">${esc(t)}</span>`).join('<b>+</b>')}</div>
    <p class="wait-count"><span class="pulse-dot"></span><span id="count">${r.players.length}</span> pendaki sedang menunggu</p>
  </section>`, 'screen-lobby');
}

/* ---------- PERMAINAN ---------- */
function hud() {
  const r = state.room, me = state.me || {};
  const pct = Math.round((me.index || 0) / r.total * 100), climb = Math.round((me.correct || 0) / r.total * 100);
  return `<div class="hud" id="hud">
    <div class="hud-title"><span>${r.set ? 'Set Guru' : `Level ${r.level}`} · ${esc(r.title)}</span><span class="hud-topics" lang="ar" dir="rtl">${r.topics.map(esc).join(' + ')}</span></div>
    <div class="hud-stats"><div><small>Altitud</small><strong>${fmt(me.altitude || 0)} m</strong></div><div><small>Kemajuan</small><strong>${pct}%</strong></div>${r.settings.leaderboard ? `<div><small>Kedudukan</small><strong>#${me.rank || '–'}</strong></div>` : ''}<div><small>Skor</small><strong>${fmt(me.score || 0)}</strong></div></div>
    <div class="track" aria-label="Kemajuan pendakian ${climb}%"><div class="track-fill" style="width:${climb}%"></div>${[25, 50, 75].map(c => `<span class="track-cp" style="left:${c}%"></span>`).join('')}<span class="track-summit">⚑</span><span class="track-me" style="left:${climb}%">${avatarSVG(me.avatar || state.avatar, { crop: 'head', label: '' })}</span></div>
  </div>`;
}
function refresh() {
  const r = state.room; if (!r) return;
  if (state.screen === 'lobby') { if (r.status === 'lobby') { const c = $('#count'); if (c) c.textContent = r.players.length; } return; }
  const h = $('#hud'); if (h && r.status !== 'lobby') h.outerHTML = hud();
  const veil = $('#veil'); if (veil) veil.hidden = r.status !== 'paused';
  const rank = $('#my-rank'); if (rank && state.me) rank.textContent = `#${state.me.rank}`;
}
function playShell() {
  if (state.screen === 'play' && $('#qwrap')) return;
  state.screen = 'play';
  shell(`${hud()}<section id="qwrap" class="q-wrap"></section><div class="pause-veil" id="veil" ${state.room.status === 'paused' ? '' : 'hidden'}><div><span>❚❚</span><strong>Pendakian dijeda</strong><small>Tunggu arahan guru.</small></div></div>`, 'screen-play');
}
function showQuestion(q) {
  if (state.pending) return; // maklum balas masih dipaparkan
  playShell();
  state.q?.destroy();
  state.q = renderQuestion($('#qwrap'), q, { remaining: q.remaining, onSubmit: answer => submit(q, answer) });
}
async function submit(q, answer) {
  const before = state.me?.correct ?? 0;
  try {
    const res = await request('answer', { id: q.id, answer });
    state.me = { ...state.me, ...res.me }; state.pending = res.feedback;
    refresh();
    const fb = res.feedback, card = $('#qwrap');
    if (fb.correct) {
      sfx.correct(fb.streak); shake(); flash('gold');
      floatScore(`+${fmt(fb.score)}`, card); combo(fb.streak, card);
    } else { sfx.wrong(); shake(); flash('red'); }
    renderFeedback(card, fb, { answer, question: q, onNext: next });
    const cp = fb.correct && !fb.finished ? crossedCheckpoint(before, state.me.correct, state.room.total) : null;
    if (cp) banner(cp.title, cp.sub);
  } catch (e) { toast(e.message, 'error'); }
}
function showStoredFeedback(fb) {
  playShell(); state.pending = fb;
  $('#qwrap').innerHTML = '<article class="q-card"></article>';
  renderFeedback($('#qwrap'), fb, { onNext: next });
}
async function next() {
  state.pending = null; state.q?.destroy(); state.q = null;
  try { const res = await request('next'); state.me = { ...state.me, ...res.me }; if (state.me.finished) showFinished(); }
  catch (e) { toast(e.message, 'error'); }
}

/* ---------- SELESAI ---------- */
function summary(me, r) {
  return `<div class="summary-grid">
    <div><small>Skor</small><strong>${fmt(me.score)}</strong></div><div><small>Altitud</small><strong>${fmt(me.altitude)} m</strong></div>
    <div><small>Ketepatan</small><strong>${me.accuracy}%</strong></div><div><small>Betul / Salah</small><strong>${me.correct} / ${me.wrong}</strong></div>
    <div><small>Rentetan terbaik</small><strong>${me.bestStreak}</strong></div>${r.settings.leaderboard ? `<div><small>Kedudukan</small><strong id="my-rank">#${me.rank}</strong></div>` : ''}</div>`;
}
function showFinished() {
  const r = state.room, me = state.me; if (!me) return;
  const first = state.screen !== 'finished';
  state.screen = 'finished';
  const summit = me.correct === r.total;
  if (first) { if (summit) { sfx.summit(); shake(2); confetti(110); } else { sfx.milestone(); confetti(45); } }
  shell(`${hud()}<section class="panel center finish">
    <div class="finish-scene ${summit ? 'summit' : ''}">${avatarSVG(me.avatar, { label: me.name })}</div>
    <p class="fb-ar" lang="ar" dir="rtl">${summit ? 'أَحْسَنْتَ! وَصَلْتَ إِلَى الْقِمَّةِ' : 'أَحْسَنْتَ!'}</p>
    <h1>${summit ? 'Anda sampai ke puncak!' : `Anda mendaki ${fmt(me.altitude)} m!`}</h1>
    ${summary(me, r)}
    <p class="wait-count"><span class="pulse-dot"></span>Menunggu guru menamatkan pendakian…</p></section>`, 'screen-finished');
}
function showEnded() {
  const r = state.room, me = state.me;
  state.screen = 'ended'; storage.remove(KEY);
  if (!me) return screen('message', { title: 'Pendakian tamat', text: 'Terima kasih kerana menyertai.' });
  const summit = me.correct === r.total;
  shell(`<section class="panel center finish">
    <span class="eyebrow">PENDAKIAN TAMAT · ${esc(r.label)}</span>
    <div class="finish-scene ${summit ? 'summit' : ''}">${avatarSVG(me.avatar, { label: me.name })}</div>
    <h1>${r.settings.leaderboard && me.rank <= 3 ? ['🥇', '🥈', '🥉'][me.rank - 1] + ' ' : ''}Tahniah, ${esc(me.name)}!</h1>
    <p class="lead">${summit ? 'Anda menawan puncak ilmu.' : 'Setiap langkah ialah ilmu. Teruskan mendaki!'}</p>
    ${summary(me, r)}
    <div class="row-actions"><a class="btn btn-primary" href="/solo.html">Latihan solo</a><a class="btn btn-ghost" href="/join.html">Sertai sesi lain</a></div></section>`, 'screen-ended');
}

/* ---------- MULA ---------- */
const saved = storage.get(KEY);
if (saved && (!state.code || state.code === saved.code)) {
  state.code = saved.code; state.token = saved.token;
  shell('<div class="loading">Menyambung semula…</div>');
  // resume dipanggil oleh onStatus apabila soket bersambung
  if (socket.connected) resume();
} else showCode();
