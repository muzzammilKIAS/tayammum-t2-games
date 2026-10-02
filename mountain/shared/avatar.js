// Sistem avatar pendaki: SVG berlapis, modular, tanpa aset luar.
export const palettes = {
  shirt: [['Hutan', '#2f6b57'], ['Laut', '#3f6fa0'], ['Bata', '#b8643f'], ['Ungu', '#6f5b93'], ['Emas', '#c49a3a'], ['Merah', '#a8464d']],
  pants: [['Arang', '#323d44'], ['Navy', '#2c3a5c'], ['Khaki', '#8a7a5a'], ['Zaitun', '#566146']],
  bag: [['Oren', '#dd8b35'], ['Biru', '#3d78b8'], ['Merah', '#b9474d'], ['Hijau', '#5d8a4c'], ['Kuning', '#d9b23b']],
  skin: [['Cerah', '#f2cfb0'], ['Kuning langsat', '#dfb08a'], ['Sawo matang', '#bf8a63'], ['Gelap', '#8c5a41']],
  headwear: [['Putih', '#f1eee6'], ['Hitam', '#2e3136'], ['Krim', '#dcc9a5'], ['Merah jambu', '#d69aa4'], ['Biru', '#7d9bc4'], ['Hijau', '#7f9f86']],
};
export const headStyles = {
  male: [['cap', 'Topi'], ['hair', 'Rambut'], ['kopiah', 'Kopiah']],
  female: [['hijab', 'Tudung'], ['hijab-cap', 'Tudung + topi']],
};
export const outfitStyles = [['jacket', 'Jaket'], ['tunic', 'Jubah pendek']];
export const bagStyles = [['daypack', 'Beg harian'], ['expedition', 'Beg ekspedisi']];
export const defaultAvatar = { gender: 'male', head: 'cap', style: 'jacket', bagStyle: 'daypack', shirt: 0, pants: 0, bag: 0, skin: 1, headwear: 1 };

export function cleanAvatar(value = {}) {
  const a = { ...defaultAvatar };
  if (!value || typeof value !== 'object') return a;
  for (const key of Object.keys(palettes)) if (Number.isInteger(value[key]) && palettes[key][value[key]]) a[key] = value[key];
  if (['male', 'female'].includes(value.gender)) a.gender = value.gender;
  const heads = headStyles[a.gender].map(([k]) => k);
  a.head = heads.includes(value.head) ? value.head : heads[0];
  if (outfitStyles.some(([k]) => k === value.style)) a.style = value.style;
  else if (a.gender === 'female') a.style = 'tunic';
  if (bagStyles.some(([k]) => k === value.bagStyle)) a.bagStyle = value.bagStyle;
  return a;
}

export function randomAvatar(rng = Math.random) {
  const pick = list => Math.floor(rng() * list.length);
  const gender = rng() < .5 ? 'male' : 'female';
  return cleanAvatar({ gender, head: headStyles[gender][pick(headStyles[gender])][0], style: outfitStyles[pick(outfitStyles)][0], bagStyle: bagStyles[pick(bagStyles)][0],
    shirt: pick(palettes.shirt), pants: pick(palettes.pants), bag: pick(palettes.bag), skin: pick(palettes.skin), headwear: pick(palettes.headwear) });
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  return '#' + [f(n >> 16), f(n >> 8 & 255), f(n & 255)].map(c => c.toString(16).padStart(2, '0')).join('');
}

const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

/**
 * @param {object} value avatar
 * @param {{label?: string, crop?: 'full'|'head', className?: string}} opts
 */
export function avatarSVG(value, { label = 'Avatar pendaki', crop = 'full', className = 'hiker' } = {}) {
  const a = cleanAvatar(value);
  const shirt = palettes.shirt[a.shirt][1], pants = palettes.pants[a.pants][1], bag = palettes.bag[a.bag][1];
  const skin = palettes.skin[a.skin][1], wear = palettes.headwear[a.headwear][1];
  const line = '#17332c', hair = '#2c2624', boot = '#2a3033';
  const long = a.style === 'tunic';
  const torsoEnd = long ? 118 : 104;
  const pack = a.bagStyle === 'expedition'
    ? `<rect x="23" y="46" width="36" height="62" rx="11" fill="${bag}"/><rect x="21" y="38" width="40" height="13" rx="6.5" fill="#d8ccb0"/><path d="M26 44.5h36" stroke="#b9a984" stroke-width="1.5"/><rect x="27" y="80" width="23" height="19" rx="6" fill="${shade(bag, -.12)}"/><path d="M29 62h25" stroke="${shade(bag, -.16)}" stroke-width="3" stroke-linecap="round"/>`
    : `<rect x="27" y="55" width="32" height="47" rx="13" fill="${bag}"/><rect x="30" y="78" width="21" height="17" rx="6" fill="${shade(bag, -.12)}"/><path d="M36 55q7-6 14 0" fill="none" stroke="${shade(bag, -.2)}" stroke-width="3"/>`;
  const legs = `<path d="M57 ${torsoEnd - 8} 49 141M67 ${torsoEnd - 8} 75 139" stroke="${pants}" stroke-opacity="1" stroke-width="13" stroke-linecap="round"/>
    <path d="M41 142q0-7 9-7l5 .5 1 7.5H42q-1 0-1-1zM70 139l5-3q9 0 9 6v1H70z" fill="${boot}"/>`;
  const torso = `<path d="M45 60q15-10 31-1l${long ? '5 58q-18 6-39 1' : '3 45q-17 5-36 0'}z" fill="${shirt}"/>
    <path d="M61 54v${torsoEnd - 58}" stroke="${shade(shirt, .14)}" stroke-opacity="1" stroke-width="2"/>
    ${long ? '' : `<path d="M44 99q18 5 36 0" stroke="${shade(shirt, -.14)}" stroke-opacity="1" stroke-width="4" fill="none"/>`}
    <path d="M52 58q6 22-2 42" stroke="${shade(bag, -.22)}" stroke-opacity="1" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  const arm = `<path d="M72 64q9 12 14 26" stroke="${shirt}" stroke-opacity="1" stroke-width="11" stroke-linecap="round" fill="none"/>
    <path d="M88 70 81 150" stroke="#5b6a62" stroke-opacity="1" stroke-width="3" stroke-linecap="round"/><circle cx="86.5" cy="92" r="5.5" fill="${skin}"/>`;
  const neck = `<path d="M56 44h11v13q-5.5 4-11 0z" fill="${shade(skin, -.08)}"/>`;
  const face = `<g fill="${line}"><ellipse cx="66" cy="34.5" rx="1.7" ry="2.1"/><ellipse cx="75" cy="34.5" rx="1.6" ry="2"/></g>
    <path d="M67.5 41.5q4 3 7.5-.5" fill="none" stroke="#8a4f41" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="63" cy="39.5" r="2.6" fill="#e0876f" opacity=".22"/>`;
  let head;
  if (a.gender === 'female') {
    head = `<path d="M42 38q-1-27 22-27 22 0 21 27l1 20q-4 8-22 9-18-1-23-9z" fill="${wear}"/>
      <ellipse cx="66" cy="36" rx="13" ry="15" fill="${skin}"/>${face}
      <path d="M52 27q13-11 27 0q-13-5-27 3z" fill="${shade(wear, -.08)}"/>
      <path d="M44 56q20 11 40 0l-2 9q-18 9-36 0z" fill="${shade(wear, -.1)}"/>`;
    if (a.head === 'hijab-cap') head += `<path d="M47 25q1-16 18-16 16 0 17 15z" fill="${shirt}"/><path d="M76 22q12-1 15 4-8 2-16 1z" fill="${shade(shirt, -.15)}"/>`;
  } else {
    head = `<ellipse cx="54" cy="36" rx="3.5" ry="4.5" fill="${shade(skin, -.06)}"/><circle cx="65" cy="35" r="16" fill="${skin}"/>${face}`;
    if (a.head === 'hair') head += `<path d="M49 38q-3-24 16-24 17 0 16 17-6-8-17-7-7 1-10 8l-1 7z" fill="${hair}"/>`;
    if (a.head === 'cap') head += `<path d="M49 33q-3-8 0-11 15 0 13 7z" fill="${hair}"/><path d="M48 28q0-17 17-17 16 0 16 15z" fill="${wear}"/><path d="M75 23q13-1 17 5-9 2-18 0z" fill="${shade(wear, -.18)}"/><circle cx="65" cy="11.5" r="2" fill="${shade(wear, -.18)}"/>`;
    if (a.head === 'kopiah') head += `<path d="M50 33q-2-6 1-8h5z" fill="${hair}"/><path d="M49 26q1-13 16-13t16 12q-16-4-32 1z" fill="${wear}"/><path d="M50 22.5q15-4 30 0" stroke="${shade(wear, -.15)}" stroke-width="1.4" fill="none" stroke-dasharray="2 2"/>`;
  }
  const viewBox = crop === 'head' ? '38 4 56 56' : '14 2 92 158';
  return `<svg class="${esc(className)}" viewBox="${viewBox}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">
  ${crop === 'full' ? '<ellipse cx="62" cy="148" rx="30" ry="5" fill="#0f2a2426"/>' : ''}
  <g stroke="${line}" stroke-opacity=".28" stroke-width="1.6" stroke-linejoin="round" paint-order="stroke">
  ${crop === 'full' ? pack + legs : ''}${torso}${crop === 'full' ? arm : ''}${neck}${head}
  </g></svg>`;
}
