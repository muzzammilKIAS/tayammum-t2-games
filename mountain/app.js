import { sets } from './shared/game.js';

const trail = document.querySelector('#trail');
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
function selectLevel(index) {
  trail.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  const t = sets[index];
  document.querySelector('#level-detail').innerHTML = `<span class="detail-number">0${index + 1}</span><div><strong>${esc(t.title)}</strong><p>${esc(t.subtitle)}</p><p class="detail-topics">${t.questions.length} soalan</p></div><a href="solo.html?set=${encodeURIComponent(t.id)}">Cuba solo ↗</a>`;
}
sets.forEach((t, i) => {
  const button = document.createElement('button');
  button.className = 'level';
  button.setAttribute('aria-label', `Set ${i + 1}: ${t.title}`);
  button.innerHTML = `<span class="number">0${i + 1}</span><small>${esc(t.title)}</small>`;
  button.addEventListener('click', () => selectLevel(i));
  trail.append(button);
});
selectLevel(0);

const modal = document.querySelector('#modal');
document.querySelectorAll('[data-open=guide]').forEach(button => button.addEventListener('click', () => {
  document.querySelector('#modal-title').textContent = 'Langkah kecil, ilmu baharu.';
  document.querySelector('#modal-body').innerHTML = '<ol><li><strong>Guru</strong> memilih set soalan Tayammum dan mencipta sesi. Kod 6 digit dan QR dipaparkan pada skrin kelas.</li><li><strong>Pelajar</strong> menyertai di telefon, memilih avatar pendaki dan menunggu di Kem Pangkal.</li><li>Setiap jawapan betul menaikkan avatar di atas gunung. Jawapan salah tidak menaikkan altitud.</li><li>Lalui tiga persinggahan menuju puncak 3,000 m. Guru melihat semua pendaki secara langsung.</li></ol><p>Tiga set soalan Tayammum untuk Tingkatan 2: asas, tebus dan klinik fiqah.</p>';
  modal.showModal();
}));
document.querySelector('.close').addEventListener('click', () => modal.close());
document.querySelector('#modal-action').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
