// 질문 관리 — CRUD, 미리듣기, CSV/JSON Import/Export, AI 생성(실제 시험 형식 세트·4레벨 답변 → 자동 검사 → 검토·승인)
import * as store from '../store.js';
import * as tts from '../tts.js';
import { generate, GEN_PARTS } from '../llm.js';
import { checkQuestion } from '../content-rules.js';
import { PARTS, QUESTION_TYPES, LEVEL_ORDER } from '../seed-data.js';
import { escapeHtml, typeBadges, qNoBadge, scheduleHtml, guideHtml, toast, download, pickFile } from '../ui.js';
import { backBar } from './study.js';

const EXTRA_LEVELS = LEVEL_ORDER.filter((lv) => lv !== 'IL');

// 같은 주제를 또 만들지 않도록 AI에 알려 줄 기존 주제 목록
function existingTopics(part) {
  const qs = store.getAllQuestions().filter((q) => q.part === part);
  if (part === 1) return qs.map((q) => (q.topic ? q.topic + ' — ' : '') + q.questionEnglish.split(/\s+/).slice(0, 8).join(' '));
  if (part === 5) return qs.map((q) => q.questionEnglish.replace(/ Use specific reasons.*$/, ''));
  const seen = new Set();
  return qs.map((q) => store.getSet(q.setId))
    .filter((set) => set && !seen.has(set.id) && seen.add(set.id))
    .map((set) => set.topic + (set.schedule ? ' — ' + set.schedule.title : ''));
}

// 검토 대기 문항을 세트 단위로 묶는다 (세트가 없는 문항은 단독)
function pendingGroups(pending) {
  const groups = [];
  const bySet = new Map();
  for (const q of pending) {
    if (q.setId) {
      if (!bySet.has(q.setId)) {
        bySet.set(q.setId, []);
        groups.push({ set: store.getSet(q.setId), questions: bySet.get(q.setId) });
      }
      bySet.get(q.setId).push(q);
    } else groups.push({ set: null, questions: [q] });
  }
  for (const g of groups) g.questions.sort((a, b) => (a.qNo || 0) - (b.qNo || 0));
  return groups;
}

function reviewNotesHtml(q) {
  const notes = q.reviewNotes || [];
  if (!notes.length) return '<div class="review-ok">✓ 자동 규격 검사 통과</div>';
  return `<ul class="review-notes">${notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`;
}

function pendingQuestionHtml(q) {
  const levels = store.availableLevels(q);
  return `
    <div class="pend-q">
      <div class="q-item-top">${qNoBadge(q, { timing: false })}${typeBadges(q)}
        ${q.topic ? `<span class="q-topic">${escapeHtml(q.topic)}</span>` : ''}</div>
      ${q.part === 1 && q.guide ? `<div class="passage guide">${guideHtml(q.guide)}</div>`
        : `<div class="q-item-en">${escapeHtml(q.questionEnglish)}</div>`}
      <div class="q-item-ko">${escapeHtml(q.questionKorean)}</div>
      ${q.part === 1 ? '' : `<details class="pend-answers">
        <summary>모범답변 ${levels.join(' · ')}</summary>
        ${levels.map((lv) => {
          const a = store.getAnswer(q, lv, 'worker');
          return `<div class="pend-ans"><span class="lv-tag">${lv}</span> ${escapeHtml(a.en)}<div class="q-item-ko">${escapeHtml(a.ko)}</div></div>`;
        }).join('')}
      </details>`}
      ${reviewNotesHtml(q)}
      <div class="btn-row">
        <button class="sub-btn small-btn listen" data-id="${escapeHtml(q.id)}">🔊 듣기</button>
        <button class="sub-btn small-btn edit" data-id="${escapeHtml(q.id)}">✏️ 고치기</button>
        ${q.setId ? '' : `<button class="sub-btn small-btn approve" data-id="${escapeHtml(q.id)}">✅ 승인</button>
        <button class="sub-btn small-btn danger reject" data-id="${escapeHtml(q.id)}">🗑 거부</button>`}
      </div>
    </div>`;
}

function pendingGroupHtml(g) {
  const head = g.set ? `
      <div class="q-item-top"><span class="badge badge-part">Part ${g.set.part}</span> <b>${escapeHtml(g.set.topic || '세트')}</b>
        <span class="desc small">세트 (Q${g.questions.map((q) => q.qNo).join('·')})</span></div>
      <div class="set-intro"><div class="q-item-en">${escapeHtml(g.set.introEnglish)}</div>
        <div class="q-item-ko">${escapeHtml(g.set.introKorean)}</div></div>
      ${scheduleHtml(g.set.schedule)}`
    : `<div class="q-item-top"><span class="badge badge-part">Part ${g.questions[0].part}</span></div>`;
  return `
    <div class="card pend-group">
      ${head}
      ${g.questions.map(pendingQuestionHtml).join('')}
      ${g.set ? `<div class="btn-row">
        <button class="sub-btn small-btn approve" data-set="${escapeHtml(g.set.id)}">✅ 세트 승인</button>
        <button class="sub-btn small-btn danger reject" data-set="${escapeHtml(g.set.id)}">🗑 세트 거부</button>
      </div>` : ''}
    </div>`;
}

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
        <label>영어 모범답변 (IL)
          <textarea name="answerEnglish" rows="2">${editing ? escapeHtml(editing.answerEnglish) : ''}</textarea></label>
        <label>답변 한국어 해석 (IL)
          <textarea name="answerKorean" rows="2">${editing ? escapeHtml(editing.answerKorean) : ''}</textarea></label>
        <details class="lv-fields" ${editing && editing.levelAnswers && Object.keys(editing.levelAnswers).length ? 'open' : ''}>
          <summary>레벨별 모범답변 (IM · IH · AL, 선택)</summary>
          ${EXTRA_LEVELS.map((lv) => {
            const v = (editing && editing.levelAnswers && editing.levelAnswers[lv]) || {};
            return `
            <label>${lv} 영어 답변
              <textarea name="la_${lv}_en" rows="3">${escapeHtml(v.en || '')}</textarea></label>
            <label>${lv} 한국어 해석
              <textarea name="la_${lv}_ko" rows="3">${escapeHtml(v.ko || '')}</textarea></label>`;
          }).join('')}
          <p class="desc small">비워 둔 레벨은 한 단계 아래 레벨 답변으로 대신 보여줍니다.</p>
        </details>
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
        <label>파트 <select id="genPart">${Object.entries(GEN_PARTS).map(([n, g]) => `<option value="${n}" ${n === '3' ? 'selected' : ''}>${g.label}</option>`).join('')}</select></label>
        <label>개수 <select id="genCount">${[1, 2, 3, 5].map((c) => `<option value="${c}">${c}</option>`).join('')}</select></label>
      </div>
      <label>주제 (선택) <input id="genHint" maxlength="60" placeholder="예: 헬스장, 사내 체육대회 — 비우면 AI가 새 주제를 고릅니다"></label>
      <button class="sub-btn primary-btn" id="genBtn">생성하기</button>
      <p class="desc small" id="genStatus">실제 시험 형식으로 만듭니다 — Part 3·4는 상황 안내(·일정표)와 3문항 세트, 모든 문항에 IL·IM·IH·AL 모범답변.
        만든 뒤 자동 규격 검사 결과를 보고 '검토 대기'에서 승인해야 학습에 나옵니다. Part 2는 사진이 필요해 제외합니다. (PC 실행 + .env에 LLM 키 필요)</p>
    </div>

    ${pending.length ? `
    <h3 class="section-title">검토 대기 (${pending.length})</h3>
    ${pendingGroups(pending).map(pendingGroupHtml).join('')}` : ''}

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
        <div class="q-item-top">${typeBadges(q)} <span class="badge badge-part">Part ${q.part}</span>
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
    const levelAnswers = {};
    for (const lv of EXTRA_LEVELS) {
      const en = (data[`la_${lv}_en`] || '').trim();
      const ko = (data[`la_${lv}_ko`] || '').trim();
      if (en) levelAnswers[lv] = { en, ko };
      delete data[`la_${lv}_en`]; delete data[`la_${lv}_ko`];
    }
    data.levelAnswers = levelAnswers;
    if (editing) {
      const patch = { ...data, part: Number(data.part), difficulty: Number(data.difficulty) };
      // Part 1 지문을 고치면 예전 끊어 읽기 표시는 맞지 않으므로 지운다
      if (editing.part === 1 && editing.guide && patch.questionEnglish !== editing.questionEnglish) patch.guide = '';
      // 검토 대기 문항을 고치면 자동 규격 검사를 다시 한다
      if (editing.status === 'pending') {
        const r = checkQuestion({ ...editing, ...patch }, store.getSet(editing.setId));
        patch.reviewNotes = [...r.errors, ...r.warns.map((w) => '확인: ' + w)];
      }
      store.updateQuestion(editing.id, patch);
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
    const part = Number($('#genPart').value);
    const unit = GEN_PARTS[part].unit;
    btn.disabled = true;
    try {
      const { units, failed } = await generate({
        part,
        count: Number($('#genCount').value),
        hint: $('#genHint').value.trim(),
        avoid: existingTopics(part),
        onProgress: (done, total) => {
          status.textContent = done < total
            ? `생성 중… ${done + 1} / ${total} ${unit} (하나에 30초~2분 걸릴 수 있습니다)` : '저장 중…';
        },
      });
      let saved = 0;
      for (const u of units) {
        try {
          const setId = u.set ? store.addSet(u.set).id : '';
          u.questions.forEach((q) => store.addQuestion({ ...q, setId }));
          saved++;
        } catch (e) { failed.push(e.message); }
      }
      toast(`${unit} ${saved}개 생성 — 검토 대기에 추가됨${failed.length ? ` (실패 ${failed.length})` : ''}`);
      renderAdmin(root);
      if (failed.length) root.querySelector('#genStatus').textContent = '⚠️ 일부 실패: ' + failed[0];
    } catch (e) {
      status.textContent = '⚠️ ' + e.message;
      btn.disabled = false;
    }
  });

  // ── 목록 버튼 (승인/거부/수정/삭제/듣기) ──
  // onclick 할당으로 중복 등록을 방지 (라우터가 화면 전환 시 null로 초기화)
  root.onclick = (e) => {
    const btn = e.target.closest('button[data-id], button[data-set]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.set) {
      // 세트 단위 승인·거부 — 상황 안내·일정표와 3문항은 함께 있어야 의미가 있다
      const qs = store.getAllQuestions().filter((q) => q.setId === btn.dataset.set && q.status === 'pending');
      if (btn.classList.contains('approve')) {
        qs.forEach((q) => store.updateQuestion(q.id, { status: 'approved', reviewNotes: undefined }));
        toast('세트를 승인했습니다');
      } else if (btn.classList.contains('reject')) {
        if (!confirm('이 세트(3문항)를 삭제할까요?')) return;
        qs.forEach((q) => store.deleteQuestion(q.id));
        toast('세트를 거부(삭제)했습니다');
      }
      renderAdmin(root);
      return;
    }
    if (btn.classList.contains('approve')) {
      store.updateQuestion(id, { status: 'approved', reviewNotes: undefined });
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
