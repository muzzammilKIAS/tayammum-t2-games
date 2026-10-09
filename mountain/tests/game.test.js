import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sets, publicQuestion, recordAnswer, newPlayer, altitude, rankPlayers, timeBonus, streakBonus, analytics, isCorrect, questionsForSet } from '../shared/game.js';
import { cleanAvatar } from '../shared/avatar.js';

test('tiada sisa kandungan Arab: hanya tiga set Tayammum', () => {
  assert.deepEqual(sets.map(s => s.id), ['tayammum-asas', 'tayammum-tebus', 'tayammum-klinik']);
  assert.doesNotMatch(JSON.stringify(sets), /[\u0600-\u06FF]/);
  assert.doesNotMatch(JSON.stringify(sets), /Rabbaniyyah/i);
});

test('setiap soalan set mempunyai jawapan betul yang sah dan unik', () => {
  for (const set of sets) for (const q of questionsForSet(set.id)) {
    if (q.type === 'arrange') { assert.equal([...q.answer].sort().join('|'), [...q.tokens].sort().join('|')); continue; }
    assert.ok(q.answer >= 0 && q.options[q.answer] === q.correctText, q.id);
    assert.equal(new Set(q.options).size, q.options.length, q.id);
    const p = publicQuestion(q); assert.equal(p.answer, undefined); assert.equal(p.correctText, undefined);
  }
});

test('rawak: susunan pilihan jawapan berubah antara sesi', () => {
  const orders = new Set(Array.from({ length: 8 }, () => questionsForSet('tayammum-asas').map(q => q.options?.join('|') ?? q.tokens.join('|')).join('#')));
  assert.ok(orders.size > 1);
});

test('skor & altitud: betul naik 250m, salah kekal, satu jawapan setiap soalan', () => {
  const qs = questionsForSet('tayammum-asas'), p = newPlayer({ name: 'A' });
  const right = q => q.answer;
  const fb = recordAnswer(p, qs, qs[0].id, right(qs[0]), { elapsedMs: 2000 });
  assert.equal(fb.correct, true); assert.equal(altitude(p, 16), 188); assert.equal(p.score, 1300);
  assert.throws(() => recordAnswer(p, qs, qs[0].id, right(qs[0])), /sudah dihantar/);
  const wrong = qs[1].type === 'arrange' ? [...qs[1].answer].reverse() : (qs[1].answer + 1) % qs[1].options.length;
  const fb2 = recordAnswer(p, qs, qs[1].id, wrong);
  if (!isCorrect(qs[1], wrong)) { assert.equal(fb2.correct, false); assert.equal(altitude(p, 16), 188); assert.equal(p.streak, 0); }
  const fb3 = recordAnswer(p, qs, qs[2].id, null);
  assert.equal(fb3.timedOut, true); assert.equal(fb3.correct, false);
});

test('jawapan tidak sah ditolak; jawapan lewat dikira salah', () => {
  const qs = questionsForSet('tayammum-asas'), p = newPlayer({ name: 'B' });
  const q = qs[0];
  assert.throws(() => recordAnswer(p, qs, q.id, q.type === 'arrange' ? ['x'] : 99), /sah/);
  const fb = recordAnswer(p, qs, q.id, q.answer, { elapsedMs: 40_000, limitSec: 20 });
  assert.equal(fb.correct, false);
});

test('bonus masa dan rentetan', () => {
  assert.equal(timeBonus(0, 20), 300); assert.equal(timeBonus(20_000, 20), 0); assert.equal(timeBonus(3000, 0), 300);
  assert.deepEqual([1, 2, 3, 4, 5, 8].map(streakBonus), [0, 0, 100, 0, 200, 300]);
});

test('kedudukan ikut skor, kemudian bilangan betul', () => {
  const r = rankPlayers([{ name: 'A', score: 2000, correct: 2 }, { name: 'B', score: 2600, correct: 2 }, { name: 'C', score: 2000, correct: 3 }]);
  assert.deepEqual(r.map(p => p.name), ['B', 'C', 'A']);
});

test('analitik: ketepatan topik Tayammum dan penanda ulang kaji', () => {
  const qs = questionsForSet('tayammum-asas'), p = newPlayer({ name: 'A' });
  qs.forEach((q, i) => recordAnswer(p, qs, q.id, i < 8 ? q.answer : null));
  const a = analytics([p], qs);
  assert.equal(a.topics.length, 1);
  assert.equal(a.topics[0].title, 'Tayammum');
  assert.equal(a.topics[0].accuracy, 50);
  assert.equal(a.questions.filter(q => q.needsReview).length, 8);
  assert.ok(a.questions.every(q => q.text && !/[\u0600-\u06FF]/.test(q.text)));
});

test('avatar dibersihkan daripada input tidak sah', () => {
  assert.deepEqual(cleanAvatar({ gender: 'female', head: 'cap', shirt: 99, x: '<script>' }).head, 'hijab');
  assert.equal(cleanAvatar(null).gender, 'male');
});

test('set guru: soalan tetap, jawapan sah selepas rombak, susun ayat dan mod selamat', () => {
  const qs = questionsForSet('tayammum-asas');
  assert.equal(qs.length, 16);
  for (const q of qs) {
    if (q.type === 'arrange') { assert.equal(q.answer.length, q.tokens.length); assert.ok(q.answer.every(t => q.tokens.includes(t))); }
    else { assert.equal(q.options[q.answer], q.correctText); assert.ok(!('answer' in publicQuestion(q))); }
    assert.ok(q.explanation && q.topicTitle);
  }
  assert.equal(questionsForSet('tayammum-klinik').length, 12);
  assert.ok(qs.some(q => q.type === 'arrange'), 'set mesti ada soalan susun');
  assert.equal(questionsForSet('tayammum-tebus').length, 12);
  // Mod selamat: tiada bonus kelajuan, jawapan pantas dan perlahan dapat markah sama.
  const fast = newPlayer(), slow = newPlayer();
  recordAnswer(fast, qs, qs[0].id, qs[0].answer, { elapsedMs: 500, calm: true });
  recordAnswer(slow, qs, qs[0].id, qs[0].answer, { elapsedMs: 25000, calm: true });
  assert.equal(fast.score, 1000); assert.equal(slow.score, 1000);
  const arr = qs.find(q => q.type === 'arrange'), p = newPlayer({ index: qs.indexOf(arr) });
  recordAnswer(p, qs, arr.id, [...arr.answer]);
  assert.equal(p.correct, 1);
});
