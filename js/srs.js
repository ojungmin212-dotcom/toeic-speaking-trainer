// 간이 Spaced Repetition (Leitner 박스 0~5)
// 정답 → 박스 +1 (출제 간격 증가), 오답 → 박스 0 (즉시 재출제 대상)

const DAY = 24 * 60 * 60 * 1000;
export const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30];

export function applyAnswer(progress, correct, now = Date.now()) {
  const box = correct ? Math.min((progress.box || 0) + 1, 5) : 0;
  return {
    ...progress,
    box,
    correctCount: (progress.correctCount || 0) + (correct ? 1 : 0),
    incorrectCount: (progress.incorrectCount || 0) + (correct ? 0 : 1),
    lastStudiedAt: now,
    nextReviewAt: now + BOX_INTERVALS_DAYS[box] * DAY,
  };
}

export function isDue(progress, now = Date.now()) {
  if (!progress || !progress.lastStudiedAt) return true; // 한 번도 안 본 문제
  return (progress.nextReviewAt || 0) <= now;
}

// 출제 가중치: 복습 시기 지남 > 오답률 높음 > 취약 유형 > 오래 안 봄
export function weight(question, progress, weakTypeSet, now = Date.now()) {
  let w = 1;
  const p = progress || {};
  if (isDue(p, now)) w += 3;
  const total = (p.correctCount || 0) + (p.incorrectCount || 0);
  if (total > 0) {
    const errRate = (p.incorrectCount || 0) / total;
    w += errRate * 4;
    if (errRate <= 0.2 && total >= 3) w -= 0.7; // 여러 번 맞힌 문제는 빈도 감소
  } else {
    w += 1.5; // 미학습 문제 우선
  }
  if (weakTypeSet && weakTypeSet.has(question.questionType)) w += 2;
  if (p.lastStudiedAt && now - p.lastStudiedAt > 14 * DAY) w += 1.5;
  return Math.max(w, 0.2);
}

// 가중 랜덤으로 다음 문제 목록 생성 (중복 없이 count개)
export function pickWeighted(questions, getProgress, weakTypeSet, count) {
  const pool = questions.map((q) => ({ q, w: weight(q, getProgress(q.id), weakTypeSet) }));
  const picked = [];
  while (picked.length < count && pool.length > 0) {
    const sum = pool.reduce((s, item) => s + item.w, 0);
    let r = Math.random() * sum;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].w;
      if (r <= 0) { idx = i; break; }
    }
    picked.push(pool[idx].q);
    pool.splice(idx, 1);
  }
  return picked;
}

// 같은 세트 문항은 실제 시험처럼 문항 번호 순서(Q5→Q6→Q7)로 붙인다.
// 세트의 위치는 그 세트에서 가장 먼저 뽑힌 문항 자리 — 가중치로 정한 출제 순서를 세트 단위로 유지한다.
export function groupBySet(list) {
  const bySet = new Map();
  for (const q of list) {
    if (!q.setId) continue;
    if (!bySet.has(q.setId)) bySet.set(q.setId, []);
    bySet.get(q.setId).push(q);
  }
  const out = [];
  const done = new Set();
  for (const q of list) {
    if (!q.setId) { out.push(q); continue; }
    if (done.has(q.setId)) continue;
    done.add(q.setId);
    out.push(...bySet.get(q.setId).sort((a, b) => (a.qNo || 0) - (b.qNo || 0)));
  }
  return out;
}
