// LLM Provider Adapter — AI 질문 일괄 생성
// 키는 .env에만 있고 server.js가 /api/llm에서 Provider(anthropic/openai)를 호출한다.
// 생성 결과는 status='pending'으로 저장되어 관리 화면에서 검토·승인해야 학습에 노출된다.

import { QUESTION_TYPES } from './seed-data.js';

function buildPrompt(part, type, count) {
  const typeKo = QUESTION_TYPES[type] ? QUESTION_TYPES[type].ko : type;
  return `You are creating practice questions for a TOEIC Speaking listening trainer for Korean beginners.
Create ${count} NEW practice questions. Do NOT copy real ETS test questions — write original questions that only follow the general style and difficulty of the exam.

Requirements:
- TOEIC Speaking Part: ${part} (3 = short daily-life questions, 4 = schedule/information confirmation questions, 5 = opinion/preference questions)
- Question type: ${type} (${typeKo})
- Question must be SHORT and EASY (beginner level, under 14 words).
- Answer must be a short, easy model answer a beginner can say (under 12 words).
- Korean translations must be natural polite Korean (합니다체).
- keyExpression = the core question phrase a learner should catch (e.g. "How often", "Where", "Have you ever").

Respond with ONLY a JSON array, no markdown, in this exact shape:
[{"questionEnglish":"...","questionKorean":"...","answerEnglish":"...","answerKorean":"...","keyExpression":"...","difficulty":1}]`;
}

export async function generateQuestions({ part, type, count = 10 }) {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: buildPrompt(part, type, count) }),
  });
  if (!res.ok) {
    if (res.status === 404 || res.status === 501) {
      throw new Error('AI 생성은 PC에서 시작.bat으로 실행할 때만 사용할 수 있습니다 (.env에 LLM 키 필요). 배포된 웹 주소에서는 동작하지 않습니다.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'LLM 서버 오류: ' + res.status);
  }
  const data = await res.json();
  let text = (data.text || '').trim();
  // 코드펜스 제거 후 JSON 배열 추출
  text = text.replace(/^```(json)?/m, '').replace(/```$/m, '').trim();
  const start = text.indexOf('['), end = text.lastIndexOf(']');
  if (start < 0 || end < 0) throw new Error('LLM 응답에서 JSON 배열을 찾지 못했습니다.');
  const arr = JSON.parse(text.slice(start, end + 1));
  return arr
    .filter((x) => x && x.questionEnglish && x.questionKorean)
    .map((x) => ({
      part, questionType: type,
      difficulty: Number(x.difficulty) || 1,
      keyExpression: x.keyExpression || '',
      questionEnglish: String(x.questionEnglish),
      questionKorean: String(x.questionKorean),
      answerEnglish: String(x.answerEnglish || ''),
      answerKorean: String(x.answerKorean || ''),
      status: 'pending',
    }));
}
