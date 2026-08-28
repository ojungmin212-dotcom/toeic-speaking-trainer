// 시드 질문에서 음성 생성 대상 텍스트 목록을 추출 → tools/texts.json
// 실행: node tools/export-texts.mjs
import { SEED_QUESTIONS } from '../js/seed-data.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const seen = new Set();
const items = [];

function add(id, suffix, text, lang) {
  const key = lang + '|' + text;
  if (!text || seen.has(key)) return;
  seen.add(key);
  items.push({ name: `${id}-${suffix}`, text, lang });
}

for (const q of SEED_QUESTIONS) {
  add(q.id, 'q', q.questionEnglish, 'en');
  add(q.id, 'a', q.answerEnglish, 'en');
  add(q.id, 'qk', q.questionKorean, 'ko');
  add(q.id, 'ak', q.answerKorean, 'ko');
}

fs.writeFileSync(path.join(here, 'texts.json'), JSON.stringify(items, null, 1), 'utf-8');
console.log(`texts.json: ${items.length} texts (en+ko)`);
