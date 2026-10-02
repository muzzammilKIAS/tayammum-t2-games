import { chromium } from '@playwright/test';
const B = process.env.BASE || 'http://localhost:3413';
const OUT = '/Users/sufyanthawry/Desktop/03 PROJEK & PERISIAN/tayammum-t2-games/_bukti_pembersihan/mountain/';
const bad = /[؀-ۿ]|rabbani|mountain challenge|level|vocab|translation|kosa kata|arab|audio|\bthe\b|journey|base camp|checkpoint|summit|reward|mountain|score/i;
const browser = await chromium.launch({ channel: 'chrome' });
const issues = [];
const check = async (page, label) => {
  const t = await page.evaluate(() => document.body.innerText + ' | ' + document.title);
  const m = t.match(bad); if (m) issues.push(`${label}: "${m[0]}" ...${t.slice(Math.max(0, t.search(bad) - 40), t.search(bad) + 60).replace(/\n/g, ' ')}`);
  return t;
};
const shot = (page, n) => page.screenshot({ path: OUT + n + '.png', fullPage: false });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const errs = [];
const mk = async c => { const p = await c.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && !/fonts|favicon|ERR_/.test(m.text()) && errs.push(m.text())); return p; };
// index
let p = await mk(ctx); await p.goto(B + '/'); await p.waitForTimeout(500); await check(p, 'index'); await shot(p, '01-index');
await p.click('[data-open=guide]'); await check(p, 'index-modal'); await p.keyboard.press('Escape');
for (const i of [1, 2]) { await p.locator('#trail button').nth(i).click(); await check(p, 'index-trail' + i); }
// solo all sets
for (const [k, id] of ['tayammum-asas', 'tayammum-tebus', 'tayammum-klinik'].entries()) {
  p = await mk(ctx); await p.goto(`${B}/solo.html${k === 0 ? '' : '?set=' + id}`); await p.waitForTimeout(400);
  if (k === 0) { await check(p, 'solo-map'); await shot(p, '02-solo-peta'); await p.click(`[data-set=${id}]`); }
  let n = 0, shotQ = false, shotF = false;
  while (await p.locator('.q-card').count() && !(await p.locator('.finish').count())) {
    await check(p, `solo-${id}-q${n}`);
    if (!shotQ && k === 0) { await shot(p, '03-solo-soalan'); shotQ = true; }
    const arr = await p.locator('.q-card[data-type=arrange]').count();
    if (arr) { const toks = await p.locator('.arrange-bank .token').count(); for (let i = 0; i < toks; i++) await p.locator('.arrange-bank .token:not([disabled])').first().click(); await p.click('[data-check]'); }
    else await p.locator('.option').nth(n % 3).click();
    await p.waitForSelector('.feedback'); await check(p, `solo-${id}-fb${n}`);
    if (!shotF && k === 0) { await shot(p, '04-solo-penjelasan'); shotF = true; }
    await p.click('.feedback .btn'); n++; await p.waitForTimeout(150);
    if (n > 40) break;
  }
  await p.waitForSelector('.finish'); await check(p, `solo-${id}-hasil`); if (k === 0) await shot(p, '05-solo-keputusan'); console.log(id, 'soalan', n);
}
// host
const hostCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const h = await mk(hostCtx); await h.goto(B + '/host.html'); await h.waitForTimeout(400); await check(h, 'host-setup'); await shot(h, '06-host-pilih-set');
await h.click('[data-set=tayammum-tebus]'); await h.click('#create'); await h.waitForSelector('.game-code'); await check(h, 'host-lobi');
const code = (await h.locator('.game-code strong').innerText()).replace(/\s/g, ''); await shot(h, '07-host-lobi');
const pc = await browser.newContext({ viewport: { width: 390, height: 800 } });
const pl = await mk(pc); await pl.goto(B + '/join.html?code=' + code); await pl.waitForTimeout(300); await check(pl, 'join-kod'); await pl.click('.join-panel .btn-gold');
await pl.fill('#name', 'Aisyah'); await check(pl, 'join-nama'); await pl.click('.join-panel .btn-gold'); await pl.waitForTimeout(300); await check(pl, 'join-avatar');
for (let k = 0; k < 8; k++) { await check(pl, 'join-avatar' + k); const t = await pl.locator('[data-next]').innerText(); await pl.click('[data-next]'); if (/Sertai/.test(t)) break; } await pl.waitForSelector('.lobby-wait'); await check(pl, 'join-lobi'); await shot(pl, '08-pelajar-lobi');
await h.waitForSelector('.chip'); await h.click('#start');
await h.waitForSelector('.stage'); await pl.waitForSelector('.q-card');
let i = 0;
while (await pl.locator('.q-card:not(.is-sent)').count() || await pl.locator('.feedback').count()) {
  if (await pl.locator('.feedback').count()) { await pl.click('.feedback .btn'); await pl.waitForTimeout(300); continue; }
  await check(pl, 'player-q' + i);
  if (i === 0) await shot(pl, '09-pelajar-soalan');
  if (await pl.locator('.q-card[data-type=arrange]').count()) { const t = await pl.locator('.arrange-bank .token').count(); for (let j = 0; j < t; j++) await pl.locator('.arrange-bank .token:not([disabled])').first().click(); await pl.click('[data-check]'); }
  else await pl.locator('.option').nth(0).click();
  await pl.waitForSelector('.feedback'); await check(pl, 'player-fb' + i);
  if (i === 1) { await h.waitForTimeout(400); await check(h, 'host-game'); await shot(h, '10-host-gunung'); await h.click('[data-view=split]'); await check(h, 'host-split'); await h.click('[data-view=board]'); await check(h, 'host-board'); await h.click('[data-view=mountain]'); await h.click('#projector'); await h.waitForTimeout(400); await check(h, 'host-projector'); await shot(h, '11-host-projektor'); await h.click('#exit-proj'); }
  i++; if (i > 15) break;
  await pl.click('.feedback .btn'); await pl.waitForTimeout(250);
  if (await pl.locator('.finish').count()) break;
}
await pl.waitForTimeout(500); await check(pl, 'player-selesai');
await h.waitForSelector('#finish'); await h.click('#finish'); await h.waitForSelector('.results-page'); await check(h, 'host-keputusan'); await shot(h, '12-host-keputusan');
const csvTxt = await h.evaluate(() => document.querySelector('#csv') ? 'csv ok' : 'no csv'); console.log(csvTxt);
await pl.waitForSelector('.finish, .panel'); await check(pl, 'player-tamat'); await shot(pl, '13-pelajar-tamat');
console.log('soalan pelajar', i, 'errs', errs); console.log('ISU:', issues.length ? issues.join('\n') : 'tiada');
await browser.close();
