import express from 'express';
import { createServer } from 'node:http';
import { randomBytes, randomInt } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import QRCode from 'qrcode';
import { questionsFor, questionsForSet, findSet, publicQuestion, recordAnswer, rankPlayers, altitude, accuracy, analytics, awards, levels, newPlayer, QUESTION_COUNTS, TIMER_OPTIONS } from './shared/game.js';
import { cleanAvatar } from './shared/avatar.js';

const root = dirname(fileURLToPath(import.meta.url));
const MAX_PLAYERS = 60;

// Alamat rangkaian kelas: utamakan Wi-Fi/Ethernet sebenar, elak penyesuai maya (VM, VPN, Docker).
function lanAddresses() {
  const score = name => /^(en|eth|wlan|wl)/i.test(name) ? 0 : /^(vnic|vmnet|bridge|docker|utun|tun|veth|br-)/i.test(name) ? 2 : 1;
  return Object.entries(networkInterfaces())
    .flatMap(([name, list]) => (list || []).filter(n => n.family === 'IPv4' && !n.internal).map(n => ({ name, address: n.address })))
    .sort((a, b) => score(a.name) - score(b.name)).map(n => n.address);
}

export function cleanName(value) {
  const name = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 20 || /[<>&"'`\\\x00-\x1f]/.test(name)) throw Error('Gunakan nama 2–20 aksara tanpa simbol khas.');
  return name;
}

function cleanSettings(s = {}) {
  const count = QUESTION_COUNTS.includes(s.count) ? s.count : 12;
  const timer = TIMER_OPTIONS.includes(s.timer) ? s.timer : 0;
  return { count, timer, leaderboard: s.calm === true ? false : s.leaderboard !== false, lateJoin: s.lateJoin !== false, duplicateNames: s.duplicateNames === true, calm: s.calm === true };
}

export function createApp({ static: staticDir = join(root, 'dist') } = {}) {
  const app = express(), http = createServer(app), io = new Server(http, { pingInterval: 10000, pingTimeout: 8000 }), rooms = new Map();
  app.get('/api/info', (req, res) => res.json({ lan: lanAddresses() }));
  app.get('/api/qr', async (req, res) => {
    const text = String(req.query.text || '');
    if (!/^https?:\/\/[^\s<>]{1,300}$/.test(text)) return res.status(400).send('URL tidak sah');
    res.type('image/svg+xml').send(await QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#143f36', light: '#ffffff' } }));
  });
  app.use(express.static(staticDir, { extensions: ['html'] }));

  const token = () => randomBytes(24).toString('hex');
  const publicPlayer = (room, p) => ({ id: p.id, name: p.name, avatar: p.avatar, index: p.index, correct: p.correct, wrong: p.wrong, score: p.score, streak: p.streak, bestStreak: p.bestStreak, finished: p.finished, online: p.online, answering: room.status === 'playing' && !p.finished && !p.feedback, accuracy: accuracy(p), altitude: altitude(p, room.questions.length) });
  const view = room => {
    const set = room.set ? findSet(room.set) : null, l = set ? null : levels[room.level - 1];
    const players = rankPlayers([...room.players.values()]).map((p, i) => ({ ...publicPlayer(room, p), rank: i + 1 }));
    return { code: room.code, level: room.level, set: room.set || null, label: set ? 'SET GURU' : `LEVEL ${room.level}`, title: set ? set.title : l.name, topics: set ? set.topics : l.topics.map(t => t.title), status: room.status, locked: room.locked, settings: room.settings, total: room.questions.length, players,
      results: room.status === 'ended' ? { analytics: analytics([...room.players.values()], room.questions), awards: awards([...room.players.values()]) } : null };
  };
  // Siaran digabung (≤10/s) supaya 50 pemain tidak membanjiri skrin host.
  function emitRoom(room, now = false) {
    if (now) { clearTimeout(room.emitTimer); room.emitTimer = null; io.to(room.code).emit('room', view(room)); return; }
    room.emitTimer ??= setTimeout(() => { room.emitTimer = null; if (rooms.has(room.code)) io.to(room.code).emit('room', view(room)); }, 100);
  }
  const socketsOf = (room, id) => [...io.sockets.sockets.values()].filter(s => s.data.code === room.code && (id ? s.data.id === id : s.data.role === 'player'));
  function sendQuestion(socket, room, p) {
    if (!p) return;
    if (p.feedback) return socket.emit('feedback', p.feedback);
    const q = room.questions[p.index];
    if (room.status !== 'playing' || !q) return socket.emit('question', null);
    p.sentAt ??= Date.now();
    const limit = room.settings.timer;
    socket.emit('question', { ...publicQuestion(q), index: p.index, total: room.questions.length, timer: limit, remaining: limit ? Math.max(0, limit * 1000 - (Date.now() - p.sentAt)) : null });
  }
  function me(room, p) { return { ...publicPlayer(room, p), rank: rankPlayers([...room.players.values()]).findIndex(x => x.id === p.id) + 1, answers: p.answers.map(a => ({ correct: a.correct, topicId: a.topicId })) }; }

  io.on('connection', socket => {
    let requests = 0; const limiter = setInterval(() => requests = 0, 1000);
    function on(event, fn) {
      socket.on(event, (input = {}, ack = () => {}) => {
        if (typeof ack !== 'function') return;
        try { if (++requests > 20) throw Error('Terlalu banyak permintaan. Cuba sebentar lagi.'); ack({ ok: true, ...fn(input && typeof input === 'object' ? input : {}) }); }
        catch (e) { ack({ ok: false, error: e.message }); }
      });
    }
    function requireRoom(host = false) {
      const room = rooms.get(socket.data.code);
      if (!room) throw Error('Sesi tidak ditemui atau sudah tamat.');
      if (host && socket.data.role !== 'host') throw Error('Kawalan ini untuk guru sahaja.');
      return room;
    }
    function attach(room, role, id) { if (socket.data.code) socket.leave(socket.data.code); socket.data = { code: room.code, role, id }; socket.join(room.code); }

    on('create', ({ level, set, settings }) => {
      if (socket.data.code) throw Error('Keluar daripada sesi semasa dahulu.');
      if (rooms.size >= 100) throw Error('Pelayan penuh. Cuba kemudian.');
      if (set != null ? !findSet(set) : !Number.isInteger(level) || !levels[level - 1]?.available) throw Error('Pilih level atau set yang tersedia.');
      const s = cleanSettings(settings);
      const questions = set != null ? questionsForSet(set) : questionsFor(level, s.count);
      if (set != null) s.count = questions.length;
      let code; do { code = String(randomInt(100000, 1000000)); } while (rooms.has(code));
      const room = { code, level: set != null ? 0 : level, set: set ?? null, settings: s, hostToken: token(), status: 'lobby', locked: false, players: new Map(), questions, created: Date.now(), touched: Date.now() };
      rooms.set(code, room); attach(room, 'host');
      return { token: room.hostToken, role: 'host', room: view(room) };
    });
    on('join', ({ code, name, avatar }) => {
      if (socket.data.code) throw Error('Keluar daripada sesi semasa dahulu.');
      const room = rooms.get(String(code ?? '').replace(/\D/g, ''));
      if (!room) throw Error('Kod sesi tidak ditemui. Semak semula dengan guru.');
      if (room.status === 'ended') throw Error('Sesi ini sudah tamat.');
      if (room.locked) throw Error('Guru telah mengunci penyertaan.');
      if (room.status !== 'lobby' && !room.settings.lateJoin) throw Error('Pendakian sudah bermula. Penyertaan lewat tidak dibenarkan.');
      if (room.players.size >= MAX_PLAYERS) throw Error(`Sesi penuh (${MAX_PLAYERS} pendaki).`);
      name = cleanName(name);
      if (!room.settings.duplicateNames && [...room.players.values()].some(p => p.name.toLowerCase() === name.toLowerCase())) throw Error('Nama sudah digunakan. Tambah huruf nama bapa atau nombor.');
      const p = newPlayer({ id: token().slice(0, 12), token: token(), name, avatar: cleanAvatar(avatar), online: true, joinedAt: Date.now() });
      room.players.set(p.id, p); attach(room, 'player', p.id); room.touched = Date.now();
      emitRoom(room, true); setTimeout(() => sendQuestion(socket, room, p));
      return { token: p.token, id: p.id, role: 'player', room: view(room), me: me(room, p) };
    });
    on('resume', ({ code, token: credential }) => {
      const room = rooms.get(String(code));
      if (!room) throw Error('Sesi sudah tamat atau pelayan telah dimulakan semula.');
      if (typeof credential !== 'string' || !credential) throw Error('Token tidak sah.');
      if (room.hostToken === credential) { attach(room, 'host'); return { role: 'host', token: credential, room: view(room) }; }
      const p = [...room.players.values()].find(x => x.token === credential);
      if (!p) throw Error('Sesi pemain tidak sah atau anda telah dikeluarkan.');
      attach(room, 'player', p.id); p.online = true; emitRoom(room); setTimeout(() => sendQuestion(socket, room, p));
      return { role: 'player', id: p.id, room: view(room), me: me(room, p) };
    });
    on('control', ({ action, playerId }) => {
      const room = requireRoom(true);
      const s = room.status;
      if (action === 'start') { if (s !== 'lobby') throw Error('Pendakian sudah bermula.'); if (!room.players.size) throw Error('Tunggu sekurang-kurangnya seorang pendaki.'); room.status = 'playing'; room.startedAt = Date.now(); }
      else if (action === 'pause' && s === 'playing') room.status = 'paused';
      else if (action === 'resume' && s === 'paused') { room.status = 'playing'; for (const p of room.players.values()) if (!p.feedback) p.sentAt = null; }
      else if (action === 'lock') room.locked = true;
      else if (action === 'unlock') room.locked = false;
      else if (action === 'end' && s !== 'ended') { room.status = 'ended'; room.endedAt = Date.now(); }
      else if (action === 'remove') {
        const p = room.players.get(playerId); if (!p) throw Error('Pemain tidak ditemui.');
        room.players.delete(p.id);
        for (const ps of socketsOf(room, p.id)) { ps.emit('removed'); ps.leave(room.code); ps.data = {}; }
      } else throw Error('Kawalan tidak tersedia sekarang.');
      room.touched = Date.now(); emitRoom(room, true);
      if (['start', 'pause', 'resume', 'end'].includes(action)) for (const ps of socketsOf(room)) { if (action === 'end') ps.emit('ended', me(room, room.players.get(ps.data.id))); else sendQuestion(ps, room, room.players.get(ps.data.id)); }
      return {};
    });
    on('answer', ({ id, answer }) => {
      const room = requireRoom();
      if (socket.data.role !== 'player') throw Error('Pemain sahaja.');
      if (room.status !== 'playing') throw Error(room.status === 'paused' ? 'Guru sedang menjeda pendakian.' : 'Pendakian belum bermula.');
      const p = room.players.get(socket.data.id); if (!p) throw Error('Pemain tidak ditemui.');
      if (p.feedback) throw Error('Jawapan sudah dihantar.');
      const feedback = recordAnswer(p, room.questions, id, answer ?? null, { elapsedMs: Date.now() - (p.sentAt ?? Date.now()), limitSec: room.settings.timer, calm: room.settings.calm });
      p.sentAt = null; room.touched = Date.now(); emitRoom(room);
      return { feedback, me: me(room, p) };
    });
    on('next', () => {
      const room = requireRoom();
      const p = room.players.get(socket.data.id); if (!p) throw Error('Pemain sahaja.');
      p.feedback = null; emitRoom(room); sendQuestion(socket, room, p);
      return { me: me(room, p) };
    });
    on('leave', () => { if (socket.data.code) socket.leave(socket.data.code); socket.data = {}; return {}; });
    socket.on('disconnect', () => {
      clearInterval(limiter);
      const room = rooms.get(socket.data.code), p = room?.players.get(socket.data.id);
      if (p) { p.online = socketsOf(room, p.id).length > 0; emitRoom(room); }
    });
  });
  // Sesi dibuang selepas 3 jam tanpa aktiviti.
  const cleanup = setInterval(() => { for (const [code, r] of rooms) if (Date.now() - r.touched > 3 * 3600_000) { io.to(code).emit('expired'); rooms.delete(code); } }, 60_000);
  cleanup.unref();
  http.on('close', () => clearInterval(cleanup));
  return { app, http, io, rooms };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT) || 3001;
  const { http } = createApp();
  http.listen(port, '0.0.0.0', () => {
    console.log(`Rabbaniyyah Mountain Challenge: http://localhost:${port}`);
    for (const ip of lanAddresses()) console.log(`  Rangkaian kelas: http://${ip}:${port}`);
  });
}
