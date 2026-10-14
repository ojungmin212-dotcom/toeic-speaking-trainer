// 공용 UI 헬퍼
import { QUESTION_TYPES, LEVELS, LEVEL_ORDER, TEST_TIMING, REPEATED_QNO } from './seed-data.js';

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
  const lv = LEVELS[level] ? level : 'IL';
  const L = LEVELS[lv];
  return `<div class="level-info"><div class="level-name"><b>${lv}</b> ${escapeHtml(L.full)} <span class="level-score">${escapeHtml(L.score)}</span></div><p>${escapeHtml(L.desc)}</p>${L.guide ? `<p class="level-guide">${escapeHtml(L.guide)}</p>` : ''}</div>`;
}

// 원어민 속도(약 150단어/분) 기준 답변 소요 시간 (초)
export function speakSeconds(text) {
  return Math.max(1, Math.round(wordCount(text) / 150 * 60));
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

// 문항의 유형 배지 — 두 가지를 묶어 묻는 질문은 "시간 + 장소"처럼 둘 다
export function typeBadges(q) {
  return typeBadge(q.questionType) + (q.questionType2 ? '<span class="badge-plus">+</span>' + typeBadge(q.questionType2) : '');
}
export function typesLabel(q) {
  return typeLabel(q.questionType) + (q.questionType2 ? ' + ' + typeLabel(q.questionType2) : '');
}

// 실제 시험 문항 번호 배지 (Q5 · 응답 15초)
export function qNoBadge(q, { timing = true } = {}) {
  if (!q.qNo) return '';
  const t = TEST_TIMING[q.qNo];
  const time = timing && t
    ? `<span class="q-timing">${t.prep > 3 ? `준비 ${t.prep}초 · ` : ''}응답 ${t.response}초${REPEATED_QNO.has(q.qNo) ? ' · 두 번 들려줌' : ''}</span>`
    : '';
  return `<span class="badge badge-qno">Q${q.qNo}</span>${time}`;
}

// Part 1 끊어 읽기 가이드: " / " → 쉬는 표시, **단어** → 강세(굵게)
export function guideHtml(guide) {
  return escapeHtml(guide)
    .split(' / ').join(' <span class="pause">/</span> ')
    .replace(/\*\*(.+?)\*\*/g, '<b class="stress">$1</b>');
}

// Part 2 사진 + 작가 표기 (Unsplash 라이선스)
export function photoHtml(q, { credit = true } = {}) {
  if (!q.image) return '';
  const c = q.credit;
  return `<figure class="photo"><img src="${escapeHtml(q.image)}" alt="${escapeHtml(q.topic || '묘사할 사진')}" loading="lazy">${
    credit && c ? `<figcaption>Photo: <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener">${escapeHtml(c.name)}</a> / Unsplash</figcaption>` : ''
  }</figure>`;
}

// Part 4 일정표 (실제 시험 화면처럼 표로)
export function scheduleHtml(sch) {
  if (!sch) return '';
  return `
    <div class="schedule">
      <div class="sch-title">${escapeHtml(sch.title)}</div>
      ${(sch.info || []).map((x) => `<div class="sch-info">${escapeHtml(x)}</div>`).join('')}
      <div class="sch-scroll"><table class="sch-table">
        <thead><tr>${sch.cols.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
        <tbody>${sch.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      ${sch.note ? `<div class="sch-note">${escapeHtml(sch.note)}</div>` : ''}
    </div>`;
}

// 초보자 모드: 질문에서 핵심 표현을 강조 표시
export function highlightKey(questionEnglish, keyExpression, beginnerMode) {
  const safe = escapeHtml(questionEnglish);
  if (!beginnerMode || !keyExpression) return safe;
  // keyExpression을 '/'로 나눈 각 표현의 첫 등장을 강조 (예: "How often / who" → 두 군데)
  const cores = keyExpression.split('/')
    .map((x) => x.trim().split(',')[0].trim().replace(/\s*~.*$/, '').trim())
    .filter(Boolean)
    .map((c) => escapeHtml(c));
  if (!cores.length) return safe;
  // 긴 표현을 먼저 시도해 짧은 표현이 긴 표현의 일부를 가로채지 않게 한다
  const sorted = [...new Set(cores)].sort((a, b) => b.length - a.length);
  // 단어 경계로 감싸 "who"가 "whole" 안에서 강조되지 않게 한다
  const re = new RegExp('\\b(' + sorted.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'gi');
  const used = new Set();
  return safe.replace(re, (m) => {
    const k = m.toLowerCase();
    if (used.has(k)) return m;
    used.add(k);
    return '<mark class="key">' + m + '</mark>';
  });
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
