// 운동 모드 시퀀스 재생기
// 영어 질문 → 생각 시간 → 한국어 해석 → 영어 모범답변 → 한국어 답변 해석 → 다음 문제
// 각 단계는 설정에서 ON/OFF 가능. 화면을 보지 않아도 되도록 완전 자동 진행.

import * as tts from './tts.js';
import { getSettings, recordListen, addStudySeconds } from './store.js';

export class SequencePlayer {
  constructor(questions, { onQuestionChange, onStepChange, onFinish } = {}) {
    this.questions = questions;
    this.index = 0;
    this.playing = false;
    this.stopped = false;
    this.onQuestionChange = onQuestionChange || (() => {});
    this.onStepChange = onStepChange || (() => {});
    this.onFinish = onFinish || (() => {});
    this._startedAt = null;
    this._runToken = 0;
  }

  get current() { return this.questions[this.index]; }

  start() {
    this.stopped = false;
    this._startedAt = Date.now();
    this._setupMediaSession();
    this._playFrom(this.index);
  }

  stop() {
    this.stopped = true;
    this.playing = false;
    this._runToken++;
    tts.cancel();
    this._flushStudyTime();
  }

  next() { this._jump(this.index + 1); }
  prev() { this._jump(Math.max(this.index - 1, 0)); }

  replay() { this._jump(this.index); }

  _jump(i) {
    if (i >= this.questions.length) i = 0; // 끝나면 처음부터 반복
    this._runToken++;
    tts.cancel();
    this.index = i;
    if (!this.stopped) this._playFrom(i);
  }

  _flushStudyTime() {
    if (this._startedAt) {
      addStudySeconds((Date.now() - this._startedAt) / 1000);
      this._startedAt = null;
    }
  }

  async _playFrom(startIndex) {
    const token = ++this._runToken;
    this.playing = true;
    for (let i = startIndex; i < this.questions.length; i++) {
      if (token !== this._runToken || this.stopped) return;
      this.index = i;
      const q = this.questions[i];
      this.onQuestionChange(q, i, this.questions.length);
      await this._playOne(q, token);
      if (token !== this._runToken || this.stopped) return;
      recordListen(q.id);
      const s = getSettings();
      await tts.wait(s.gapSeconds);
    }
    // 목록 끝 → 처음부터 다시 (운동 중 계속 반복)
    if (token === this._runToken && !this.stopped) {
      this.onFinish();
      this._playFrom(0);
    }
  }

  async _playOne(q, token) {
    const s = getSettings();
    const alive = () => token === this._runToken && !this.stopped;

    this.onStepChange('question');
    await tts.speak(q.questionEnglish, 'en-US');
    if (!alive()) return;

    if (s.repeatQuestion) {
      await tts.wait(0.6);
      if (!alive()) return;
      await tts.speak(q.questionEnglish, 'en-US');
      if (!alive()) return;
    }

    this.onStepChange('think');
    if (s.beepAfterQuestion) {
      // 실제 시험처럼 질문이 끝나면 신호음 후 답변(생각) 시간 시작
      await tts.wait(0.4);
      if (!alive()) return;
      await tts.beep();
      if (!alive()) return;
    }
    await tts.wait(s.thinkSeconds);
    if (!alive()) return;

    if (s.playQuestionKo) {
      this.onStepChange('questionKo');
      await tts.speak(q.questionKorean, 'ko-KR');
      if (!alive()) return;
      await tts.wait(0.5);
      if (!alive()) return;
    }

    if (s.playAnswerEn) {
      this.onStepChange('answer');
      await tts.speak(q.answerEnglish, 'en-US');
      if (!alive()) return;
      await tts.wait(0.4);
      if (!alive()) return;
    }

    if (s.playAnswerKo) {
      this.onStepChange('answerKo');
      await tts.speak(q.answerKorean, 'ko-KR');
      if (!alive()) return;
    }
  }

  // 잠금화면/이어폰 컨트롤 (지원 브라우저에서)
  _setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'TOEIC Speaking Trainer',
        artist: '질문 듣기 훈련',
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      navigator.mediaSession.setActionHandler('pause', () => this.stop());
    } catch {}
  }
}
