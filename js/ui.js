// 공용 UI 헬퍼
import { QUESTION_TYPES } from './seed-data.js';

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
