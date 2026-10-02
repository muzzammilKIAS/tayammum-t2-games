import sets from '../content/sets.json' with { type: 'json' };

export { sets };
export const SUMMIT_METRES = 3000;
export const TIMER_OPTIONS = [0, 15, 20, 30, 45, 60];

export function shuffle(array, rng = Math.random) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Set guru: soalan tetap yang dibina khusus untuk satu pelajaran (Tayammum, Tingkatan 2). */
export const findSet = id => sets.find(s => s.id === id) || null;
export function questionsForSet(id, rng = Math.random) {
  const set = findSet(id);
  if (!set) throw new Error('Set soalan tidak ditemui.');
  return set.questions.map((raw, i) => {
    const base = { id: `${set.id}-${i}#${i}`, concept: `${set.id}-${i}`, setId: set.id, level: 0, type: raw.type, difficulty: 'medium',
      prompt: raw.prompt, topicId: raw.topic, topicTitle: raw.topicTitle, explanation: raw.explanation };
    for (const k of ['questionMs', 'image', 'imageAlt']) if (raw[k]) base[k] = raw[k];
    if (raw.type === 'arrange') {
      let tokens = shuffle(raw.sequence, rng);
      for (let n = 0; tokens.every((t, j) => t === raw.sequence[j]) && n < 5; n++) tokens = shuffle(raw.sequence, rng);
      return { ...base, tokens, answer: raw.sequence, correctText: raw.sequence.join(' ') };
    }
    const correct = raw.options[raw.answer];
    const options = shuffle(raw.options, rng);
    return { ...base, options, answer: options.indexOf(correct), correctText: correct };
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
      return { n: i + 1, type: q.type, topicTitle: q.topicTitle, text: q.questionMs || q.correctText, correctText: q.correctText, answered: list.length, accuracy: pct(list), needsReview: list.length > 0 && pct(list) < 60 };
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
