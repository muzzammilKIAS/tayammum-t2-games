import { $, $$, esc } from '../lib/dom.js';
import { avatarSVG, cleanAvatar, palettes, headStyles, outfitStyles, bagStyles, randomAvatar } from '../../shared/avatar.js';

const steps = [
  { key: 'gender', title: 'Jantina', hint: 'Pilih pendaki yang mewakili diri anda.' },
  { key: 'outfit', title: 'Pakaian', hint: 'Gaya dan warna pakaian mendaki.' },
  { key: 'bag', title: 'Beg galas', hint: 'Setiap pendaki perlukan beg yang dipercayai.' },
  { key: 'look', title: 'Penampilan', hint: 'Warna kulit dan penutup kepala.' },
];

const swatches = (key, value) => `<div class="swatches" role="radiogroup" aria-label="${key}">${palettes[key].map(([name, hex], i) => `<button type="button" class="swatch" role="radio" aria-checked="${value === i}" data-key="${key}" data-value="${i}" style="--c:${hex}" title="${esc(name)}"><span class="sr">${esc(name)}</span></button>`).join('')}</div>`;
const choices = (key, list, value, preview) => `<div class="choices" role="radiogroup" aria-label="${key}">${list.map(([k, label]) => `<button type="button" class="choice" role="radio" aria-checked="${value === k}" data-key="${key}" data-value="${k}">${preview ? `<span class="choice-av">${preview(k)}</span>` : ''}<span>${esc(label)}</span></button>`).join('')}</div>`;

/**
 * Pemilih avatar berperingkat: Jantina → Pakaian → Beg → Penampilan → Sahkan.
 * @param {HTMLElement} el
 * @param {{avatar:object, name?:string, onDone:(avatar)=>void, onBack?:()=>void, doneLabel?:string}} opts
 */
export function avatarPicker(el, { avatar, name = '', onDone, onBack, doneLabel = 'Sahkan avatar' }) {
  let a = cleanAvatar(avatar), step = 0;
  function body() {
    const s = steps[step].key;
    if (s === 'gender') return choices('gender', [['male', 'Lelaki'], ['female', 'Perempuan']], a.gender, g => avatarSVG({ ...a, gender: g, head: undefined, style: g === 'female' ? 'tunic' : a.style }, { crop: 'head', label: '' }));
    if (s === 'outfit') return `<h4>Gaya</h4>${choices('style', outfitStyles, a.style)}<h4>Warna baju</h4>${swatches('shirt', a.shirt)}<h4>Warna seluar</h4>${swatches('pants', a.pants)}`;
    if (s === 'bag') return `<h4>Jenis beg</h4>${choices('bagStyle', bagStyles, a.bagStyle, k => avatarSVG({ ...a, bagStyle: k }, { label: '' }))}<h4>Warna beg</h4>${swatches('bag', a.bag)}`;
    return `<h4>Penutup kepala</h4>${choices('head', headStyles[a.gender], a.head, k => avatarSVG({ ...a, head: k }, { crop: 'head', label: '' }))}<h4>Warna ${a.gender === 'female' ? 'tudung' : 'topi / kopiah'}</h4>${swatches('headwear', a.headwear)}<h4>Warna kulit</h4>${swatches('skin', a.skin)}`;
  }
  function draw() {
    el.innerHTML = `
    <div class="picker">
      <div class="picker-stage"><div class="picker-preview">${avatarSVG(a, { label: `Avatar ${name}` })}</div>${name ? `<span class="picker-name">${esc(name)}</span>` : ''}<button type="button" class="btn btn-quiet btn-sm" data-random>⟳ Rawak</button></div>
      <div class="picker-panel">
        <ol class="stepper">${steps.map((s, i) => `<li class="${i === step ? 'on' : i < step ? 'done' : ''}"><button type="button" data-step="${i}"><span>${i + 1}</span>${s.title}</button></li>`).join('')}</ol>
        <h3>${steps[step].title}</h3><p class="hint">${steps[step].hint}</p>
        <div class="picker-body">${body()}</div>
        <div class="picker-nav">
          <button type="button" class="btn btn-ghost" data-prev>${step === 0 ? '← Kembali' : '← Sebelum'}</button>
          <button type="button" class="btn ${step === steps.length - 1 ? 'btn-gold' : 'btn-primary'}" data-next>${step === steps.length - 1 ? `${doneLabel} ✓` : 'Seterusnya →'}</button>
        </div>
      </div>
    </div>`;
    $$('[data-key]', el).forEach(b => b.onclick = () => {
      const k = b.dataset.key, v = b.dataset.value;
      a = cleanAvatar({ ...a, [k]: palettes[k] ? +v : v, ...(k === 'gender' ? { head: undefined, style: v === 'female' ? 'tunic' : 'jacket' } : {}) });
      draw();
    });
    $$('[data-step]', el).forEach(b => b.onclick = () => { step = +b.dataset.step; draw(); });
    $('[data-random]', el).onclick = () => { a = randomAvatar(); draw(); };
    $('[data-prev]', el).onclick = () => { if (step === 0) onBack?.(); else { step--; draw(); } };
    $('[data-next]', el).onclick = () => { if (step === steps.length - 1) onDone(a); else { step++; draw(); } };
    if (!onBack && step === 0) $('[data-prev]', el).style.visibility = 'hidden';
  }
  draw();
}
