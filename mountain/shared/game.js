import topics from '../content/topics.json' with { type: 'json' };
import sets from '../content/sets.json' with { type: 'json' };

export { topics, sets };
export const SUMMIT_METRES = 3000;
export const QUESTION_COUNTS = [8, 12, 16];
export const TIMER_OPTIONS = [0, 15, 20, 30, 45, 60];

const scenes = [
  ['Green Trail', 'Jejak pertama di lereng hijau.'],
  ['Forest Path', 'Merentasi hutan yang redup.'],
  ['Waterfall Ridge', 'Singgah di rabung air terjun.'],
  ['Cloud Pass', 'Melangkah di celah awan.'],
  ['Rocky Mountain', 'Laluan berbatu yang mencabar.'],
  ['High Altitude', 'Semakin tinggi, semakin dekat.'],
  ['Final Summit', 'Persinggahan terakhir menuju puncak.'],
];

/** 7 level; setiap level = 2 topik berturutan. Level tanpa 2 topik sebenar ditanda tidak tersedia. */
export const levels = scenes.map(([name, tagline], i) => {
  const pair = [topics[i * 2], topics[i * 2 + 1]].filter(Boolean);
  return { id: i + 1, name, tagline, topicIds: [i * 2 + 1, i * 2 + 2], topics: pair, available: pair.length === 2 };
});
export const levelNames = levels.map(l => l.name);

export function shuffle(array, rng = Math.random) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function pickOptions(correct, pool, rng, n = 4) {
  const others = shuffle([...new Set(pool)].filter(x => x !== correct), rng).slice(0, n - 1);
  return shuffle([correct, ...others], rng);
}

/** Bank soalan penuh untuk satu topik, semuanya daripada data sumber. */
export function topicBank(topic, rng = Math.random) {
  const base = { topicId: topic.id, topicTitle: topic.title, sourceTopic: topic.title, sourceReference: topic.source };
  const meanings = topic.vocab.map(v => v.meaning), words = topic.vocab.map(v => v.word);
  const bank = [];
  topic.vocab.forEach((v, i) => {
    const o1 = pickOptions(v.meaning, meanings, rng);
    bank.push({ ...base, id: `t${topic.id}-v${i}`, concept: `v${i}`, type: 'vocabulary', difficulty: 'easy',
      prompt: 'Apakah maksud perkataan ini?', questionAr: v.word, options: o1, optionsDir: 'ltr', answer: o1.indexOf(v.meaning),
      correctText: v.meaning, explanation: `${v.word} = ${v.meaning}`, sourceSection: 'Kosa kata' });
    const o2 = pickOptions(v.word, words, rng);
    bank.push({ ...base, id: `t${topic.id}-m${i}`, concept: `v${i}`, type: 'translation', difficulty: 'medium',
      prompt: 'Pilih perkataan Arab yang betul', questionMs: v.meaning, options: o2, optionsDir: 'rtl', answer: o2.indexOf(v.word),
      correctText: v.word, explanation: `${v.meaning} = ${v.word}`, sourceSection: 'Kosa kata' });
  });
  const fillPool = [...topic.fillBank, ...topic.fill.map(f => f.answer)];
  topic.fill.forEach((f, i) => {
    const o = pickOptions(f.answer, fillPool, rng);
    bank.push({ ...base, id: `t${topic.id}-f${i}`, concept: `f${i}`, type: 'fill-blank', difficulty: 'medium',
      prompt: 'Lengkapkan ayat', questionAr: [f.before, '＿＿＿', f.after].filter(Boolean).join(' '), options: o, optionsDir: 'rtl',
      answer: o.indexOf(f.answer), correctText: f.answer, explanation: [f.before, f.answer, f.after].filter(Boolean).join(' '), sourceSection: 'Latihan: lengkapkan ayat' });
  });
  topic.qa.forEach((q, i) => {
    const o = pickOptions(q.answer, q.options, rng);
    bank.push({ ...base, id: `t${topic.id}-q${i}`, concept: `q${i}`, type: 'multiple-choice', difficulty: 'medium',
      prompt: 'Pilih jawapan yang betul', questionAr: q.question, options: o, optionsDir: 'rtl', answer: o.indexOf(q.answer),
      correctText: q.answer, explanation: `${q.question} — ${q.answer}`, sourceSection: 'Latihan: soal jawab' });
  });
  topic.order.forEach((o, i) => {
    bank.push({ ...base, id: `t${topic.id}-o${i}`, concept: `o${i}`, type: 'arrange', difficulty: 'hard',
      prompt: 'Susun perkataan menjadi ayat', tokens: shuffle(o.tokens, rng), answer: o.sequence,
      correctText: o.answer, explanation: o.answer, sourceSection: 'Latihan: susun perkataan' });
  });
  return bank;
}

// Taburan jenis bagi setiap topik: seimbang antara mudah, sederhana dan sukar.
const typePlan = ['vocabulary', 'fill-blank', 'multiple-choice', 'arrange', 'translation', 'vocabulary', 'fill-blank', 'multiple-choice'];

/** Pilih n soalan daripada satu topik, pelbagai jenis, tanpa ulang konsep yang sama. */
export function pickFromTopic(topic, n, rng = Math.random) {
  const byType = {};
  for (const q of shuffle(topicBank(topic, rng), rng)) (byType[q.type] ??= []).push(q);
  const chosen = [], concepts = new Set();
  const take = type => {
    const list = byType[type] || [];
    const i = list.findIndex(q => !concepts.has(q.concept));
    if (i < 0) return false;
    const [q] = list.splice(i, 1); chosen.push(q); concepts.add(q.concept); return true;
  };
  for (let round = 0; chosen.length < n && round < 20; round++) {
    let progressed = false;
    for (const type of typePlan) { if (chosen.length >= n) break; progressed = take(type) || progressed; }
    if (!progressed) break;
  }
  if (chosen.length < n) throw new Error(`Topik ${topic.id} tidak mempunyai ${n} soalan unik.`);
  return chosen;
}

/** Soalan sesi: separuh daripada setiap topik level, disusun berselang-seli secara rawak. */
export function questionsFor(level, count = 12, rng = Math.random) {
  const l = levels[level - 1];
  if (!l?.available) throw new Error('Kandungan level belum tersedia.');
  if (!QUESTION_COUNTS.includes(count)) throw new Error('Bilangan soalan tidak sah.');
  const [a, b] = l.topics.map(t => pickFromTopic(t, count / 2, rng));
  return shuffle([...a, ...b], rng).map((q, i) => ({ ...q, id: `${q.id}#${i}`, level }));
}

/** Set guru: soalan tetap yang dibina khusus untuk satu pelajaran (mis. ulang kaji Unit 7–9). */
export const findSet = id => sets.find(s => s.id === id) || null;
export function questionsForSet(id, rng = Math.random) {
  const set = findSet(id);
  if (!set) throw new Error('Set soalan tidak ditemui.');
  return set.questions.map((raw, i) => {
    const base = { id: `${set.id}-${i}#${i}`, concept: `${set.id}-${i}`, setId: set.id, level: 0, type: raw.type, difficulty: 'medium',
      prompt: raw.prompt, topicId: raw.topic, topicTitle: raw.topicTitle, explanation: raw.explanation };
    for (const k of ['questionAr', 'questionMs', 'image', 'imageAlt', 'audio']) if (raw[k]) base[k] = raw[k];
    if (raw.type === 'arrange') {
      let tokens = shuffle(raw.sequence, rng);
      for (let n = 0; tokens.every((t, j) => t === raw.sequence[j]) && n < 5; n++) tokens = shuffle(raw.sequence, rng);
      return { ...base, tokens, answer: raw.sequence, correctText: raw.sequence.join(' ') };
    }
    const correct = raw.options[raw.answer];
    const options = shuffle(raw.options, rng);
    return { ...base, options, optionsDir: raw.optionsDir, answer: options.indexOf(correct), correctText: correct };
  });
}

/** Versi soalan untuk klien: tanpa jawapan. */
export function publicQuestion(q) {
  if (!q) return null;
  const { answer, correctText, explanation, concept, ...rest } = q;
  return rest;
}

export function isCorrect(q, answer) {
  if (q.type === 'arrange') return Array.isArray(answer) && answer.length === q.answer.length && answer.every((t, i) => t === q.answer[i]);
  return answer === q.answer;
}

export function validAnswer(q, answer) {
  if (answer === null) return true; // masa tamat
  if (q.type === 'arrange') return Array.isArray(answer) && answer.length === q.tokens.length && answer.every(t => q.tokens.includes(t));
  return Number.isInteger(answer) && answer >= 0 && answer < q.options.length;
}

export const altitudeStep = total => SUMMIT_METRES / total;
export function altitude(player, total = 12) { return Math.round(player.correct * altitudeStep(total)); }

export function streakBonus(streak) { return streak === 3 ? 100 : streak === 5 ? 200 : streak === 8 ? 300 : 0; }
/** Bonus masa 0–300: dengan pemasa ikut baki masa; tanpa pemasa, penuh jika ≤5s dan susut hingga 30s. */
export function timeBonus(elapsedMs, limitSec) {
  const s = Math.max(0, elapsedMs / 1000);
  const frac = limitSec ? 1 - s / limitSec : 1 - Math.max(0, s - 5) / 25;
  return Math.round(300 * Math.min(1, Math.max(0, frac)));
}

export function newPlayer(extra = {}) {
  return { index: 0, correct: 0, wrong: 0, score: 0, streak: 0, bestStreak: 0, answers: [], finished: false, feedback: null, ...extra };
}

/** Rekod jawapan secara autoritatif. Satu jawapan sah bagi setiap soalan. */
export function recordAnswer(player, questions, id, answer, { elapsedMs = 0, limitSec = 0, calm = false, now = Date.now() } = {}) {
  const q = questions[player.index];
  if (!q || q.id !== id) throw new Error('Jawapan sudah dihantar atau soalan telah berubah.');
  if (!validAnswer(q, answer)) throw new Error('Pilih jawapan yang sah.');
  const late = limitSec && elapsedMs > (limitSec + 2) * 1000;
  const correct = !late && answer !== null && isCorrect(q, answer);
  let earned = 0;
  if (correct) {
    player.correct++; player.streak++;
    player.bestStreak = Math.max(player.bestStreak, player.streak);
    // Mod selamat: tiada bonus kelajuan, hanya ketepatan dan rentetan dikira.
    earned = 1000 + (calm ? 0 : timeBonus(elapsedMs, limitSec)) + streakBonus(player.streak);
  } else { player.wrong++; player.streak = 0; }
  player.score += earned;
  player.answers.push({ questionId: q.id, index: player.index, topicId: q.topicId, answer, correct, timedOut: answer === null || !!late, responseMs: Math.round(elapsedMs), score: earned, altitude: correct ? altitudeStep(questions.length) : 0, at: now });
  player.index++;
  player.finished = player.index >= questions.length;
  player.feedback = { correct, timedOut: answer === null || !!late, correctText: q.correctText, explanation: q.explanation, score: earned, metres: correct ? Math.round(altitudeStep(questions.length)) : 0, streak: player.streak, finished: player.finished };
  return player.feedback;
}

export function accuracy(p) { const n = p.correct + p.wrong; return n ? Math.round(p.correct / n * 100) : 0; }

export function rankPlayers(players) {
  return [...players].sort((a, b) => b.score - a.score || b.correct - a.correct || a.name.localeCompare(b.name));
}

/** Analitik kelas: ketepatan keseluruhan, setiap topik dan setiap soalan. */
export function analytics(players, questions) {
  const answered = players.flatMap(p => p.answers);
  const pct = list => list.length ? Math.round(list.filter(a => a.correct).length / list.length * 100) : null;
  const topicIds = [...new Set(questions.map(q => q.topicId))];
  return {
    accuracy: pct(answered),
    topics: topicIds.map(id => ({ id, title: questions.find(q => q.topicId === id).topicTitle, accuracy: pct(answered.filter(a => a.topicId === id)) })),
    questions: questions.map((q, i) => {
      const list = answered.filter(a => a.index === i);
      return { n: i + 1, type: q.type, topicTitle: q.topicTitle, text: q.questionAr || (q.audio ? `🎧 Audio: ${q.correctText}` : q.questionMs) || q.correctText, correctText: q.correctText, answered: list.length, accuracy: pct(list), needsReview: list.length > 0 && pct(list) < 60 };
    }),
  };
}

/** Anugerah akhir: hanya diberi jika ada data yang bermakna. */
export function awards(players) {
  const done = players.filter(p => p.answers.length);
  if (!done.length) return [];
  const best = (fn, filter = () => true) => [...done].filter(filter).sort((a, b) => fn(b) - fn(a) || b.score - a.score)[0];
  const avgMs = p => { const c = p.answers.filter(a => a.correct); return c.length ? c.reduce((s, a) => s + a.responseMs, 0) / c.length : Infinity; };
  const out = [];
  const acc = best(accuracy); if (acc) out.push({ key: 'accurate', label: 'Paling tepat', name: acc.name, id: acc.id, value: `${accuracy(acc)}%` });
  const streak = best(p => p.bestStreak, p => p.bestStreak > 1); if (streak) out.push({ key: 'streak', label: 'Rentetan terbaik', name: streak.name, id: streak.id, value: `${streak.bestStreak} berturut` });
  const fast = [...done].filter(p => p.correct).sort((a, b) => avgMs(a) - avgMs(b))[0];
  if (fast) out.push({ key: 'fast', label: 'Pendaki pantas', name: fast.name, id: fast.id, value: `${(avgMs(fast) / 1000).toFixed(1)}s / jawapan betul` });
  return out;
}

export function stars(acc) { return acc >= 90 ? 3 : acc >= 70 ? 2 : 1; }
