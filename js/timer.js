// 응답 시간 타이머 — 시험 화면의 검은 머리글 상자(RESPONSE TIME 00 : 00 : 13)
// 모의고사(views/mock.js)와 파트·레벨별 학습의 질문 상세(views/study.js)가 함께 쓴다.
// 학습 화면에는 '실제로 말하는 시간' 타이머만 있다 (준비 시간 타이머는 없음 — 모의고사에서 연습).
import * as tts from './tts.js';
import { TEST_TIMING } from './seed-data.js';

// 검증용: 타이머 배율 (1 = 실제 시간)
export const _timerTest = { scale: 1 };

export function timerHtml(label, seconds) {
  const s = Math.max(0, seconds);
  const p = (n) => String(n).padStart(2, '0');
  return `<div class="ex-timer"><div class="ex-timer-label">${label}</div>` +
    `<div class="ex-timer-time">${p(Math.floor(s / 3600))} : ${p(Math.floor((s % 3600) / 60))} : ${p(s % 60)}</div></div>`;
}

// 문항의 실제 응답 시간(초) — Q1·2 45 · Q3·4 30 · Q5·6 15 · Q7 30 · Q8·9 15 · Q10 30 · Q11 60.
// 번호가 없는 문항(직접 추가·AI 생성)은 파트 기준.
export function responseSeconds(q) {
  const t = TEST_TIMING[q.qNo] ||
    (q.part === 5 ? TEST_TIMING[11] : q.part === 1 ? TEST_TIMING[1] : q.part === 2 ? TEST_TIMING[3] : TEST_TIMING[5]);
  return t.response;
}

// 질문 상세의 '응답 시간 연습' 카드를 동작시킨다.
// root 안에 #rtBox(타이머 상자 자리) · #rtBtn(시작/그만하기) · #rtNote(안내 문구)가 있어야 한다.
// 반환: { stop() } — 화면을 떠날 때 호출 (화면이 사라지면 스스로도 멈춘다)
export function bindResponseTimer(root, seconds, { beep = true } = {}) {
  const box = root.querySelector('#rtBox');
  const btn = root.querySelector('#rtBtn');
  const note = root.querySelector('#rtNote');
  if (!box || !btn) return { stop() {} };
  let timer = null;
  let run = 0; // 시작할 때마다 올려서, 신호음을 기다리는 사이 취소된 실행을 구분한다

  const idle = () => { box.innerHTML = timerHtml('RESPONSE TIME', seconds); };
  const reset = (text) => {
    clearInterval(timer);
    timer = null;
    run++;
    btn.textContent = '⏱ 말하기 시작';
    btn.classList.remove('is-running');
    if (text != null && note) note.textContent = text;
  };
  idle();

  btn.addEventListener('click', async () => {
    if (timer || btn.classList.contains('is-running')) { // 진행 중이면 그만하기
      reset('멈췄습니다. 다시 하려면 ⏱ 버튼을 누르세요.');
      idle();
      return;
    }
    const myRun = ++run;
    tts.cancel(); // 재생 중인 음성이 있으면 끊는다
    btn.classList.add('is-running');
    btn.textContent = '■ 그만하기';
    if (note) note.textContent = beep ? '신호음이 울리면 바로 말하기 시작하세요.' : '지금 말하기 시작하세요.';
    if (beep) {
      await tts.beep();
      if (myRun !== run) return; // 신호음 중에 그만둠
    }
    if (note) note.textContent = '소리 내어 답해 보세요!';
    const end = Date.now() + seconds * 1000 * _timerTest.scale;
    const draw = () => {
      if (!box.isConnected) { reset(); return 0; } // 화면이 바뀌었다
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000 / _timerTest.scale - 0.001));
      box.innerHTML = timerHtml('RESPONSE TIME', left);
      return left;
    };
    draw();
    timer = setInterval(() => {
      if (draw() > 0) return;
      if (!box.isConnected) return;
      reset('시간 종료! 아래 모범답변과 비교해 보세요.');
      if (beep) tts.beep(660, 0.35);
    }, 100);
  });

  return { stop: () => reset() };
}
