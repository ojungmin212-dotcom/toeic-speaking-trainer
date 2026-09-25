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

function addQuestion(q) {
  const id = String(q.id || '').replace(/[^A-Za-z0-9_-]/g, '') || 'x' + items.length;
  add(id, 'q', q.questionEnglish, 'en');
  add(id, 'a', q.answerEnglish, 'en');
  add(id, 'qk', q.questionKorean, 'ko');
  add(id, 'ak', q.answerKorean, 'ko');
  // 레벨별 모범답변 (IM/IH/AL)
  for (const [lv, v] of Object.entries(q.levelAnswers || {})) {
    if (!v || !v.en) continue;
    add(id, 'a' + lv, v.en, 'en');
    add(id, 'ak' + lv, v.ko, 'ko');
  }
}

for (const q of SEED_QUESTIONS) addQuestion(q);

// 사용자가 직접 추가한 질문도 음성 생성: 앱 설정 → JSON 백업으로 받은 파일을
// 프로젝트 루트에 questions.json 으로 저장해 두면 함께 생성된다.
const userFile = path.join(here, '..', 'questions.json');
if (fs.existsSync(userFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
    const list = Array.isArray(data) ? data : (data.questions || []);
    let extra = 0;
    for (const q of list) {
      if (q && q.questionEnglish) { addQuestion(q); extra++; }
    }
    console.log(`questions.json: 사용자 질문 ${extra}개 포함`);
  } catch (e) {
    console.warn('questions.json 파싱 실패 — 건너뜀:', e.message);
  }
}

fs.writeFileSync(path.join(here, 'texts.json'), JSON.stringify(items, null, 1), 'utf-8');
console.log(`texts.json: ${items.length} texts (en+ko)`);
