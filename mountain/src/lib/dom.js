export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const fmt = n => Number(n || 0).toLocaleString('ms-MY');
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Ganti kandungan elemen dengan HTML dan kembalikan elemen. */
export function render(el, html) { el.innerHTML = html; return el; }

export function toast(message, tone = 'info') {
  let box = $('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
  const t = document.createElement('div');
  t.className = `toast ${tone}`; t.textContent = message; box.append(t);
  setTimeout(() => t.classList.add('out'), 3200); setTimeout(() => t.remove(), 3700);
}

export const storage = {
  get(key, fallback = null) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} },
};

export const brand = (href = './') => `<a class="brand" href="${href}" aria-label="Rabbaniyyah Mountain Challenge — laman utama"><span class="brand-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M3 26 13 9l5 8 3-4 8 13z" fill="currentColor"/><path d="m13 9 2.6 4.4-2.6-1-2.4 1.6z" fill="#f4e6b8"/></svg></span><span>RABBANIYYAH<small>MOUNTAIN CHALLENGE</small></span></a>`;
