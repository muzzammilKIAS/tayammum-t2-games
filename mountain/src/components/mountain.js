import { avatarSVG } from '../../shared/avatar.js';
import { SUMMIT_METRES } from '../../shared/game.js';
import { esc, fmt } from '../lib/dom.js';

const NS = 'http://www.w3.org/2000/svg';
const TRAIL = 'M430 842C640 842 990 812 1060 752S780 690 650 648 790 566 950 534 900 470 770 446 790 385 890 356 860 294 805 272 812 205 828 176 822 128 820 112';

const trees = [[92, 790, 1], [150, 812, .8], [238, 770, 1.1], [1330, 790, 1], [1410, 770, 1.2], [1480, 812, .9], [1250, 820, .8], [300, 842, .7], [1190, 700, .7], [372, 690, .6], [1290, 660, .6]]
  .map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0-78 30-18H-30z" fill="#1d4a3d"/><path d="M0-52 36 8H-36z" fill="#163f34"/><rect x="-4" y="8" width="8" height="12" fill="#3a2f28"/></g>`).join('');

const scene = `
<defs>
  <linearGradient id="mSky" x2="0" y2="1"><stop stop-color="#bcd7dc"/><stop offset=".55" stop-color="#e6eee4"/><stop offset="1" stop-color="#f4efdf"/></linearGradient>
  <linearGradient id="mMain" x1=".2" x2=".75" y1="0" y2="1"><stop stop-color="#6f9a86"/><stop offset=".55" stop-color="#3e6f5c"/><stop offset="1" stop-color="#1f4c3f"/></linearGradient>
  <linearGradient id="mShade" x2="0" y2="1"><stop stop-color="#2d5a4b" stop-opacity=".0"/><stop offset="1" stop-color="#173f34" stop-opacity=".55"/></linearGradient>
  <filter id="mSoft"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect x="-1200" y="-700" width="4000" height="1700" fill="url(#mSky)"/>
<path d="M-1200 640-700 470-300 530 0 560V900h-1200zM1600 470 2000 400 2400 520 2800 480V900H1600z" fill="#b8cdc3"/>
<path d="M-1200 720-600 560-200 650 0 640V900h-1200zM1600 560 2100 520 2800 640V900H1600z" fill="#94b3a4"/>
<path d="M-1200 830 0 800V1600h-1200zM1600 760 2800 800V1600H1600z" fill="#2e5d4c"/>
<circle cx="1285" cy="160" r="74" fill="#f8e3a4"/><circle cx="1285" cy="160" r="112" fill="#f8e3a4" opacity=".25"/>
<g fill="#fff" opacity=".7" filter="url(#mSoft)"><ellipse cx="260" cy="190" rx="150" ry="26"/><ellipse cx="1420" cy="300" rx="170" ry="24"/><ellipse cx="560" cy="120" rx="110" ry="18"/></g>
<path d="M0 560 170 380 300 470 470 300 640 520V900H0z" fill="#b8cdc3"/>
<path d="M960 520 1140 330 1270 450 1420 310 1600 470V900H960z" fill="#b8cdc3"/>
<path d="M0 640 220 480 380 600 560 470 700 640V900H0zM900 660 1110 470 1290 590 1460 460 1600 560V900H900z" fill="#94b3a4"/>
<path d="M170 900 820 92 1490 900z" fill="url(#mMain)"/>
<path d="M820 92 1490 900H1010L905 610 960 430z" fill="#1f4a3e" opacity=".42"/>
<path d="M820 92 925 222 890 214 862 246 838 222 800 260 770 232 742 248z" fill="#f6f3e7"/>
<path d="M820 92 925 222 890 214 862 246 850 180z" fill="#dfe6df"/>
<path d="M170 900 820 92 1490 900z" fill="url(#mShade)"/>
<g fill="#fff" opacity=".55" filter="url(#mSoft)"><ellipse cx="560" cy="430" rx="190" ry="22"/><ellipse cx="1150" cy="395" rx="200" ry="20"/></g>
<path d="M0 800Q300 700 600 792T1200 780 1600 760V900H0z" fill="#2e5d4c"/>
<path d="M-1200 860 0 850Q420 790 800 856T1600 830L2800 850V1600H-1200z" fill="#1c4739"/>
${trees}
<path class="trail-bed" d="${TRAIL}" fill="none" stroke="#e7dcb4" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
<path class="trail-line" d="${TRAIL}" fill="none" stroke="#fff8e0" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
<path class="trail-progress" d="${TRAIL}" fill="none" stroke="#e5b44f" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
`;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Peta gunung langsung. Kedudukan dikira daripada laluan SVG, bukan dikod keras.
 * @param {HTMLElement} el
 * @param {{total:number, compact?:boolean, me?:string}} options
 */
export function createMountain(el, { total = 12, compact = false, me = null, hideNames = false } = {}) {
  el.classList.add('mountain', compact ? 'is-compact' : 'is-full');
  el.innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Gunung pendakian dari Kem Pangkal ke Puncak">${scene}<g class="stations"></g><g class="markers"></g><g class="cards"></g><g class="fx"></g></svg>`;
  const svg = el.querySelector('svg'), path = svg.querySelector('.trail-bed'), progressPath = svg.querySelector('.trail-progress');
  const stationsG = svg.querySelector('.stations'), markersG = svg.querySelector('.markers'), fx = svg.querySelector('.fx'), cardsG = svg.querySelector('.cards');
  const markers = new Map();
  let length = 0, points = [];

  let staticRects = [];
  function layout() {
    length = path.getTotalLength();
    points = Array.from({ length: total + 1 }, (_, i) => { const p = path.getPointAtLength(length * i / total); return { x: p.x, y: p.y }; });
    const cps = [.25, .5, .75].map((f, i) => ({ f, label: `PERSINGGAHAN ${i + 1}` }));
    const label = (x, y, title, sub, cls = '') => `<g class="station ${cls}" transform="translate(${x} ${y})"><circle r="15" /><g class="station-tag" transform="translate(${x > 800 ? 26 : -26} -4)"><text class="t1" text-anchor="${x > 800 ? 'start' : 'end'}">${title}</text><text class="t2" y="22" text-anchor="${x > 800 ? 'start' : 'end'}">${sub}</text></g></g>`;
    const tick = (p, i) => `<circle class="step" cx="${p.x}" cy="${p.y}" r="5"><title>Soalan ${i}</title></circle>`;
    const base = points[0], top = points[total];
    staticRects = [
      ...cps.map(c => { const p = path.getPointAtLength(length * c.f); return p.x > 800 ? { x: p.x - 18, y: p.y - 30, w: 240, h: 62 } : { x: p.x - 240, y: p.y - 30, w: 258, h: 62 }; }),
      { x: base.x - 90, y: base.y - 106, w: 180, h: 116 }, { x: top.x - 10, y: top.y - 80, w: 230, h: 90 },
    ];
    stationsG.innerHTML = points.slice(1, -1).map((p, i) => tick(p, i + 1)).join('') +
      cps.map(c => { const p = path.getPointAtLength(length * c.f); return label(p.x, p.y, c.label, `${fmt(SUMMIT_METRES * c.f)} m`, 'cp'); }).join('') +
      `<g class="station base" transform="translate(${base.x} ${base.y})"><path d="M-34 0-2-46 30 0z" fill="#d9774d"/><path d="M-2-46 30 0H8z" fill="#b65e3b"/><path d="M-8 0-2-18 4 0z" fill="#5a2d1d"/><text class="t1" y="-84" text-anchor="middle">KEM PANGKAL</text><text class="t2" y="-62" text-anchor="middle">0 m</text></g>` +
      `<g class="station summit" transform="translate(${top.x} ${top.y})"><path d="M0 0V-64" stroke="#2b4a3f" stroke-width="4"/><path d="M2-64 46-52 2-38z" fill="#d7633f"/><text class="t1" x="56" y="-36">PUNCAK</text><text class="t2" x="56" y="-12">${fmt(SUMMIT_METRES)} m</text></g>`;
  }

  const BASE_CROWD = { x: 235, y: 872, perRow: 9, dx: 44, dy: 60, scale: .62 };

  /** Kumpulkan pemain mengikut stesen. Kumpulan >1 disusun rapat dengan satu kad nama bersama. */
  function place(players) {
    const groups = new Map();
    for (const p of players) { const s = clamp(p.correct, 0, total); if (!groups.has(s)) groups.set(s, []); groups.get(s).push(p); }
    const out = new Map(), cards = [];
    for (const [s, list] of groups) {
      const n = list.length, pt = points[s];
      if (s === 0 && n > 1 && !compact) {
        const b = BASE_CROWD;
        list.forEach((p, i) => {
          const row = Math.floor(i / b.perRow), col = i % b.perRow, inRow = Math.min(b.perRow, n - row * b.perRow);
          out.set(p.id, { x: b.x + (col - (inRow - 1) / 2) * b.dx, y: b.y - row * b.dy, scale: b.scale, grouped: true });
        });
        cards.push({ s, list, baseX: b.x, baseY: b.y - (Math.ceil(n / b.perRow) - 1) * b.dy - 64, base: true });
        continue;
      }
      if (n === 1 || compact) { list.forEach(p => out.set(p.id, { x: pt.x, y: pt.y, scale: compact ? 2.1 : .95, grouped: false })); continue; }
      const d = n <= 3 ? 34 : n <= 6 ? 24 : 16, scale = n <= 3 ? .9 : n <= 6 ? .8 : .7;
      list.forEach((p, i) => out.set(p.id, { x: pt.x + (i - (n - 1) / 2) * d, y: pt.y + (i % 2 ? -6 : 0), scale, grouped: true }));
      const half = (n - 1) / 2 * d + 30 * scale;
      cards.push({ s, list, pt, half, top: pt.y - 100 * scale });
    }
    return { pos: out, cards };
  }

  // Letak kad nama kumpulan di tempat lapang: elak label stesen, kumpulan avatar dan kad lain.
  function arrange(cards) {
    const hit = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const taken = [...staticRects, ...cards.filter(c => !c.base).map(c => ({ x: c.pt.x - c.half, y: c.top, w: c.half * 2, h: c.pt.y - c.top + 12 }))];
    for (const c of cards) {
      const { w, h } = cardSize(c);
      c.w = w; c.h = h;
      if (c.base) { c.x = c.baseX - w / 2; c.y = c.baseY - h; continue; }
      const { pt, half } = c, R = pt.x + half + 10, L = pt.x - half - 10 - w;
      const options = [[R, pt.y + 10 - h], [L, pt.y + 10 - h], [R, pt.y - h - 40], [L, pt.y - h - 40], [pt.x - w / 2, c.top - h - 6], [R, pt.y - 20], [L, pt.y - 20], [pt.x - w / 2, pt.y + 20]]
        .map(([x, y]) => ({ x: clamp(x, 8, 1592 - w), y: clamp(y, 8, 892 - h), w, h }));
      let best = options[0], bestHit = Infinity;
      for (const o of options) { const v = taken.reduce((sum, r) => sum + hit(o, r), 0); if (v < bestHit) { best = o; bestHit = v; } if (!v) break; }
      Object.assign(c, { x: best.x, y: best.y }); taken.push(best);
    }
    return cards;
  }


  function cardLines({ list, base }) {
    const shown = base || hideNames ? [] : list.slice(0, 4);
    const rows = shown.map(p => `${p.finished ? '✓ ' : p.rank <= 3 && p.correct > 0 ? ['①', '②', '③'][p.rank - 1] + ' ' : ''}${p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name}`);
    const more = base || hideNames ? 0 : list.length - shown.length;
    return [base ? `${list.length} pendaki di Kem Pangkal` : `${list.length} pendaki`, ...rows, ...(more > 0 ? [`+${more} lagi`] : [])];
  }
  function cardSize(c) { const lines = cardLines(c); return { w: Math.max(...lines.map((l, i) => l.length * (i ? 9.6 : 8.4))) + 28, h: 16 + lines.length * 23 }; }
  function groupCard(c) {
    const lines = cardLines(c), names = c.base ? 0 : Math.min(4, c.list.length);
    return `<g class="group-card${c.base ? ' base' : ''}" transform="translate(${c.x} ${c.y})"><rect width="${c.w}" height="${c.h}" rx="12"/>${lines.map((l, i) => `<text x="14" y="${30 + i * 23 - (i ? 0 : 4)}" class="${i ? (i > names ? 'more' : 'nm') : 'hd'}">${esc(l)}</text>`).join('')}</g>`;
  }

  function label(name, chars) { return name.length > chars ? name.slice(0, chars - 1).trimEnd() + '…' : name; }

  function makeMarker(p) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'marker');
    g.innerHTML = `<g class="marker-body"><g class="marker-avatar"><svg x="-26" y="-88" width="52" height="90" viewBox="14 2 92 158">${avatarSVG(p.avatar, { label: p.name }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></g><g class="marker-label"><rect rx="11" height="26" y="4"/><text y="22" text-anchor="middle"></text></g><g class="marker-badge"><circle r="11" cx="0" cy="-96"/><text y="-91" text-anchor="middle"></text></g></g><title></title>`;
    markersG.append(g);
    return { g, text: g.querySelector('.marker-label text'), rect: g.querySelector('.marker-label rect'), badge: g.querySelector('.marker-badge text'), title: g.querySelector('title'), state: {} };
  }

  function update(players) {
    if (!length) layout();
    const { pos, cards } = place(players);
    const leader = players.find(p => p.rank === 1 && p.correct > 0);
    for (const p of players) {
      let m = markers.get(p.id);
      if (!m) { m = makeMarker(p); markers.set(p.id, m); }
      const { x, y, scale, grouped } = pos.get(p.id);
      const shown = hideNames && me !== p.id ? '' : label(p.name, 16);
      const s = m.state, station = clamp(p.correct, 0, total);
      if (s.x !== x || s.y !== y || s.scale !== scale) {
        const climbed = s.correct !== undefined && p.correct > s.correct;
        // Berjalan menyusuri denai hanya untuk pendaki tunggal; kumpulan besar terus berpindah supaya ringan.
        const walked = climbed && !grouped && (me === p.id || players.length <= 12) && walk(m, s.station ?? station, station, { x, y, scale });
        if (!walked) m.g.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        if (climbed) climbFx(points[station], p.correct - s.correct, m.g, !walked);
        Object.assign(s, { x, y, scale, station });
      }
      if (s.shown !== shown) { m.text.textContent = shown; const w = Math.max(40, shown.length * 9.6 + 24); m.rect.setAttribute('width', w); m.rect.setAttribute('x', -w / 2); s.shown = shown; }
      m.title.textContent = `${hideNames ? 'Pendaki' : p.name} — ${fmt(p.altitude ?? 0)} m${p.finished ? ' · Selesai' : ''}`;
      const badge = p.finished ? '✓' : !hideNames && p.rank <= 3 && p.correct > 0 ? String(p.rank) : '';
      if (s.badge !== badge) { m.badge.textContent = badge; s.badge = badge; }
      m.g.classList.toggle('has-badge', !!badge && !grouped);
      m.g.classList.toggle('grouped', grouped);
      m.g.classList.toggle('is-finished', !!p.finished);
      m.g.classList.toggle('is-offline', p.online === false);
      m.g.classList.toggle('is-leader', !hideNames && leader?.id === p.id);
      m.g.classList.toggle('no-label', !shown);
      m.g.classList.toggle('is-me', me === p.id);
      s.correct = p.correct;
    }
    for (const [id, m] of markers) if (!pos.has(id)) { m.g.remove(); markers.delete(id); }
    // Pemain lebih rendah dilukis dahulu supaya pemain di atas tidak tertutup.
    [...markers.values()].sort((a, b) => b.state.y - a.state.y).forEach(m => markersG.append(m.g));
    cardsG.innerHTML = arrange(cards).map(groupCard).join('');
    stationsG.classList.toggle('base-crowded', cards.some(c => c.base));
    const best = Math.max(0, ...players.map(p => p.correct));
    progressPath.style.strokeDasharray = `${length}`;
    progressPath.style.strokeDashoffset = `${length * (1 - best / total)}`;
  }

  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const walking = new Set();

  /** Gerak avatar mengikut lengkok denai, satu lonjakan bagi setiap soalan yang dijawab betul. */
  function walk(m, from, to, target) {
    if (calm() || walking.has(m) || to <= from) return false;
    walking.add(m); m.g.classList.add('walking');
    const steps = to - from, dur = Math.min(1700, 430 * steps);
    const l0 = length * from / total, l1 = length * to / total;
    const body = m.g.querySelector('.marker-body'), av = m.g.querySelector('.marker-avatar');
    const t0 = performance.now();
    let lastStep = -1;
    const frame = now => {
      const t = Math.min(1, (now - t0) / dur), e = t * t * (3 - 2 * t);
      const len = l0 + (l1 - l0) * e, p = path.getPointAtLength(len), q = path.getPointAtLength(Math.min(length, len + 8));
      m.g.style.transform = `translate(${p.x}px, ${p.y}px) scale(${target.scale})`;
      const phase = e * steps, hop = Math.abs(Math.sin(phase * Math.PI));
      body.style.transform = `translateY(${(-18 * hop).toFixed(2)}px) scale(${(1 + .07 * hop).toFixed(3)})`;
      const dx = q.x - p.x, d = Math.hypot(dx, q.y - p.y) || 1;
      av.style.transform = `rotate(${clamp(dx / d * 14, -14, 14).toFixed(1)}deg)`;
      const step = Math.floor(phase);
      if (step !== lastStep) { lastStep = step; footprint(p); }
      if (t < 1) requestAnimationFrame(frame);
      else {
        walking.delete(m); m.g.classList.remove('walking');
        body.style.transform = ''; av.style.transform = '';
        m.g.style.transform = `translate(${target.x}px, ${target.y}px) scale(${target.scale})`;
      }
    };
    requestAnimationFrame(frame);
    return true;
  }

  function footprint(p) {
    const e = document.createElementNS(NS, 'ellipse');
    e.setAttribute('class', 'fx-step'); e.setAttribute('cx', p.x); e.setAttribute('cy', p.y + 3);
    e.setAttribute('rx', 8); e.setAttribute('ry', 4);
    fx.append(e); setTimeout(() => e.remove(), 1500);
  }

  function burst(pt) {
    if (calm()) return;
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI * (.12 + .76 * Math.random()), r = 42 + Math.random() * 52;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'fx-spark'); c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y - 24);
      c.setAttribute('r', (3 + Math.random() * 4).toFixed(1));
      c.style.setProperty('--tx', `${(Math.cos(a) * r).toFixed(1)}px`);
      c.style.setProperty('--ty', `${(Math.sin(a) * r).toFixed(1)}px`);
      fx.append(c); setTimeout(() => c.remove(), 950);
    }
  }

  // Satu kesan "+m" bagi setiap stesen pada satu masa supaya tidak bertindan.
  const fxBusy = new Set();
  function climbFx(pt, steps, g, hop = true) {
    if (hop) { g.classList.remove('climbing'); void g.getBBox(); g.classList.add('climbing'); }
    const key = `${pt.x},${pt.y}`; if (fxBusy.has(key)) return; fxBusy.add(key); setTimeout(() => fxBusy.delete(key), 1600);
    burst(pt);
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('class', 'fx-up'); t.setAttribute('x', pt.x); t.setAttribute('y', pt.y - 110); t.setAttribute('text-anchor', 'middle');
    t.textContent = `+${fmt(Math.round(steps * SUMMIT_METRES / total))} m`;
    fx.append(t); setTimeout(() => t.remove(), 1600);
  }

  function setTotal(n) { if (n !== total) { total = n; length = 0; for (const m of markers.values()) m.state = {}; } }

  layout();
  return { update, setTotal, el };
}

