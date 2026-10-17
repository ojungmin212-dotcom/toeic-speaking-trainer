// 화면 테마 — 다크(기본) / 라이트 / 기기 설정 따름
// 첫 화면이 깜박이지 않도록 index.html의 <head> 인라인 스크립트가 같은 규칙으로 먼저 data-theme을 정하고,
// 여기서는 앱이 뜬 뒤의 전환(설정·상단 버튼)과 기기 설정 변경을 처리한다.
import * as store from './store.js';

const BAR = { dark: '#0e1116', light: '#1e2535' }; // 휴대폰 상태 표시줄 색 (상단 바와 맞춤)

export function effectiveTheme(pref) {
  if (pref === 'light') return 'light';
  if (pref === 'auto') return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return 'dark';
}

export function applyTheme(pref = store.getSettings().theme) {
  const t = effectiveTheme(pref);
  document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = BAR[t];
  // 버튼에는 '누르면 바뀔 테마'를 보여 준다
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = t === 'dark' ? '☀ 라이트로' : '☾ 다크로';
  document.querySelectorAll('[data-theme-toggle]').forEach((el) => { el.textContent = t === 'dark' ? '☀ 라이트 모드로 바꾸기' : '☾ 다크 모드로 바꾸기'; });
}

export function toggleTheme() {
  const next = effectiveTheme(store.getSettings().theme) === 'dark' ? 'light' : 'dark';
  store.saveSettings({ theme: next });
  applyTheme(next);
}

export function initTheme() {
  applyTheme();
  // '기기 설정 따름'일 때 OS의 다크/라이트가 바뀌면 같이 바꾼다
  try {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (store.getSettings().theme === 'auto') applyTheme();
    });
  } catch {}
  document.addEventListener('click', (e) => {
    const el = e.target.closest('#themeBtn, [data-theme-toggle]');
    if (!el) return;
    e.preventDefault();
    toggleTheme();
  });
}
