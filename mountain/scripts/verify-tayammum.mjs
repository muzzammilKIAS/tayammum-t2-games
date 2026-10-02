// Pengesahan Playwright: mainkan setiap set Tayammum hingga habis (betul & salah berselang), tangkap skrin.
// Guna: PORT=3411 npm start (dalam terminal lain), kemudian  node scripts/verify-tayammum.mjs
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const BASE = process.env.BASE || 'http://localhost:3411', OUT = fileURLToPath(new URL('../../_bukti_pembersihan/mountain/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const sets = JSON.parse(readFileSync(new URL('../content/sets.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ channel: process.env.CHANNEL || 'chrome' });
const log = [], fail = [];
for (const set of sets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await page.goto(`${BASE}/solo.html?set=${set.id}`);
  let right = 0, wrong = 0, shotArr = false, shotMcq = false, shotFb = false;
  for (let i = 0; i < set.questions.length; i++) {
    const raw = set.questions[i], wantCorrect = i % 2 === 0;
    await page.waitForSelector('.q-card:not(.is-sent)');
    const shown = (await page.locator(raw.type === 'arrange' ? '.q-prompt' : '.q-main').innerText()).trim();
    if (shown !== (raw.type === 'arrange' ? raw.prompt : raw.questionMs)) fail.push(`${set.id} S${i + 1}: teks soalan tidak sepadan: ${shown}`);
    if (raw.type === 'arrange') {
      const order = wantCorrect ? raw.sequence : [...raw.sequence].reverse();
      for (const t of order) await page.locator('.arrange-bank .token:not([disabled])', { hasText: t }).first().click();
      const dir = await page.locator('.arrange-line').getAttribute('dir');
      const xs = await page.locator('.arrange-line .token').evaluateAll(els => els.map(e => ({ t: e.textContent, x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y })));
      const visual = [...xs].sort((a, b) => a.y - b.y || a.x - b.x).map(o => o.t).join('|');
      if (dir !== 'ltr' || visual !== order.join('|')) fail.push(`${set.id} S${i + 1}: susunan token tidak LTR (dir=${dir})`);
      if (!shotArr) { await page.screenshot({ path: `${OUT}${set.id}_susun.png` }); shotArr = true; }
      await page.click('[data-check]');
    } else {
      if (!shotMcq) { await page.screenshot({ path: `${OUT}${set.id}_soalan.png` }); shotMcq = true; }
      const idx = wantCorrect ? raw.answer : (raw.answer + 1) % raw.options.length;
      await page.locator('.option .opt-text', { hasText: new RegExp('^' + raw.options[idx].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).click();
    }
    await page.waitForSelector('.feedback');
    const cls = await page.locator('.feedback').getAttribute('class');
    if (cls.includes('is-correct') !== wantCorrect) fail.push(`${set.id} S${i + 1}: keputusan tidak seperti dijangka (${cls})`);
    wantCorrect ? right++ : wrong++;
    const expl = (await page.locator('.fb-explain').innerText()).trim();
    if (expl !== raw.explanation) fail.push(`${set.id} S${i + 1}: penjelasan tidak sepadan`);
    if (!shotFb && !wantCorrect) { await page.screenshot({ path: `${OUT}${set.id}_penjelasan_salah.png` }); shotFb = true; }
    await page.locator('.feedback button').click();
  }
  await page.waitForSelector('.finish');
  const body = await page.locator('body').innerText();
  if (/SAHKAN/.test(body)) fail.push(`${set.id}: penanda SAHKAN kelihatan`);
  await page.screenshot({ path: `${OUT}${set.id}_keputusan.png` });
  if (errs.length) fail.push(`${set.id}: ralat konsol ${errs.join(' / ')}`);
  log.push(`${set.id}: ${set.questions.length} soalan, ${right} dijawab betul, ${wrong} dijawab salah, skrin keputusan dicapai`);
  await page.close();
}
// Halaman host: Set Guru + Mod selamat
const host = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
await host.goto(`${BASE}/host.html`);
await host.waitForSelector('[data-set]');
const ids = await host.locator('[data-set]').evaluateAll(e => e.map(x => x.dataset.set));
if (ids.join() !== sets.map(s => s.id).join()) fail.push('host: senarai set tidak sepadan ' + ids);
const calm = host.locator('[data-toggle="calm"]'); await calm.check({ force: true });
if (!(await calm.isChecked())) fail.push('host: mod selamat tidak boleh dihidupkan');
await host.locator('[data-set="tayammum-asas"]').click();
log.push('host.html: set dalam Set Guru = ' + ids.join(', ') + '; mod selamat hidup = ' + await calm.isChecked() + '; ringkasan = ' + (await host.locator('#summary').innerText()).replace(/\n/g, ' '));
await host.screenshot({ path: `${OUT}host_set_guru.png`, fullPage: true });
await browser.close();
console.log(log.join('\n')); console.log(fail.length ? 'GAGAL:\n' + fail.join('\n') : 'SEMUA SEMAKAN LULUS'); process.exit(fail.length ? 1 : 0);
