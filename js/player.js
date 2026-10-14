// 듣기 모드 시퀀스 재생기
// (세트 첫 문항이면 상황 안내) → 영어 질문 → (신호음) → 생각 시간 → 한국어 해석 → 영어 모범답변 → 한국어 답변 해석 → 다음 문제
// - 생각 시간 '실전'(thinkSeconds=0)이면 실제 시험처럼 준비 시간 → 신호음 → 응답 시간 (Q5 3초+15초 … Q11 45초+60초)
// - Q10은 실제 시험처럼 질문을 두 번 들려준다
// - 생각 시간/간격은 타이머가 아니라 "무음 오디오 재생"으로 진행 → 화면 잠금에서도 계속 이어진다.
// - 이어폰/잠금화면 컨트롤(play/pause/next/prev)과 화면 UI는 onPlayState 콜백으로 단일 동기화.
// - 오디오가 연속 3문항 무음이면 자동 일시정지하고 사용자에게 알린다 (자동재생 차단 대응).

import * as tts from './tts.js';
import { getSettings, getAnswer, getSet, recordListen, addStudySeconds } from './store.js';
import { TEST_TIMING, REPEATED_QNO } from './seed-data.js';

// 실전 시간: 문항 번호가 없는 사용자 추가 문항은 파트 기준
function timingOf(q) {
  return TEST_TIMING[q.qNo] || (q.part === 5 ? TEST_TIMING[11] : TEST_TIMING[5]);
}

export class SequencePlayer {
  constructor(questions, { onQuestionChange, onStepChange, onFinish, onPlayState } = {}) {
    this.questions = questions;
    this.index = 0;
    this.paused = true;
    this.onQuestionChange = onQuestionChange || (() => {});
    this.onStepChange = onStepChange || (() => {});
    this.onFinish = onFinish || (() => {});
    this.onPlayState = onPlayState || (() => {});
    this._startedAt = null;
    this._runToken = 0;
    this._failStreak = 0;
    this._destroyed = false;
    this._introFor = null; // 마지막으로 상황 안내를 들려준 세트 — 같은 세트 안에서는 반복하지 않는다
  }

  get current() { return this.questions[this.index]; }

  start() {
    this._setupMediaSession();
    // 통화 수신 등 외부 인터럽션은 실패가 아니라 일시정지로 처리 — 문항이 무음으로 소모되지 않게
    tts.setInterruptHandler(() => { if (!this.paused && !this._destroyed) this.pause(); });
    this.resume();
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this._runToken++;
    tts.cancel();
    this._flushStudyTime();
    this._setState('paused');
  }

  resume() {
    if (this._destroyed) return;
    if (!this.paused) return;
    this.paused = false;
    this._failStreak = 0;
    if (!this._startedAt) this._startedAt = Date.now();
    this._setState('playing');
    this._playFrom(this.index);
  }

  toggle() { this.paused ? this.resume() : this.pause(); }

  // 화면 이탈 시 완전 정리
  stop() {
    this._destroyed = true;
    tts.setInterruptHandler(null);
    this.paused = true;
    this._runToken++;
    tts.cancel();
    this._flushStudyTime();
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
        for (const a of ['play', 'pause', 'nexttrack', 'previoustrack']) {
          navigator.mediaSession.setActionHandler(a, null);
        }
      } catch {}
    }
  }

  next() { this._jump((this.index + 1) % this.questions.length); }
  prev() { this._jump(Math.max(this.index - 1, 0)); }
  replay() { this._jump(this.index); }

  _jump(i) {
    this.index = i;
    // 일시정지 중 이동해도 화면 카운터는 항상 실제 위치와 일치시킨다
    this.onQuestionChange(this.questions[i], i, this.questions.length);
    if (this.paused) { this.resume(); return; }
    this._runToken++;
    tts.cancel();
    this._playFrom(i);
  }

  _setState(state) {
    if ('mediaSession' in navigator) {
      try { navigator.mediaSession.playbackState = state === 'playing' ? 'playing' : 'paused'; } catch {}
    }
    this.onPlayState(state);
  }

  _flushStudyTime() {
    if (this._startedAt) {
      addStudySeconds((Date.now() - this._startedAt) / 1000);
      this._startedAt = null;
    }
  }

  async _playFrom(startIndex) {
    const token = ++this._runToken;
    if (!this._startedAt) this._startedAt = Date.now(); // 재개 후에도 학습 시간 집계 유지
    for (let i = startIndex; i < this.questions.length; i++) {
      if (token !== this._runToken || this.paused) return;
      this.index = i;
      const q = this.questions[i];
      this.onQuestionChange(q, i, this.questions.length);
      const spoke = await this._playOne(q, token);
      if (token !== this._runToken || this.paused) return;

      // 자동재생 차단/오프라인 등으로 소리가 전혀 안 났으면 무음 폭주 대신 자동 일시정지
      if (spoke === false) {
        this._failStreak++;
        if (this._failStreak >= 3) {
          this.pause();
          this._setState('blocked');
          return;
        }
      } else if (spoke === true) {
        this._failStreak = 0;
      }

      recordListen(q.id);
      await tts.playSilence(getSettings().gapSeconds);
    }
    // 목록 끝 → 처음부터 다시 (운동 중 계속 반복)
    if (token === this._runToken && !this.paused) {
      this.onFinish();
      this._playFrom(0);
    }
  }

  // 반환: true=최소 한 단계 정상 재생, false=전부 무음
  async _playOne(q, token) {
    const s = getSettings();
    const alive = () => token === this._runToken && !this.paused;
    let anyOk = false;

    // Part 1 지문 읽기: 모범 낭독 → (신호음) 따라 읽을 시간 → 지문 해석
    if (q.part === 1) {
      this.onStepChange('model');
      anyOk = await tts.speak(q.questionEnglish, 'en-US');
      if (!alive()) return null;
      if (!anyOk) return false;
      // 따라 읽기 시간: 실전이면 준비 45초 + 읽기 45초, 아니면 지문을 읽을 만큼(단어당 약 0.5초)은 보장
      const ok = await this._speakingTime(q, s, alive, Math.round(q.questionEnglish.split(/\s+/).length * 0.5), 'readAloud');
      if (!ok) return null;
      if (s.playQuestionKo) {
        this.onStepChange('questionKo');
        anyOk = (await tts.speak(q.questionKorean, 'ko-KR')) || anyOk;
        if (!alive()) return null;
      }
      return anyOk;
    }
    // Part 2 사진 묘사: 지시문 → (신호음) 묘사할 시간 → 모범 묘사 → 해석
    if (q.part === 2) {
      this.onStepChange('question');
      anyOk = await tts.speak(q.questionEnglish, 'en-US');
      if (!alive()) return null;
      if (!anyOk) return false;
      const ok = await this._speakingTime(q, s, alive, 15, 'describe');
      if (!ok) return null;
      return this._playAnswer(q, s, alive, anyOk);
    }

    // 실제 시험처럼 세트의 첫 질문 전에 상황 안내(Part 3)·질문자 안내(Part 4)
    const set = getSet(q.setId);
    if (set && s.playSetIntro && this._introFor !== set.id) {
      this.onStepChange('intro');
      anyOk = (await tts.speak(set.introEnglish, 'en-US')) || anyOk;
      if (!alive()) return null;
      await tts.playSilence(0.8);
      if (!alive()) return null;
    }
    this._introFor = set ? set.id : null;

    this.onStepChange('question');
    anyOk = (await tts.speak(q.questionEnglish, 'en-US')) || anyOk;
    if (!alive()) return null;
    // 질문부터 무음이면(자동재생 차단/오프라인) 나머지 단계를 돌지 않고 즉시 실패 보고
    // → 수십 초 무음 대신 몇 초 안에 자동 일시정지 안내가 뜬다
    if (!anyOk) return false;

    if (s.repeatQuestion || REPEATED_QNO.has(q.qNo)) {
      await tts.playSilence(0.6);
      if (!alive()) return null;
      anyOk = (await tts.speak(q.questionEnglish, 'en-US')) || anyOk;
      if (!alive()) return null;
    }

    if (!(await this._speakingTime(q, s, alive, 0, 'think'))) return null;

    if (s.playQuestionKo) {
      this.onStepChange('questionKo');
      anyOk = (await tts.speak(q.questionKorean, 'ko-KR')) || anyOk;
      if (!alive()) return null;
      await tts.playSilence(0.5);
      if (!alive()) return null;
    }

    return this._playAnswer(q, s, alive, anyOk);
  }

  // 말해 볼 시간 — (신호음) 후 생각/답변 시간. 실전(thinkSeconds=0)이면 준비 → 신호음 → 응답 시간.
  // minSeconds: 실전이 아닐 때 최소 시간 (지문 읽기·사진 묘사는 짧은 생각 시간으로는 부족하다)
  // 반환: 중간에 정지·이동되면 false
  async _speakingTime(q, s, alive, minSeconds, step) {
    const real = !s.thinkSeconds;
    this.onStepChange(real ? 'prep' : step);
    if (s.beepAfterQuestion) {
      // 실제 시험처럼 질문이 끝나면 신호음 후 생각 시간 시작
      await tts.playSilence(0.4);
      if (!alive()) return false;
      await tts.beep();
      if (!alive()) return false;
    }
    if (real) {
      const t = timingOf(q);
      await tts.playSilence(t.prep);
      if (!alive()) return false;
      this.onStepChange('respond');
      await tts.beep();
      if (!alive()) return false;
      await tts.playSilence(t.response);
    } else {
      await tts.playSilence(Math.max(s.thinkSeconds, minSeconds));
    }
    return alive();
  }

  // 목표 레벨의 모범답변 (없으면 아래 레벨로 폴백) → 답변 해석
  async _playAnswer(q, s, alive, anyOk) {
    const ans = getAnswer(q, s.targetLevel);

    if (s.playAnswerEn) {
      this.onStepChange('answer');
      anyOk = (await tts.speak(ans.en, 'en-US')) || anyOk;
      if (!alive()) return null;
      await tts.playSilence(0.4);
      if (!alive()) return null;
    }

    if (s.playAnswerKo) {
      this.onStepChange('answerKo');
      anyOk = (await tts.speak(ans.ko, 'ko-KR')) || anyOk;
      if (!alive()) return null;
    }

    return anyOk;
  }

  // 잠금화면/이어폰 컨트롤 — play/pause 모두 지원
  _setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'TOEIC Speaking Trainer',
        artist: '질문 듣기 훈련',
      });
      navigator.mediaSession.setActionHandler('play', () => this.resume());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
    } catch {}
  }
}
