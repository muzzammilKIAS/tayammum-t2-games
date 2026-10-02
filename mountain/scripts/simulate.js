// Bot pendaki untuk ujian beban & demo: node scripts/simulate.js <kod> [bilangan=30] [url=http://localhost:3001]
// Bot menyertai, menerima soalan, meneka jawapan secara rawak, mendaki (jika betul) dan tamat.
// Bot tidak tahu jawapan kerana pelayan tidak pernah menghantarnya kepada klien.
import { io } from 'socket.io-client';
import { randomAvatar } from '../shared/avatar.js';

const names = ['Aisyah', 'Ahmad', 'Fatimah', 'Umar', 'Khadijah', 'Hafiz', 'Nur Iman', 'Irfan', 'Sofea', 'Hakim', 'Balqis', 'Danial', 'Zahra', 'Luqman', 'Maryam', 'Amir', 'Safiyyah', 'Harith', 'Humaira', 'Zikri', 'Aqilah', 'Yusuf', 'Hanis', 'Ammar', 'Syifa', 'Idris', 'Alya', 'Rayyan', 'Husna', 'Faris'];

export function simulatePlayers(code, count = 30, url = 'http://localhost:3001', { think = [1500, 6000] } = {}) {
  return Array.from({ length: count }, (_, i) => new Promise(resolve => {
    const s = io(url, { transports: ['websocket'], forceNew: true });
    const name = names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : '');
    const answer = q => setTimeout(() => {
      const pick = q.type === 'arrange' ? [...q.tokens].sort(() => Math.random() - .5) : Math.floor(Math.random() * q.options.length);
      s.emit('answer', { id: q.id, answer: pick }, () => setTimeout(() => s.emit('next', {}, () => {}), 800));
    }, think[0] + Math.random() * (think[1] - think[0]));
    s.on('connect', () => s.emit('join', { code, name, avatar: randomAvatar() }, r => { if (!r.ok) { console.error(name, r.error); resolve(); } }));
    s.on('question', q => q && answer(q));
    s.on('ended', () => { s.disconnect(); resolve(); });
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [code, n = 30, url] = process.argv.slice(2);
  if (!/^\d{6}$/.test(code || '')) { console.error('Guna: node scripts/simulate.js <kod 6 digit> [bilangan] [url]'); process.exit(1); }
  console.log(`Menghantar ${n} bot ke sesi ${code}…`);
  await Promise.all(simulatePlayers(code, +n, url));
  console.log('Semua bot selesai.'); process.exit(0);
}
