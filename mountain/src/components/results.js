import { avatarSVG } from '../../shared/avatar.js';
import { esc, fmt } from '../lib/dom.js';

const typeLabel = { 'multiple-choice': 'Pilih jawapan', arrange: 'Susun langkah' };

export function leaderboardRows(r, { removable = false } = {}) {
  return r.players.map(p => `<tr class="${p.finished ? 'is-done' : ''}">
    <td><span class="rk r${p.rank}">${p.rank}</span></td>
    <td><span class="who"><span class="mb-av">${avatarSVG(p.avatar, { crop: 'head', label: '' })}</span>${esc(p.name)}</span></td>
    <td><span class="alt-bar"><i style="width:${Math.round(p.correct / r.total * 100)}%"></i></span>${fmt(p.altitude)} m</td>
    <td>${p.correct}/${r.total}</td><td>${p.accuracy}%</td><td class="num">${fmt(p.score)}</td>
    <td>${p.finished ? '<span class="tag ok">Selesai</span>' : p.online === false ? '<span class="tag warn">Terputus</span>' : `<span class="tag">Soalan ${Math.min(p.index + 1, r.total)}</span>`}</td>
    ${removable ? `<td class="host-only"><button class="icon-btn" data-remove="${p.id}" title="Keluarkan ${esc(p.name)}" aria-label="Keluarkan ${esc(p.name)}">×</button></td>` : ''}
  </tr>`).join('') || `<tr><td colspan="8" class="muted">Tiada pendaki.</td></tr>`;
}

const bar = (pct, cls = '') => `<span class="pct-bar ${cls}"><i style="width:${pct ?? 0}%"></i></span>`;

export function resultsView(r) {
  const { analytics: a, awards } = r.results;
  const calm = !!r.settings?.calm;
  const [first, second, third] = r.players;
  const podium = [[second, 2], [first, 1], [third, 3]].filter(([p]) => p).map(([p, n]) => `
    <div class="podium-spot p${n}"><div class="podium-av">${avatarSVG(p.avatar, { label: p.name })}</div><strong>${esc(p.name)}</strong><span>${fmt(p.score)} mata · ${fmt(p.altitude)} m</span><div class="podium-block">${n}</div></div>`).join('');
  const topicRows = a.topics.map((t, i) => `<div class="topic-acc"><span class="topic-tag">Topik ${String.fromCharCode(65 + i)}</span><span class="ar">${esc(t.title)}</span>${bar(t.accuracy, t.accuracy < 60 ? 'low' : '')}<strong>${t.accuracy ?? '–'}%</strong></div>`).join('');
  const qRows = a.questions.map(q => `<li class="${q.needsReview ? 'review' : ''}"><span class="qn">S${q.n}</span><span class="qtext"><span>${esc(q.text)}</span><small>${typeLabel[q.type] || q.type} · ${esc(q.topicTitle)} · Jawapan: <span>${esc(q.correctText)}</span></small></span>${bar(q.accuracy, q.accuracy < 60 ? 'low' : '')}<strong>${q.accuracy ?? '–'}%</strong>${q.needsReview ? '<span class="tag warn">Perlu ulang kaji</span>' : ''}</li>`).join('');
  const review = a.questions.filter(q => q.needsReview).length;
  return `
  <section class="results-hero">
    <div><span class="eyebrow">${esc(r.label)} · ${esc(r.title.toUpperCase())} · KOD ${r.code}</span><h1>Ekspedisi selesai. <em>Tahniah semua!</em></h1>
    <p class="lead">${r.players.length} pendaki · ${r.players.filter(p => p.correct === r.total).length} sampai ke puncak · ${r.total} soalan</p></div>
    <div class="class-acc"><strong>${a.accuracy ?? 0}%</strong><span>Ketepatan kelas</span></div>
  </section>
  ${r.players.length && !calm ? `<section class="podium">${podium}</section>` : ''}
  ${awards.length && !calm ? `<section class="awards">${awards.map(w => `<div class="award ${w.key}"><span class="award-icon" aria-hidden="true">${{ accurate: '◎', streak: '⚡', fast: '➶' }[w.key]}</span><small>${w.label}</small><strong>${esc(w.name)}</strong><span>${esc(w.value)}</span></div>`).join('')}</section>` : ''}
  <section class="results-grid">
    <div class="card"><h2>Ketepatan mengikut topik</h2>${topicRows}</div>
    <div class="card"><h2>Analisis soalan</h2><p class="hint">${review ? `${review} soalan di bawah 60% ditanda untuk ulang kaji.` : 'Tiada soalan di bawah 60%. Syabas!'}</p><ol class="q-analysis">${qRows}</ol></div>
  </section>
  <section class="card">${calm ? '<details class="teacher-only"><summary>Rekod individu (untuk guru sahaja, jangan paparkan di projektor)</summary>' : '<h2>Kedudukan penuh</h2>'}<table class="board-table"><thead><tr><th>#</th><th>Pendaki</th><th>Altitud</th><th>Betul</th><th>Ketepatan</th><th>Skor</th><th>Status</th></tr></thead><tbody>${leaderboardRows(r)}</tbody></table>${calm ? '</details>' : ''}</section>`;
}

export function csvFor(r) {
  const q = s => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [['Kedudukan', 'Nama', 'Skor', 'Altitud (m)', 'Betul', 'Salah', 'Ketepatan (%)', 'Rentetan terbaik', 'Selesai']];
  for (const p of r.players) rows.push([p.rank, p.name, p.score, p.altitude, p.correct, p.wrong, p.accuracy, p.bestStreak, p.finished ? 'Ya' : 'Tidak']);
  rows.push([], ['Soalan', 'Jenis', 'Topik', 'Teks', 'Jawapan', 'Dijawab', 'Ketepatan (%)']);
  for (const x of r.results.analytics.questions) rows.push([x.n, typeLabel[x.type] || x.type, x.topicTitle, x.text, x.correctText, x.answered, x.accuracy ?? '']);
  return rows.map(row => row.map(q).join(',')).join('\r\n');
}
