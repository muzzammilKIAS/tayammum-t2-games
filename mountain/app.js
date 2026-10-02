import { levels } from './shared/game.js';

const trail = document.querySelector('#trail');
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
function selectLevel(index) {
  trail.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  const l = levels[index];
  document.querySelector('#level-detail').innerHTML = `<span class="detail-number">0${l.id}</span><div><strong>${l.name}</strong><p>${l.tagline}</p>${l.available ? `<p class="detail-topics" lang="ar" dir="rtl">${l.topics.map(t => esc(t.title)).join(' <b>+</b> ')}</p>` : ''}</div>${l.available ? `<a href="solo.html?level=${l.id}">Topik ${l.topicIds.join(' + ')} · Cuba solo ↗</a>` : '<span>Akan datang</span>'}`;
}
levels.forEach((l, i) => {
  const button = document.createElement('button');
  button.className = 'level';
  button.setAttribute('aria-label', `Level ${l.id}: ${l.name}`);
  button.innerHTML = `<span class="number">${i === 6 ? '⚑' : `0${i + 1}`}</span><small>${l.name}</small>`;
  button.addEventListener('click', () => selectLevel(i));
  trail.append(button);
});
selectLevel(0);

const modal = document.querySelector('#modal');
document.querySelectorAll('[data-open=guide]').forEach(button => button.addEventListener('click', () => {
  document.querySelector('#modal-title').textContent = 'Langkah kecil, ilmu baharu.';
  document.querySelector('#modal-body').innerHTML = '<ol><li><strong>Guru</strong> memilih level dan mencipta sesi. Kod 6 digit dan QR dipaparkan pada skrin kelas.</li><li><strong>Pelajar</strong> menyertai di telefon, memilih avatar pendaki dan menunggu di Base Camp.</li><li>Setiap jawapan betul menaikkan avatar di atas gunung. Jawapan salah tidak menaikkan altitud.</li><li>Lalui tiga checkpoint menuju puncak 3,000 m. Guru melihat semua pendaki secara langsung.</li></ol><p>Setiap level menggabungkan dua topik sebenar daripada modul Rabbaniyyah.</p>';
  modal.showModal();
}));
document.querySelector('.close').addEventListener('click', () => modal.close());
document.querySelector('#modal-action').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
