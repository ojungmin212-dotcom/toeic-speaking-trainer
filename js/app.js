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

function route() {
  // 화면 전환 시 진행 중인 재생/세션 정리
  stopExercise();
  stopListening();
  stopQuiz();
  root.onclick = null;
  window.scrollTo(0, 0);

  const hash = location.hash || '#/';
  const parts = hash.slice(2).split('/').filter(Boolean); // '#/study/part/3' → ['study','part','3']

  if (parts.length === 0) return renderHome(root);

  switch (parts[0]) {
    case 'study':
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
