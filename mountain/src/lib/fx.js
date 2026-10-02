/** Kesan "gempak": bunyi ringkas (Web Audio, tanpa fail), getaran skrin, kilat, mata terbang, konfeti dan banner checkpoint. */

const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let ctx;
function tone(freq, dur = .12, type = 'triangle', gain = .05, delay = 0) {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur);
  } catch { /* audio disekat: abaikan */ }
}

export const sfx = {
  correct: (streak = 0) => { tone(660, .09); tone(880 + Math.min(streak, 6) * 55, .16, 'triangle', .045, .07); },
  wrong: () => { tone(200, .18, 'sawtooth', .035); tone(150, .22, 'sawtooth', .03, .06); },
  milestone: () => [523, 659, 784].forEach((f, i) => tone(f, .2, 'triangle', .05, i * .1)),
  summit: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .32, 'triangle', .055, i * .11)),
};

export function shake(level = 1) {
  if (calm()) return;
  const b = document.body, cls = level > 1 ? 'fx-shake-lg' : 'fx-shake';
  b.classList.remove('fx-shake', 'fx-shake-lg'); void b.offsetWidth; b.classList.add(cls);
  setTimeout(() => b.classList.remove(cls), 700);
}

export function flash(kind = 'gold') {
  if (calm()) return;
  const d = document.createElement('div');
  d.className = `fx-flash ${kind}`;
  document.body.append(d); setTimeout(() => d.remove(), 650);
}

/** Angka mata terbang dari kad soalan ke arah papan skor. */
export function floatScore(text, anchor, cls = '') {
  if (calm() || !anchor) return;
  const r = anchor.getBoundingClientRect(), d = document.createElement('div');
  d.className = `fx-float ${cls}`; d.textContent = text;
  d.style.left = `${r.left + r.width / 2}px`; d.style.top = `${r.top + r.height / 2}px`;
  document.body.append(d); setTimeout(() => d.remove(), 1200);
}

export function confetti(n = 80) {
  if (calm()) return;
  const wrap = document.createElement('div');
  wrap.className = 'fx-confetti';
  const colors = ['#e2ae4c', '#2f8a5b', '#fff3c6', '#c05a47', '#6f9a86'];
  wrap.innerHTML = Array.from({ length: n }, () => {
    const s = 6 + Math.random() * 8;
    return `<i style="left:${Math.random() * 100}%;width:${s}px;height:${s * (.5 + Math.random())}px;background:${colors[Math.floor(Math.random() * colors.length)]};animation-delay:${(Math.random() * .8).toFixed(2)}s;animation-duration:${(2 + Math.random() * 1.8).toFixed(2)}s"></i>`;
  }).join('');
  document.body.append(wrap); setTimeout(() => wrap.remove(), 4600);
}

/** Banner checkpoint gaya "stage clear". Selesai selepas kira-kira 1.5s. */
export function banner(title, sub = '') {
  sfx.milestone();
  return new Promise(resolve => {
    if (calm()) return resolve();
    const d = document.createElement('div');
    d.className = 'fx-banner';
    d.innerHTML = `<div><strong>${title}</strong>${sub ? `<span>${sub}</span>` : ''}</div>`;
    document.body.append(d);
    setTimeout(() => { d.classList.add('out'); setTimeout(() => { d.remove(); resolve(); }, 300); }, 1300);
  });
}

/** Papar rentetan jawapan betul yang sedang berjalan. */
export function combo(streak, anchor) {
  if (streak < 3 || calm() || !anchor) return;
  const r = anchor.getBoundingClientRect(), d = document.createElement('div');
  d.className = 'fx-combo'; d.textContent = `🔥 ${streak} BERUNTUN!`;
  d.style.left = `${r.left + r.width / 2}px`; d.style.top = `${r.top + 14}px`;
  document.body.append(d); setTimeout(() => d.remove(), 1400);
}

/** Checkpoint 25/50/75%: pulangkan tajuk bila pendaki baru melepasi sempadan. */
export function crossedCheckpoint(before, after, total) {
  const marks = [[.25, 'RABUNG PERTAMA', 'Seperempat jalan ditawan.'], [.5, 'SEPARUH JALAN', 'Teruskan, puncak makin dekat.'], [.75, 'HAMPIR KE PUNCAK', 'Satu tolakan terakhir!']];
  for (const [f, title, sub] of marks) { const need = Math.ceil(total * f); if (before < need && after >= need) return { title, sub }; }
  return null;
}
