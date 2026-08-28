// 학습 통계
import * as store from '../store.js';
import { PARTS } from '../seed-data.js';
import { escapeHtml, typeLabel, accuracyBarHtml, fmtTime } from '../ui.js';
import { backBar } from './study.js';

export function renderStats(root) {
  const today = store.getToday();
  const totals = store.getTotals();
  const streak = store.getStreak();
  const byPart = store.accuracyBy((q) => 'Part ' + q.part);
  const byType = store.accuracyBy((q) => q.questionType);
  const weakTypes = store.getWeakTypes(101); // 전부, 낮은 순
  const weakQuestions = store.getWeakQuestions().slice(0, 8);

  const typeRows = Object.entries(byType)
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => (a[1].rate ?? 101) - (b[1].rate ?? 101))
    .map(([t, v]) => accuracyBarHtml(typeLabel(t), v.rate, v.total)).join('') ||
    '<p class="desc">아직 기록이 없습니다.</p>';

  const partRows = Object.keys(PARTS)
    .map((n) => {
      const v = byPart['Part ' + n];
      return v && v.total ? accuracyBarHtml('Part ' + n, v.rate, v.total) : '';
    }).join('') || '<p class="desc">아직 기록이 없습니다.</p>';

  const weakKeyRows = weakTypes.slice(0, 5).map((w) => {
    const q = store.getQuestions({ type: w.type })[0];
    const key = q ? q.keyExpression.split('/')[0].trim() : w.type;
    return accuracyBarHtml(key.toUpperCase(), w.rate, w.total);
  }).join('');

  root.innerHTML = `
    ${backBar('학습 통계')}
    <div class="stat-cards four">
      <div class="stat-card"><div class="stat-num">${today.listened}</div><div class="stat-label">오늘 들은 질문</div></div>
      <div class="stat-card"><div class="stat-num">${totals.listened}</div><div class="stat-label">누적 질문</div></div>
      <div class="stat-card"><div class="stat-num">${streak}일</div><div class="stat-label">연속 학습</div></div>
      <div class="stat-card"><div class="stat-num">${fmtTime(totals.studySeconds)}</div><div class="stat-label">총 학습시간</div></div>
    </div>

    <h3 class="section-title">파트별 정답률</h3>
    <div class="card">${partRows}</div>

    <h3 class="section-title">질문 유형별 정답률</h3>
    <div class="card">${typeRows}</div>

    ${weakKeyRows ? `<h3 class="section-title">취약 의문사</h3><div class="card">${weakKeyRows}</div>
      <p class="desc">취약 유형은 운동 모드·퀴즈에서 자동으로 더 자주 출제됩니다.</p>` : ''}

    ${weakQuestions.length ? `<h3 class="section-title">자주 틀리는 질문</h3>
      <div class="q-list">${weakQuestions.map((q) => {
        const p = store.getProgress(q.id);
        return `<a class="q-item" href="#/study/q/${q.id}">
          <div class="q-item-en">${escapeHtml(q.questionEnglish)}</div>
          <div class="q-item-ko">오답 ${p.incorrectCount}회 · 정답 ${p.correctCount}회</div></a>`;
      }).join('')}</div>` : ''}`;
}
