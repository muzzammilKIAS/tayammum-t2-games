// Ujian penerimaan kritikal §44: Live Mountain.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as client } from 'socket.io-client';
import { createApp } from '../server.js';

let server, url, rooms, ioServer;
before(async () => { const app = createApp(); server = app.http; rooms = app.rooms; ioServer = app.io; await new Promise(r => server.listen(0, '127.0.0.1', r)); url = `http://127.0.0.1:${server.address().port}`; });
after(() => new Promise(r => ioServer.close(() => r())));

const connect = () => new Promise(r => { const s = client(url, { transports: ['websocket'], forceNew: true }); s.on('connect', () => r(s)); });
const call = (s, ev, data = {}) => new Promise((res, rej) => s.emit(ev, data, r => r.ok ? res(r) : rej(new Error(r.error))));
const next = (s, ev) => new Promise(r => s.once(ev, r));
// Simpan paparan terkini yang diterima host supaya acara yang tiba lebih awal tidak terlepas.
const latest = new WeakMap();
const track = s => { s.on('room', room => latest.set(s, room)); return s; };
const waitRoom = (s, pred, ms = 5000) => new Promise((r, j) => {
  if (latest.has(s) && pred(latest.get(s))) return r(latest.get(s));
  const t = setTimeout(() => { s.off('room', h); j(new Error('Host tidak menerima kemas kini yang dijangka')); }, ms);
  const h = room => { if (pred(room)) { clearTimeout(t); s.off('room', h); r(room); } }; s.on('room', h);
});
const answerFor = (code, q) => rooms.get(code).questions[q.index].answer;
const wrongFor = (code, q) => { const a = answerFor(code, q); return q.type === 'arrange' ? [...a].reverse() : (a + 1) % q.options.length; };

test('host → 5 pemain → mendaki langsung → puncak → host muat semula', async () => {
  const host = track(await connect());
  const created = await call(host, 'create', { level: 1, settings: { count: 8, timer: 0 } });
  const code = created.room.code;
  assert.match(code, /^\d{6}$/);

  const names = ['Ali', 'Sara', 'Chong', 'Devi', 'Esa'];
  const players = [];
  for (const name of names) { const s = await connect(); const r = await call(s, 'join', { code, name, avatar: { gender: 'female' } }); players.push({ s, id: r.id, token: r.token, name }); }
  const lobby = await waitRoom(host, r => r.players.length === 5);
  assert.equal(lobby.players.length, 5);

  const qWaits = players.map(p => next(p.s, 'question'));
  await call(host, 'control', { action: 'start' });
  const qs = await Promise.all(qWaits);
  assert.ok(qs.every(q => q && q.index === 0 && q.answer === undefined));
  assert.ok([...rooms.get(code).players.values()].every(p => p.correct === 0)); // semua di Base Camp

  const [A, B, C] = players;
  let upd = waitRoom(host, r => r.players.find(p => p.id === A.id).correct === 1);
  const fa = await call(A.s, 'answer', { id: qs[0].id, answer: answerFor(code, qs[0]) });
  assert.equal(fa.feedback.correct, true);
  let room = await upd;
  assert.equal(room.players.find(p => p.id === A.id).altitude, 375);
  assert.ok(room.players.filter(p => p.id !== A.id).every(p => p.correct === 0), 'hanya A bergerak');

  const fb = await call(B.s, 'answer', { id: qs[1].id, answer: wrongFor(code, qs[1]) });
  assert.equal(fb.feedback.correct, false);
  await assert.rejects(call(B.s, 'answer', { id: qs[1].id, answer: answerFor(code, qs[1]) }), /sudah dihantar/);

  upd = waitRoom(host, r => r.players.find(p => p.id === C.id).correct === 1);
  await call(C.s, 'answer', { id: qs[2].id, answer: answerFor(code, qs[2]) });
  room = await upd;
  assert.equal(room.players.find(p => p.id === B.id).correct, 0, 'B kekal');
  assert.equal(room.players[0].id === A.id || room.players[0].id === C.id, true, 'kedudukan dikemas kini');

  // A menjawab semua dengan betul hingga ke puncak
  for (let i = 1; i < 8; i++) {
    const w = next(A.s, 'question'); await call(A.s, 'next'); const q = await w;
    await call(A.s, 'answer', { id: q.id, answer: answerFor(code, q) });
  }
  room = await waitRoom(host, r => r.players.find(p => p.id === A.id).finished);
  const a = room.players.find(p => p.id === A.id);
  assert.equal(a.altitude, 3000); assert.equal(a.rank, 1);
  assert.equal(room.players.filter(p => !p.finished).length, 4, 'yang lain masih mendaki');

  // Host muat semula: sambung dengan token
  host.disconnect();
  const host2 = await connect();
  const resumed = await call(host2, 'resume', { code, token: created.token });
  assert.equal(resumed.role, 'host');
  assert.equal(resumed.room.players.find(p => p.id === A.id).altitude, 3000);
  assert.equal(resumed.room.players.find(p => p.id === C.id).correct, 1);

  // Pemain putus sambungan dan sambung semula tanpa hilang kemajuan
  C.s.disconnect();
  const c2 = await connect();
  const fbWait = next(c2, 'feedback');
  const rc = await call(c2, 'resume', { code, token: C.token });
  assert.equal(rc.me.correct, 1);
  assert.equal((await fbWait).correct, true, 'maklum balas yang belum ditutup dipulihkan');
  const qWait = next(c2, 'question'); await call(c2, 'next');
  assert.equal((await qWait).index, 1, 'soalan seterusnya selepas sambung semula');

  // Bukan host tidak boleh mengawal
  await assert.rejects(call(B.s, 'control', { action: 'end' }), /guru/);
  const ended = next(B.s, 'ended');
  await call(host2, 'control', { action: 'end' });
  const meB = await ended;
  assert.equal(meB.wrong, 1);
  for (const s of [host2, c2, ...players.map(p => p.s)]) s.disconnect();
});

test('ralat: kod salah, nama sama, nama berbahaya, sesi dikunci', async () => {
  const host = await connect(), s = await connect(), s2 = await connect(), s3 = await connect();
  const { room } = await call(host, 'create', { level: 2 });
  await assert.rejects(call(s, 'join', { code: '000000', name: 'Ali' }), /tidak ditemui/);
  await call(s, 'join', { code: room.code, name: 'Ali' });
  await assert.rejects(call(s2, 'join', { code: room.code, name: 'ali' }), /sudah digunakan/);
  await assert.rejects(call(s2, 'join', { code: room.code, name: '<b>x</b>' }), /simbol/);
  await call(host, 'control', { action: 'lock' });
  await assert.rejects(call(s3, 'join', { code: room.code, name: 'Baru' }), /mengunci/);
  for (const x of [host, s, s2, s3]) x.disconnect();
});
