import '../styles/game.css';
import { $, $$, esc, fmt, render, toast, storage, brand } from '../lib/dom.js';
import { connect } from '../lib/net.js';
import { sets, TIMER_OPTIONS } from '../../shared/game.js';
import { avatarSVG } from '../../shared/avatar.js';
import { createMountain } from '../components/mountain.js';
import { leaderboardRows, resultsView, csvFor } from '../components/results.js';

const app = $('#app');
const KEY = 'tm-host';
const state = { screen: 'setup', set: sets[0].id, settings: { timer: 20, leaderboard: true, lateJoin: true, duplicateNames: false, calm: false }, room: null, token: null, view: 'mountain', joinUrl: '', feed: [], prev: new Map(), map: null };
const statusText = { lobby: 'Lobi', playing: 'Sedang mendaki', paused: 'Dijeda', ended: 'Tamat' };
const labelOf = () => 'Set Guru';
const calm = () => !!state.room?.settings?.calm;
const TARGET = 80;

const { socket, request } = connect({ onStatus: s => { document.body.dataset.conn = s; if (s === 'online' && state.token && state.room) resume(state.room.code, state.token, true); } });
socket.on('room', room => onRoom(room));
socket.on('expired', () => { storage.remove(KEY); toast('Sesi telah tamat tempoh.', 'warn'); state.room = null; showSetup(); });

async function resume(code, token, quiet = false) {
  try {
    const res = await request('resume', { code, token });
    if (res.role !== 'host') throw Error('Token bukan milik guru.');
    state.token = token; await resolveJoinUrl(res.room.code); onRoom(res.room, true);
  } catch (e) { if (!quiet) toast(e.message, 'warn'); storage.remove(KEY); showSetup(); }
}

async function resolveJoinUrl(code) {
  let origin = location.origin;
  if (/^(localhost|127\.|\[::1\])/.test(location.hostname)) {
    try { const { lan } = await (await fetch('/api/info')).json(); if (lan?.[0]) origin = `${location.protocol}//${lan[0]}${location.port ? ':' + location.port : ''}`; } catch {}
  }
  state.joinUrl = `${origin}/join.html?code=${code}`;
}

function onRoom(room, force = false) {
  const before = state.room;
  state.room = room;
  trackFeed(room);
  const screen = room.status === 'lobby' ? 'lobby' : room.status === 'ended' ? 'results' : 'game';
  if (force || screen !== state.screen || !before) { state.screen = screen; draw(); }
  else update();
}

function trackFeed(room) {
  const total = room.total;
  for (const p of room.players) {
    const old = state.prev.get(p.id);
    const who = room.settings?.calm ? 'Seorang pendaki' : p.name;
    if (old && p.correct > old.correct) state.feed.unshift({ id: p.id, at: Date.now(), text: p.correct === total ? `${who} sampai ke puncak!` : `${who} mendaki ke ${fmt(p.altitude)} m`, tone: p.correct === total ? 'gold' : 'up' });
    else if (old && p.finished && !old.finished) state.feed.unshift({ id: p.id, at: Date.now(), text: room.settings?.calm ? 'Seorang pendaki selesai menjawab' : `${p.name} selesai menjawab (${p.accuracy}%)`, tone: 'done' });
    else if (!old && state.room?.status !== 'lobby' && state.prev.size) state.feed.unshift({ id: p.id, at: Date.now(), text: `${who} menyertai pendakian`, tone: 'join' });
  }
  state.feed = state.feed.slice(0, 8);
  state.prev = new Map(room.players.map(p => [p.id, { correct: p.correct, finished: p.finished }]));
}

function draw() {
  document.body.className = `host screen-${state.screen}`;
  if (state.screen === 'setup') return drawSetup();
  if (state.screen === 'lobby') return drawLobby();
  if (state.screen === 'game') return drawGame();
  return drawResults();
}
function update() {
  if (state.screen === 'lobby') return updateLobby();
  if (state.screen === 'game') return updateGame();
}

/* ---------- PERSEDIAAN ---------- */
function showSetup() { state.screen = 'setup'; state.room = null; state.token = null; state.map = null; draw(); }
function seg(name, options, value, fmtLabel) {
  return `<div class="seg" role="radiogroup" aria-label="${name}">${options.map(o => `<button type="button" role="radio" aria-checked="${o === value}" data-seg="${name}" data-value="${o}">${fmtLabel(o)}</button>`).join('')}</div>`;
}
function toggle(key, label, hint) {
  return `<label class="switch"><input type="checkbox" data-toggle="${key}" ${state.settings[key] ? 'checked' : ''}><span class="switch-ui" aria-hidden="true"></span><span><strong>${label}</strong><small>${hint}</small></span></label>`;
}
function drawSetup() {
  const s = state.settings;
  render(app, `
  <header class="topbar">${brand()}<a class="ghost-link" href="/">← Laman utama</a></header>
  <main class="setup">
    <section class="setup-levels">
      <span class="eyebrow">MOD GURU · LANGKAH 1</span>
      <h1>Pilih set soalan Tayammum</h1>
      <p class="lead">Tiga set soalan Tayammum untuk Tingkatan 2. Pelajar menjawab di telefon; kelas melihat semua pendaki bergerak di skrin anda.</p>
      <div class="set-picks"><span class="field-label">Set guru · ulang kaji Tayammum</span>${sets.map(t => `
        <button class="set-row" data-set="${t.id}" aria-pressed="${state.set === t.id}"><span class="set-badge">${t.round === 2 ? '↺' : '★'}</span><span class="level-info"><small>SET GURU · ${esc(t.subtitle.toUpperCase())}</small><strong>${esc(t.title)}</strong><span class="set-meta">${t.questions.length} soalan</span></span><span class="level-check" aria-hidden="true">✓</span></button>`).join('')}</div>
    </section>
    <aside class="setup-panel card">
      <span class="eyebrow">LANGKAH 2 · TETAPAN</span>
      <h2>Tetapan sesi</h2>
      <div class="field"><span class="field-label">Pemasa setiap soalan</span>${seg('timer', TIMER_OPTIONS, s.timer, o => o ? `${o}s` : 'Tiada')}</div>
      <div class="field toggles">
        ${toggle('calm', 'Mod selamat (kurangkan kebimbangan)', 'Tiada bonus kelajuan. Nama dan kedudukan disembunyikan di projektor dan telefon.')}
        ${toggle('leaderboard', 'Kedudukan pada telefon pelajar', 'Pelajar nampak ranking masing-masing.')}
        ${toggle('lateJoin', 'Benarkan sertai lewat', 'Pelajar boleh masuk selepas pendakian bermula.')}
        ${toggle('duplicateNames', 'Benarkan nama sama', 'Matikan untuk elak kekeliruan di skrin.')}
      </div>
      <div class="setup-summary" id="summary"></div>
      <button class="btn btn-gold btn-xl" id="create">Cipta sesi <span aria-hidden="true">→</span></button>
    </aside>
  </main>`);
  const summary = () => {
    const t = sets.find(x => x.id === state.set);
    $('#summary').innerHTML = `<strong>Set Guru · ${esc(t.title)}</strong><span>${t.questions.length} soalan · ${s.timer ? `${s.timer}s setiap soalan` : 'tanpa pemasa'}${s.calm ? ' · mod selamat' : ''} · puncak 3,000 m</span>`;
  };
  summary();
  const pick = setId => { state.set = setId; $$('[data-set]').forEach(x => x.setAttribute('aria-pressed', x.dataset.set === setId)); summary(); };
  $$('[data-set]').forEach(b => b.onclick = () => pick(b.dataset.set));
  $$('[data-seg]').forEach(b => b.onclick = () => { s[b.dataset.seg] = +b.dataset.value; $$(`[data-seg="${b.dataset.seg}"]`).forEach(x => x.setAttribute('aria-checked', x === b)); summary(); });
  $$('[data-toggle]').forEach(i => i.onchange = () => {
    s[i.dataset.toggle] = i.checked;
    if (i.dataset.toggle === 'calm' && i.checked) { s.leaderboard = false; $('[data-toggle="leaderboard"]').checked = false; }
    summary();
  });
  $('#create').onclick = async e => {
    e.currentTarget.disabled = true;
    try {
      const res = await request('create', { set: state.set, settings: s });
      state.token = res.token; storage.set(KEY, { code: res.room.code, token: res.token });
      history.replaceState(null, '', `?code=${res.room.code}`);
      await resolveJoinUrl(res.room.code); state.feed = []; state.prev = new Map(); onRoom(res.room, true);
    } catch (err) { toast(err.message, 'error'); e.currentTarget.disabled = false; }
  };
}

/* ---------- LOBI ---------- */
const codeFmt = c => `${c.slice(0, 3)} ${c.slice(3)}`;
function drawLobby() {
  const r = state.room, url = state.joinUrl.replace(/^https?:\/\//, '').replace(/\?code=\d+$/, '');
  render(app, `
  <main class="lobby stage-dark">
    <div class="lobby-bg" aria-hidden="true"><svg viewBox="0 0 1600 500" preserveAspectRatio="none"><path d="M0 500 260 250 420 360 700 90 980 380 1160 230 1600 500z" fill="#ffffff0a"/><path d="M0 500 380 330 620 420 900 240 1250 440 1600 330V500z" fill="#ffffff08"/></svg></div>
    <header class="lobby-top">${brand()}<div class="lobby-top-actions"><button class="btn btn-quiet" id="lock"></button><button class="btn btn-quiet" id="projector" title="Skrin penuh (P)">⛶ Skrin penuh</button><button class="btn btn-quiet" id="cancel">Batal sesi</button></div></header>
    <section class="lobby-main">
      <div class="lobby-info">
        <span class="eyebrow light">${esc(r.label)} · ${esc(r.title.toUpperCase())}</span>
        <p class="lobby-arabic">Pendakian Tayammum</p>
        <div class="lobby-topics"><span>${esc(r.subtitle)}</span></div>
        <div class="join-steps">
          <div><span class="step-no">1</span><span>Buka <strong>${esc(url)}</strong><br>atau imbas kod QR</span></div>
          <div><span class="step-no">2</span><span>Masukkan kod permainan</span></div>
        </div>
        <div class="game-code"><small>KOD PERMAINAN</small><strong>${codeFmt(r.code)}</strong></div>
      </div>
      <figure class="qr-card"><img src="/api/qr?text=${encodeURIComponent(state.joinUrl)}" alt="Kod QR untuk menyertai sesi ${r.code}" width="320" height="320"><figcaption>Imbas untuk sertai</figcaption></figure>
    </section>
    <section class="lobby-players">
      <div class="lobby-players-head"><h2><span id="count">0</span> pendaki di Kem Pangkal</h2><p id="lobby-hint"></p><button class="btn btn-gold btn-xl" id="start">Mulakan pendakian <span aria-hidden="true">↑</span></button></div>
      <ul class="chips" id="chips" aria-live="polite"></ul>
    </section>
  </main>`);
  $('#start').onclick = () => control('start');
  $('#lock').onclick = () => control(state.room.locked ? 'unlock' : 'lock');
  $('#cancel').onclick = () => { if (confirm('Batalkan sesi ini? Semua pemain akan dikeluarkan.')) control('end').then(() => { storage.remove(KEY); location.href = '/host.html'; }); };
  $('#projector').onclick = toggleFullscreen;
  updateLobby();
}
function updateLobby() {
  const r = state.room, chips = $('#chips');
  $('#count').textContent = r.players.length;
  $('#start').disabled = !r.players.length;
  $('#lock').textContent = r.locked ? '🔒 Penyertaan dikunci' : '🔓 Penyertaan dibuka';
  $('#lobby-hint').textContent = r.players.length ? 'Tekan mula apabila semua pelajar sudah masuk.' : 'Menunggu pendaki pertama…';
  const have = new Set($$('li', chips).map(li => li.dataset.id));
  for (const p of r.players) if (!have.has(p.id)) {
    const li = document.createElement('li'); li.dataset.id = p.id; li.className = 'chip pop';
    li.innerHTML = `<span class="chip-av">${avatarSVG(p.avatar, { crop: 'head', label: '' })}</span><span class="chip-name">${esc(p.name)}</span><button class="chip-x" title="Keluarkan ${esc(p.name)}" aria-label="Keluarkan ${esc(p.name)}">×</button>`;
    li.querySelector('.chip-x').onclick = () => removePlayer(p);
    chips.append(li);
  }
  const ids = new Set(r.players.map(p => p.id));
  $$('li', chips).forEach(li => { if (!ids.has(li.dataset.id)) li.remove(); else li.classList.toggle('offline', r.players.find(p => p.id === li.dataset.id).online === false); });
}

/* ---------- PERMAINAN ---------- */
function drawGame() {
  const r = state.room;
  render(app, `
  <div class="game-shell view-${state.view}">
    <header class="host-bar">
      ${brand()}
      <div class="host-bar-mid"><span class="bar-level">${labelOf()} · ${esc(r.title)}</span><span class="code-chip">Kod <strong>${codeFmt(r.code)}</strong></span><span class="status-pill" id="status"></span></div>
      <div class="tabs" role="tablist" aria-label="Paparan">${[['mountain', 'Gunung'], ['split', 'Pisah'], ...(r.settings.calm ? [] : [['board', 'Kedudukan']])].map(([k, l]) => `<button role="tab" data-view="${k}" aria-selected="${state.view === k}">${l}</button>`).join('')}</div>
      <div class="host-bar-actions"><button class="btn btn-quiet" id="pause"></button><button class="btn btn-quiet" id="lock"></button><button class="btn btn-quiet" id="projector" title="Mod projektor (P)">⛶ Projektor</button><button class="btn btn-danger" id="end">Tamatkan</button></div>
    </header>
    <main class="stage">
      <section class="stage-mountain" id="mountain"></section>
      <div class="overlay ov-title"><span class="eyebrow light">${esc(r.label)} · ${esc(r.title.toUpperCase())}</span><div class="ov-topics">${r.topics.map(t => `<span>${esc(t)}</span>`).join('<b>+</b>')}</div></div>
      <div class="overlay ov-top" id="ov-top"></div>
      <aside class="side-panel" id="side"></aside>
      <section class="board-view" id="board"></section>
      <div class="pause-veil" id="veil" hidden><div><span>❚❚</span><strong>Pendakian dijeda</strong><small>Rehat sebentar. Guru akan menyambung.</small></div></div>
      <div class="done-banner" id="done" hidden><strong>Semua pendaki telah selesai!</strong><button class="btn btn-gold" id="finish">Lihat keputusan →</button></div>
      <button class="exit-projector" id="exit-proj">Keluar projektor</button>
    </main>
  </div>`);
  if (r.settings.calm && state.view === 'board') state.view = 'mountain';
  state.map = createMountain($('#mountain'), { total: r.total, hideNames: r.settings.calm });
  $$('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
  $('#pause').onclick = () => control(state.room.status === 'paused' ? 'resume' : 'pause');
  $('#lock').onclick = () => control(state.room.locked ? 'unlock' : 'lock');
  $('#projector').onclick = () => setProjector(true);
  $('#exit-proj').onclick = () => setProjector(false);
  $('#end').onclick = () => { if (confirm('Tamatkan pendakian dan paparkan keputusan?')) control('end'); };
  $('#finish').onclick = () => control('end');
  updateGame();
}
function setView(v) {
  state.view = v; $('.game-shell').className = `game-shell view-${v}`;
  $$('[data-view]').forEach(b => b.setAttribute('aria-selected', b.dataset.view === v));
  updateGame();
}
function stats(r) {
  const n = r.players.length, finished = r.players.filter(p => p.finished).length, summit = r.players.filter(p => p.correct === r.total).length;
  const answered = r.players.reduce((s, p) => s + p.correct + p.wrong, 0), correct = r.players.reduce((s, p) => s + p.correct, 0);
  return { n, climbing: n - finished, finished, summit, accuracy: answered ? Math.round(correct / answered * 100) : 0, offline: r.players.filter(p => !p.online).length };
}
function statTiles(st) {
  return [[st.n, 'Pendaki'], [st.climbing, 'Masih mendaki'], [st.finished, 'Selesai'], [`${st.accuracy}%`, 'Purata ketepatan']]
    .map(([v, l]) => `<div class="stat"><strong>${v}</strong><span>${l}</span></div>`).join('');
}
function updateGame() {
  const r = state.room; if (!r || !state.map) return;
  const st = stats(r);
  state.map.update(r.players);
  $('#status').textContent = statusText[r.status];
  $('#status').dataset.status = r.status;
  $('#pause').textContent = r.status === 'paused' ? '▶ Sambung' : '❚❚ Jeda';
  $('#lock').textContent = r.locked ? '🔒 Dikunci' : '🔓 Terbuka';
  $('#veil').hidden = r.status !== 'paused';
  $('#done').hidden = !(r.players.length && st.finished === r.players.length);
  const goal = `<div class="class-goal"><div class="cg-head"><span>Ketepatan kelas</span><strong>${st.accuracy}%</strong></div><span class="cg-bar"><i style="width:${Math.min(100, st.accuracy)}%"></i><b style="left:${TARGET}%"></b></span><small>Sasaran kelas ${TARGET}% · ${st.accuracy >= TARGET ? 'sasaran dicapai! Tahniah' : 'bantu rakan, kita naik bersama'}</small></div>`;
  if (calm()) $('#ov-top').innerHTML = `<h3>Kemajuan kelas</h3>${goal}<div class="side-stats">${statTiles(st)}</div>${st.offline ? `<p class="hint">⚠ ${st.offline} pendaki terputus sambungan</p>` : ''}`;
  else $('#ov-top').innerHTML = `<h3>Pendahulu</h3><ol class="mini-board">${r.players.slice(0, 5).map(p => `<li><span class="rk r${p.rank}">${p.rank}</span><span class="mb-av">${avatarSVG(p.avatar, { crop: 'head', label: '' })}</span><span class="mb-name">${esc(p.name)}</span><span class="mb-alt">${fmt(p.altitude)} m</span></li>`).join('') || '<li class="muted">Belum ada pendaki.</li>'}</ol>
    <div class="side-stats">${statTiles(st)}</div>${st.offline ? `<p class="hint">⚠ ${st.offline} pendaki terputus sambungan</p>` : ''}`;
  if (state.view === 'split' && calm()) $('#side').innerHTML = `${goal}<div class="side-stats">${statTiles(st)}</div>
    <h3>Aktiviti terkini</h3><ul class="feed">${state.feed.map(f => `<li class="${f.tone}">${esc(f.text)}</li>`).join('') || '<li class="muted">Menunggu jawapan pertama…</li>'}</ul>`;
  else if (state.view === 'split') $('#side').innerHTML = `
    <div class="side-stats">${statTiles(st)}</div>
    <h3>10 teratas</h3><ol class="side-board">${r.players.slice(0, 10).map(p => `<li class="${p.finished ? 'done' : ''}"><span class="rk r${p.rank}">${p.rank}</span><span class="mb-av">${avatarSVG(p.avatar, { crop: 'head', label: '' })}</span><span class="sb-name">${esc(p.name)}<small>${p.correct}/${r.total} betul · ${p.accuracy}%</small></span><span class="sb-score">${fmt(p.score)}<small>${fmt(p.altitude)} m</small></span></li>`).join('')}</ol>
    <h3>Aktiviti terkini</h3><ul class="feed">${state.feed.map(f => `<li class="${f.tone}">${esc(f.text)}</li>`).join('') || '<li class="muted">Menunggu jawapan pertama…</li>'}</ul>`;
  if (state.view === 'board') {
    $('#board').innerHTML = `<div class="board-card"><div class="board-head"><h2>Kedudukan pendaki</h2><div class="board-stats">${statTiles(st)}</div></div><table class="board-table"><thead><tr><th>#</th><th>Pendaki</th><th>Altitud</th><th>Betul</th><th>Ketepatan</th><th>Skor</th><th>Status</th><th class="host-only"><span class="sr">Tindakan</span></th></tr></thead><tbody>${leaderboardRows(r, { removable: true })}</tbody></table></div>`;
    $$('[data-remove]', $('#board')).forEach(b => b.onclick = () => removePlayer(r.players.find(p => p.id === b.dataset.remove)));
  }
}

/* ---------- KEPUTUSAN ---------- */
function drawResults() {
  setProjector(false);
  const r = state.room;
  render(app, `<header class="topbar">${brand()}<div class="topbar-actions"><button class="btn btn-quiet" id="csv">⤓ Muat turun CSV</button><button class="btn btn-quiet" id="again">Sesi baharu</button><a class="btn btn-ghost" href="/">Laman utama</a></div></header>
  <main class="results-page">${resultsView(r)}</main>`);
  $('#csv').onclick = () => {
    const blob = new Blob(['﻿' + csvFor(r)], { type: 'text/csv;charset=utf-8' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `tayammum-${r.set}-${r.code}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };
  $('#again').onclick = () => { storage.remove(KEY); socket.emit('leave', {}, () => {}); history.replaceState(null, '', location.pathname); showSetup(); };
}

/* ---------- KAWALAN ---------- */
async function control(action, extra = {}) {
  try { await request('control', { action, ...extra }); }
  catch (e) { toast(e.message, 'error'); throw e; }
}
function removePlayer(p) {
  if (p && confirm(`Keluarkan ${p.name} daripada sesi?`)) control('remove', { playerId: p.id }).then(() => toast(`${p.name} dikeluarkan.`)).catch(() => {});
}
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().catch(() => {});
}
function setProjector(on) {
  document.body.classList.toggle('projector', on);
  if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  if (!on && document.fullscreenElement) document.exitFullscreen?.();
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.body.classList.remove('projector'); });
document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea') || e.metaKey || e.ctrlKey) return;
  if (e.key === 'p' || e.key === 'P') state.screen === 'game' ? setProjector(!document.body.classList.contains('projector')) : toggleFullscreen();
  if (state.screen === 'game' && ['1', '2', '3'].includes(e.key)) setView(['mountain', 'split', 'board'][+e.key - 1]);
});
let idle; document.addEventListener('mousemove', () => { document.body.classList.add('mouse-active'); clearTimeout(idle); idle = setTimeout(() => document.body.classList.remove('mouse-active'), 2200); });

/* ---------- MULA ---------- */
const saved = storage.get(KEY), qsCode = new URLSearchParams(location.search).get('code');
if (saved && (!qsCode || qsCode === saved.code)) { document.body.className = 'host'; render(app, '<div class="loading">Memulihkan sesi…</div>'); socket.connected ? resume(saved.code, saved.token) : socket.once('connect', () => resume(saved.code, saved.token)); }
else showSetup();
