// 메인 화면
import * as store from '../store.js';

export function renderHome(root) {
  const today = store.getToday();
  const answered = today.correct + today.incorrect;
  const rate = answered ? Math.round((today.correct / answered) * 100) : null;
  const due = store.getDueQuestions().length;
  const weak = store.getWeakQuestions().length;

  root.innerHTML = `
    <div class="home">
      <h1 class="app-title">TOEIC SPEAKING<br>TRAINER</h1>
      <p class="app-sub">질문 듣기 훈련 — 듣자마자 의도 파악</p>

      <nav class="menu">
        <a class="menu-btn primary" href="#/exercise">🎧 듣기 모드<span class="menu-desc">이어폰만으로 자동 반복 학습</span></a>
        <a class="menu-btn" href="#/listening">🎯 실전 듣기<span class="menu-desc">듣고 의미 판단 → 정답 확인</span></a>
        <a class="menu-btn" href="#/study">📚 파트별 학습<span class="menu-desc">질문·해석·모범답변 보기</span></a>
        <a class="menu-btn" href="#/quiz">❓ 질문 유형 퀴즈<span class="menu-desc">무엇을 묻는 질문인지 맞히기</span></a>
        <a class="menu-btn" href="#/review">🔁 취약 질문 복습<span class="menu-desc">틀린 문제 ${weak}개 · 복습 예정 ${due}개</span></a>
      </nav>

      <div class="stat-cards">
        <div class="stat-card"><div class="stat-num">${today.listened}</div><div class="stat-label">오늘 듣기 횟수</div></div>
        <div class="stat-card"><div class="stat-num">${rate == null ? '–' : rate + '%'}</div><div class="stat-label">오늘 정답률</div></div>
      </div>

      <div class="home-links">
        <a href="#/stats">📊 학습 통계</a>
        <a href="#/admin">⚙️ 질문 관리</a>
        <a href="#/settings">🔧 설정</a>
      </div>
    </div>`;
}
