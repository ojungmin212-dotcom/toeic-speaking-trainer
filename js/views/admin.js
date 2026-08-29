// 질문 관리 — CRUD, 미리듣기, CSV/JSON Import/Export, AI 일괄 생성(검토→승인)
import * as store from '../store.js';
import * as tts from '../tts.js';
import { generateQuestions } from '../llm.js';
import { PARTS, QUESTION_TYPES } from '../seed-data.js';
import { escapeHtml, typeBadge, typeLabel, toast, download, pickFile } from '../ui.js';
import { backBar } from './study.js';

export function renderAdmin(root, editId = null) {
  const pending = store.getAllQuestions().filter((q) => q.status === 'pending');
  const all = store.getAllQuestions().filter((q) => q.status !== 'pending');
  const editing = editId ? store.getQuestion(editId) : null;

  root.innerHTML = `
    ${backBar('질문 관리')}

    <h3 class="section-title">${editing ? '질문 수정' : '질문 추가'}</h3>
    <div class="card">
      <form id="qForm" class="admin-form">
        <div class="form-row2">
          <label>파트
            <select name="part">${Object.keys(PARTS).map((n) =>
              `<option value="${n}" ${editing && editing.part == n ? 'selected' : ''}>Part ${n}</option>`).join('')}</select>
          </label>
          <label>유형
            <select name="questionType">${Object.entries(QUESTION_TYPES).map(([k, t]) =>
              `<option value="${k}" ${editing && editing.questionType === k ? 'selected' : ''}>${t.ko}</option>`).join('')}</select>
          </label>
          <label>난이도
            <select name="difficulty">${[1, 2, 3].map((d) =>
              `<option value="${d}" ${editing && editing.difficulty === d ? 'selected' : ''}>${'★'.repeat(d)}</option>`).join('')}</select>
          </label>
        </div>
        <label>핵심 표현 (예: How often)
          <input name="keyExpression" value="${editing ? escapeHtml(editing.keyExpression) : ''}"></label>
        <label>영어 질문 *
          <input name="questionEnglish" required value="${editing ? escapeHtml(editing.questionEnglish) : ''}"></label>
        <label>질문 한국어 해석 *
          <input name="questionKorean" required value="${editing ? escapeHtml(editing.questionKorean) : ''}"></label>
        <label>영어 모범답변
          <input name="answerEnglish" value="${editing ? escapeHtml(editing.answerEnglish) : ''}"></label>
        <label>답변 한국어 해석
          <input name="answerKorean" value="${editing ? escapeHtml(editing.answerKorean) : ''}"></label>
        <div class="btn-row">
          <button type="submit" class="sub-btn primary-btn">${editing ? '수정 저장' : '추가'}</button>
          <button type="button" class="sub-btn" id="previewTts">🔊 미리듣기</button>
          ${editing ? '<button type="button" class="sub-btn" id="cancelEdit">취소</button>' : ''}
        </div>
      </form>
    </div>

    <h3 class="section-title">AI 질문 일괄 생성</h3>
    <div class="card">
      <div class="form-row2">
        <label>파트 <select id="genPart">${Object.keys(PARTS).map((n) => `<option value="${n}">Part ${n}</option>`).join('')}</select></label>
        <label>유형 <select id="genType">${Object.entries(QUESTION_TYPES).map(([k, t]) => `<option value="${k}">${t.ko}</option>`).join('')}</select></label>
        <label>개수 <select id="genCount">${[5, 10, 20, 30].map((c) => `<option value="${c}" ${c === 10 ? 'selected' : ''}>${c}개</option>`).join('')}</select></label>
      </div>
      <button class="sub-btn primary-btn" id="genBtn">생성하기</button>
      <p class="desc small" id="genStatus">생성된 질문은 아래 '검토 대기'에서 승인해야 학습에 나옵니다. (.env에 LLM 키 필요)</p>
    </div>

    ${pending.length ? `
    <h3 class="section-title">검토 대기 (${pending.length})</h3>
    <div class="q-list">${pending.map((q) => `
      <div class="q-item pending" data-id="${escapeHtml(q.id)}">
        <div class="q-item-top">${typeBadge(q.questionType)} <span class="badge badge-part">Part ${q.part}</span></div>
        <div class="q-item-en">${escapeHtml(q.questionEnglish)}</div>
        <div class="q-item-ko">${escapeHtml(q.questionKorean)}</div>
        <div class="q-item-ko">답: ${escapeHtml(q.answerEnglish)} — ${escapeHtml(q.answerKorean)}</div>
        <div class="btn-row">
          <button class="sub-btn small-btn approve" data-id="${escapeHtml(q.id)}">✅ 승인</button>
          <button class="sub-btn small-btn listen" data-id="${escapeHtml(q.id)}">🔊 듣기</button>
          <button class="sub-btn small-btn danger reject" data-id="${escapeHtml(q.id)}">🗑 거부</button>
        </div>
      </div>`).join('')}</div>` : ''}

    <h3 class="section-title">데이터 (${all.length}문항)</h3>
    <div class="card">
      <div class="btn-row">
        <button class="sub-btn" id="expJson">JSON 내보내기</button>
        <button class="sub-btn" id="impJson">JSON 가져오기</button>
        <button class="sub-btn" id="expCsv">CSV 내보내기</button>
        <button class="sub-btn" id="impCsv">CSV 가져오기</button>
      </div>
    </div>

    <h3 class="section-title">전체 질문</h3>
    <div class="q-list">${all.map((q) => `
      <div class="q-item" data-id="${escapeHtml(q.id)}">
        <div class="q-item-top">${typeBadge(q.questionType)} <span class="badge badge-part">Part ${q.part}</span>
          <span class="diff">${'★'.repeat(q.difficulty)}</span></div>
        <div class="q-item-en">${escapeHtml(q.questionEnglish)}</div>
        <div class="q-item-ko">${escapeHtml(q.questionKorean)}</div>
        <div class="btn-row">
          <button class="sub-btn small-btn edit" data-id="${escapeHtml(q.id)}">✏️ 수정</button>
          <button class="sub-btn small-btn listen" data-id="${escapeHtml(q.id)}">🔊 듣기</button>
          <button class="sub-btn small-btn danger del" data-id="${escapeHtml(q.id)}">🗑 삭제</button>
        </div>
      </div>`).join('')}</div>`;

  const $ = (sel) => root.querySelector(sel);

  // ── 폼 제출 ──
  $('#qForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    if (editing) {
      store.updateQuestion(editing.id, { ...data, part: Number(data.part), difficulty: Number(data.difficulty) });
      toast('수정했습니다');
      location.hash = '#/admin';
    } else {
      store.addQuestion(data);
      toast('추가했습니다');
    }
    renderAdmin(root);
  });

  $('#previewTts').addEventListener('click', () => {
    const en = $('#qForm').elements.questionEnglish.value.trim();
    if (en) { tts.cancel(); tts.speak(en, 'en-US'); }
  });
  if (editing) $('#cancelEdit').addEventListener('click', () => { location.hash = '#/admin'; renderAdmin(root); });

  // ── AI 생성 ──
  $('#genBtn').addEventListener('click', async () => {
    const btn = $('#genBtn'), status = $('#genStatus');
    btn.disabled = true;
    status.textContent = '생성 중… (수십 초 걸릴 수 있습니다)';
    try {
      const items = await generateQuestions({
        part: Number($('#genPart').value),
        type: $('#genType').value,
        count: Number($('#genCount').value),
      });
      items.forEach((item) => store.addQuestion(item));
      toast(items.length + '개 생성 — 검토 대기에 추가됨');
      renderAdmin(root);
    } catch (e) {
      status.textContent = '⚠️ ' + e.message;
      btn.disabled = false;
    }
  });

  // ── 목록 버튼 (승인/거부/수정/삭제/듣기) ──
  // onclick 할당으로 중복 등록을 방지 (라우터가 화면 전환 시 null로 초기화)
  root.onclick = (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('approve')) {
      store.updateQuestion(id, { status: 'approved' });
      toast('승인했습니다'); renderAdmin(root);
    } else if (btn.classList.contains('reject')) {
      store.deleteQuestion(id); toast('거부(삭제)했습니다'); renderAdmin(root);
    } else if (btn.classList.contains('edit')) {
      renderAdmin(root, id);
      window.scrollTo(0, 0);
    } else if (btn.classList.contains('del')) {
      if (confirm('이 질문을 삭제할까요?')) { store.deleteQuestion(id); toast('삭제했습니다'); renderAdmin(root); }
    } else if (btn.classList.contains('listen')) {
      const q = store.getQuestion(id);
      if (q) { tts.cancel(); tts.speak(q.questionEnglish, 'en-US'); }
    }
  };

  // ── Import / Export ──
  $('#expJson').addEventListener('click', () => download('questions.json', store.exportJSON(), 'application/json'));
  $('#expCsv').addEventListener('click', () => download('questions.csv', '﻿' + store.exportCSV(), 'text/csv'));
  $('#impJson').addEventListener('click', async () => {
    const text = await pickFile('.json');
    if (!text) return;
    try { toast(store.importJSON(text) + '개 가져왔습니다'); renderAdmin(root); }
    catch (e) { toast('실패: ' + e.message); }
  });
  $('#impCsv').addEventListener('click', async () => {
    const text = await pickFile('.csv');
    if (!text) return;
    try { toast(store.importCSV(text) + '개 가져왔습니다'); renderAdmin(root); }
    catch (e) { toast('실패: ' + e.message); }
  });
}
