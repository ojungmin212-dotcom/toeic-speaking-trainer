// '초보 추천' 답변 선택 — 문항마다 직장인 답변과 대학생 답변 중 초보가 발음하기 쉬운 쪽을 고른다.
// 실행: node tools/pick-easy.mjs  →  js/easy-picks.js 생성 (대학생 답변이 있는 문항만; 나머지는 직장인=공통 답변)
// 문장을 새로 쓰지 않고 이미 있는 답변 중에서만 고르므로 음성·검사에 영향이 없다.
//
// 발음 난이도 점수 (단어 100개당 감점 — 낮을수록 쉽다)
//  · 긴 단어: 3음절 +1, 4음절 이상 +2
//  · 한국인이 어려워하는 소리: th(내용어) +1, f·v·z +0.5, r과 l이 한 단어에 같이 +0.5
//  · 자음 3개 이상 연속(strengths, through …) +1
//  · 긴 문장: 한 문장이 14단어를 넘으면 넘는 단어마다 +0.3 (숨이 차서 끊어 읽기 어렵다)
// 레벨 가중치: IL 0.4 · IM 0.3 · IH 0.2 · AL 0.1 (초보가 주로 쓰는 낮은 레벨을 더 반영)
// 문항 안에서 네 레벨은 같은 이야기여야 하므로 레벨별로 섞지 않고 문항 단위로 한쪽을 고른다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_QUESTIONS } from '../js/seed-data.js';
import { STUDENT_ANSWERS } from '../js/student-answers.js';

const FUNCTION_TH = new Set(['the', 'this', 'that', 'these', 'those', 'then', 'than', 'there', 'their', 'they', 'them', 'though', 'with', 'other', 'another', 'either', 'neither', 'rather', 'whether', 'together']);
const WEIGHTS = { IL: 0.4, IM: 0.3, IH: 0.2, AL: 0.1 };

export function syllables(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = w.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

export function difficulty(text) {
  const sentences = String(text).split(/(?<=[.?!])\s+/).filter(Boolean);
  let penalty = 0;
  let count = 0;
  for (const s of sentences) {
    const words = s.split(/\s+/).filter(Boolean);
    count += words.length;
    penalty += Math.max(0, words.length - 14) * 0.3;
    for (const raw of words) {
      const w = raw.toLowerCase().replace(/[^a-z']/g, '');
      if (!w) continue;
      const syl = syllables(w);
      if (syl >= 4) penalty += 2; else if (syl === 3) penalty += 1;
      if (w.includes('th') && !FUNCTION_TH.has(w)) penalty += 1;
      if (/[fvz]/.test(w)) penalty += 0.5;
      if (w.includes('r') && w.includes('l')) penalty += 0.5;
      if (/[bcdfghjklmnpqrstvwxz]{3,}/.test(w)) penalty += 1;
    }
  }
  return count ? (penalty / count) * 100 : 0;
}

function score(answers) {
  return Object.entries(WEIGHTS).reduce((sum, [lv, wt]) => sum + wt * difficulty(answers[lv]), 0);
}

// 직접 실행할 때만 파일을 만든다 (import해서 difficulty만 쓸 수도 있게)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const picks = {};
  const stats = { student: 0, worker: 0, tie: 0 };
  const gains = [];
  for (const q of SEED_QUESTIONS) {
    const st = STUDENT_ANSWERS[q.id];
    if (!st) continue;
    const worker = { IL: q.answerEnglish, IM: q.levelAnswers.IM.en, IH: q.levelAnswers.IH.en, AL: q.levelAnswers.AL.en };
    const student = { IL: st.IL[0], IM: st.IM[0], IH: st.IH[0], AL: st.AL[0] };
    const ws = score(worker);
    const ss = score(student);
    // 차이가 거의 없으면(0.5 미만) 기본인 직장인 답변을 유지한다
    const pick = ss + 0.5 < ws ? 'student' : 'worker';
    if (Math.abs(ss - ws) < 0.5) stats.tie++;
    stats[pick]++;
    gains.push(Math.abs(ws - ss));
    picks[q.id] = pick;
  }
  const lines = Object.entries(picks).map(([id, p]) => `  ${JSON.stringify(id)}: ${JSON.stringify(p)},`);
  const out = `// '초보 추천' 화자의 답변 선택 — tools/pick-easy.mjs가 만든다 (직접 고치지 말고 도구를 다시 실행).
// 문항마다 직장인(worker)·대학생(student) 답변 중 발음하기 쉬운 쪽. 목록에 없는 문항은 공통 답변(직장인)을 쓴다.
export const EASY_PICKS = {
${lines.join('\n')}
};
`;
  fs.writeFileSync(new URL('../js/easy-picks.js', import.meta.url), out);
  const avg = gains.reduce((a, b) => a + b, 0) / gains.length;
  console.log(`선택 ${Object.keys(picks).length}문항: 대학생 ${stats.student} · 직장인 ${stats.worker} (점수 차 0.5 미만 ${stats.tie}개는 직장인 유지), 평균 점수 차 ${avg.toFixed(2)}`);
}
