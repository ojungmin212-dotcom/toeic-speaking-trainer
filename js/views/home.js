// 메인 화면 — 오늘의 학습 요약 + 학습 메뉴 목록
import * as store from '../store.js';
import { icon, fmtTime, escapeHtml } from '../ui.js';

export function renderHome(root) {
  const today = store.getToday();
  const totals = store.getTotals();
  const answered = today.correct + today.incorrect;
  const rate = answered ? Math.round((today.correct / answered) * 100) : null;
  const due = store.getDueQuestions().length;
  const weak = store.getWeakQuestions().length;
  const streak = store.getStreak();

  const now = new Date();
  const dateLabel = `${now.getMonth() + 1}월 ${now.getDate()}일 ${['일', '월', '화', '수', '목', '금', '토'][now.getDay()]}요일`;

  const summary = today.listened
    ? `오늘 ${today.listened}회 들었습니다.${rate != null ? ` 정답률은 ${rate}%입니다.` : ''}${weak ? ` 취약 질문 ${weak}개가 복습을 기다립니다.` : ''}`
    : '아직 오늘 학습 기록이 없습니다. 듣기 모드로 시작해 보세요.';

  root.innerHTML = `
    <section class="hero card">
      <div class="hero-top">
        <span class="hero-title">오늘의 학습</span>
        <span class="hero-date">${dateLabel}</span>
      </div>
      <div class="hero-main">
        <span class="hero-num">${today.listened}<span class="hero-unit">회</span></span>
        <div class="hero-side">
          <div class="hero-side-big">${rate == null ? '—' : rate + '%'}</div>
          <div class="hero-side-label">오늘 정답률</div>
        </div>
      </div>
      <p class="hero-summary">${summary}</p>
      <div class="stat-row">
        <a class="stat stat-link" href="#/study"><span class="stat-label">목표 레벨 ›</span><span class="stat-val">${escapeHtml(store.getSettings().targetLevel || 'IL')}</span></a>
        <div class="stat"><span class="stat-label">연속 학습</span><span class="stat-val">${streak}일</span></div>
        <div class="stat"><span class="stat-label">복습 예정</span><span class="stat-val">${due}개</span></div>
        <div class="stat"><span class="stat-label">취약 질문</span><span class="stat-val">${weak}개</span></div>
        <div class="stat"><span class="stat-label">누적 듣기</span><span class="stat-val">${totals.listened}회</span></div>
        <div class="stat"><span class="stat-label">누적 시간</span><span class="stat-val">${fmtTime(totals.studySeconds)}</span></div>
      </div>
    </section>

    <nav class="menu">
      <a class="menu-row primary" href="#/exercise">
        ${icon('headphones')}<span class="menu-body"><b>듣기 모드</b><small>이어폰만으로 자동 반복 학습</small></span>${icon('chevron', 16)}
      </a>
      <a class="menu-row" href="#/listening">
        ${icon('target')}<span class="menu-body"><b>실전 듣기</b><small>듣고 의미 판단 후 정답 확인</small></span>${icon('chevron', 16)}
      </a>
      <a class="menu-row" href="#/study">
        ${icon('book')}<span class="menu-body"><b>파트·레벨별 학습</b><small>IL · IM · IH · AL 모범답변 비교</small></span>${icon('chevron', 16)}
      </a>
      <a class="menu-row" href="#/quiz">
        ${icon('quiz')}<span class="menu-body"><b>질문 유형 퀴즈</b><small>무엇을 묻는 질문인지 맞히기</small></span>${icon('chevron', 16)}
      </a>
      <a class="menu-row" href="#/review">
        ${icon('repeat')}<span class="menu-body"><b>취약 질문 복습</b><small>틀린 문제 ${weak}개 · 복습 예정 ${due}개</small></span>${icon('chevron', 16)}
      </a>
    </nav>

    <div class="home-links">
      <a href="#/stats">${icon('chart', 16)} 학습 통계</a>
      <a href="#/admin">${icon('gear', 16)} 질문 관리</a>
      <a href="#/settings">${icon('sliders', 16)} 설정</a>
    </div>`;
}
