// 앱 초기화 + 해시 라우터
import * as store from './store.js';
import { renderHome } from './views/home.js';
import { renderStudyIndex, renderStudyList, renderStudyDetail } from './views/study.js';
import { renderExerciseSetup, renderExercisePlay, stopExercise } from './views/exercise.js';
import { renderListening, stopListening } from './views/listening.js';
import { renderQuiz, stopQuiz } from './views/quiz.js';
import { renderStats } from './views/stats.js';
import { renderAdmin } from './views/admin.js';
import { renderSettings } from './views/settings.js';

store.init();

const root = document.getElementById('app');
const drawer = document.getElementById('drawer');
const menuBtn = document.getElementById('menuBtn');

function setDrawer(open) {
  if (!drawer) return;
  drawer.classList.toggle('hidden', !open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? '✕' : '☰';
}
if (menuBtn) menuBtn.addEventListener('click', () => setDrawer(drawer.classList.contains('hidden')));

// 상단 메뉴에서 현재 화면 표시
function markNav(section) {
  document.querySelectorAll('[data-route]').forEach((a) => a.classList.toggle('on', a.dataset.route === section));
}

function route() {
  // 화면 전환 시 진행 중인 재생/세션 정리
  stopExercise();
  stopListening();
  stopQuiz();
  root.onclick = null;
  setDrawer(false);
  window.scrollTo(0, 0);

  const hash = location.hash || '#/';
  const parts = hash.slice(2).split('/').filter(Boolean); // '#/study/part/3' → ['study','part','3']
  markNav(parts[0] || 'home');
  // 질문 상세의 하단 고정 이동 바가 사이트 하단을 가리지 않도록
  document.body.classList.toggle('has-bottom-nav', parts[0] === 'study' && parts.includes('q'));

  if (parts.length === 0) return renderHome(root);

  switch (parts[0]) {
    case 'study':
      // 목록 경유 상세: #/study/part/5/q/seed-081 · #/study/type/time/q/seed-001 (이전/다음 이동 기준 목록)
      if (parts[1] === 'part' && parts[3] === 'q') return renderStudyDetail(root, parts[4], { part: Number(parts[2]) });
      if (parts[1] === 'type' && parts[3] === 'q') return renderStudyDetail(root, parts[4], { type: parts[2] });
      if (parts[1] === 'part') return renderStudyList(root, { part: Number(parts[2]) });
      if (parts[1] === 'type') return renderStudyList(root, { type: parts[2] });
      if (parts[1] === 'q') return renderStudyDetail(root, parts[2]);
      return renderStudyIndex(root);
    case 'exercise':
      if (parts[1] === 'play') return renderExercisePlay(root, parts[2] || 'all');
      return renderExerciseSetup(root);
    case 'listening': return renderListening(root, { mode: 'all' });
    case 'review': return renderListening(root, { mode: 'review' });
    case 'quiz': return renderQuiz(root);
    case 'stats': return renderStats(root);
    case 'admin': return renderAdmin(root);
    case 'settings': return renderSettings(root);
    default: return renderHome(root);
  }
}

window.addEventListener('hashchange', route);
route();

// PWA 서비스 워커 (http/https에서만)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
