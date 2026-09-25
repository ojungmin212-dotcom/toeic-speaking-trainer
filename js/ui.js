// 공용 UI 헬퍼
import { QUESTION_TYPES, LEVELS, LEVEL_ORDER } from './seed-data.js';

// 레벨 선택 세그먼트 컨트롤 (IL | IM | IH | AL)
export function levelPickerHtml(current, { id = 'levelPicker', small = false, levels = LEVEL_ORDER } = {}) {
  return `<div class="seg ${small ? 'seg-sm' : ''}" id="${id}" role="tablist" aria-label="레벨 선택">${
    levels.map((lv) => `<button class="seg-btn ${lv === current ? 'on' : ''}" data-level="${lv}" role="tab" aria-selected="${lv === current}">${lv}</button>`).join('')
  }</div>`;
}

export function bindLevelPicker(root, id, onPick) {
  const el = root.querySelector('#' + id);
  if (!el) return;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    el.querySelectorAll('.seg-btn').forEach((x) => {
      const on = x === b;
      x.classList.toggle('on', on);
      x.setAttribute('aria-selected', String(on));
    });
    onPick(b.dataset.level);
  });
}

export function levelInfoHtml(level) {
  const L = LEVELS[level] || LEVELS.IL;
  return `<div class="level-info"><div class="level-name"><b>${level}</b> ${escapeHtml(L.full)} <span class="level-score">${escapeHtml(L.score)}</span></div><p>${escapeHtml(L.desc)}</p></div>`;
}

export function wordCount(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length;
}

// 라인 아이콘 (stroke: currentColor) — 이모지 대신 일관된 아이콘 시스템
const ICONS = {
  headphones: '<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="7" rx="1.6"/><rect x="17" y="13" width="4" height="7" rx="1.6"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>',
  quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 3c-.8.5-1 1-1 1.9"/><circle cx="12" cy="16.8" r=".6" fill="currentColor" stroke="none"/>',
  repeat: '<path d="M17 2.5 21 6l-4 3.5"/><path d="M21 6H8a5 5 0 0 0-5 5"/><path d="M7 21.5 3 18l4-3.5"/><path d="M3 18h13a5 5 0 0 0 5-5"/>',
  chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8.5 16v-5"/><path d="M13 16V7.5"/><path d="M17.5 16v-3"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h13M21 17h-1"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="19" cy="17" r="2"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
};

export function icon(name, size = 20) {
  const d = ICONS[name];
  if (!d) return '';
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function typeLabel(type) {
  return (QUESTION_TYPES[type] && QUESTION_TYPES[type].ko) || type;
}

export function typeBadge(type) {
  return `<span class="badge badge-${escapeHtml(type)}">${escapeHtml(typeLabel(type))}</span>`;
}

// 초보자 모드: 질문에서 핵심 표현을 강조 표시
export function highlightKey(questionEnglish, keyExpression, beginnerMode) {
  const safe = escapeHtml(questionEnglish);
  if (!beginnerMode || !keyExpression) return safe;
  // keyExpression의 첫 핵심 단어군만 매칭 (예: "When", "How often", "Have you ever")
  const first = keyExpression.split('/')[0].trim().split(',')[0].trim();
  const core = first.replace(/\s*~.*$/, '').trim();
  if (!core) return safe;
  const re = new RegExp('(' + core.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i');
  return safe.replace(re, '<mark class="key">$1</mark>');
}

export function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

export function fmtTime(seconds) {
  const m = Math.floor(seconds / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}시간 ${m % 60}분`;
  if (m > 0) return `${m}분`;
  return `${Math.round(seconds)}초`;
}

export function download(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function pickFile(accept) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const f = input.files[0];
      if (!f) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        // 엑셀 기본 저장(CP949/EUC-KR) 파일도 한글이 깨지지 않도록 인코딩 자동 감지
        const buf = reader.result;
        let text = new TextDecoder('utf-8').decode(buf);
        if (text.includes('�')) {
          try {
            const kr = new TextDecoder('euc-kr').decode(buf);
            if (!kr.includes('�')) text = kr;
          } catch { /* euc-kr 미지원 환경이면 utf-8 결과 사용 */ }
        }
        resolve(text.replace(/^﻿/, '')); // BOM 제거
      };
      reader.readAsArrayBuffer(f);
    };
    input.click();
  });
}

export function accuracyBarHtml(label, rate, total) {
  const pct = rate == null ? 0 : rate;
  const txt = rate == null ? '–' : rate + '%';
  return `
    <div class="acc-row">
      <div class="acc-label">${escapeHtml(label)}</div>
      <div class="acc-bar"><div class="acc-fill ${pct < 70 ? 'low' : pct < 85 ? 'mid' : 'high'}" style="width:${pct}%"></div></div>
      <div class="acc-val">${txt}<span class="acc-total">${total ? ` (${total})` : ''}</span></div>
    </div>`;
}
