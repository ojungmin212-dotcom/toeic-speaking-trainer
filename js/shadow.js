// 쉐도잉 (다음 단계 3) — 모범답변·지문을 문장마다 끊어 들려주고, 문장 길이에 맞춘 시간 동안 따라 말하게 한다.
// 듣기 모드(player)와 질문 상세 화면이 함께 쓴다. 따라 말할 시간은 무음 오디오로 기다려 화면 잠금에서도 이어진다.
import * as tts from './tts.js';

// 반환: true = 한 문장이라도 소리가 났음, false = 전부 무음, null = 중간에 취소됨
// alive(): 계속해도 되는지 / onSentence(i, n, sentence): 문장이 바뀔 때 화면 표시
// pauseScale·pauseExtra: 따라 말할 시간 = 문장 재생 시간 × pauseScale + pauseExtra 초
export async function shadowText(text, { alive, onSentence = () => {}, pauseScale = 1.3, pauseExtra = 0.8, repeat = 1 } = {}) {
  const sents = await tts.getSentences(text);
  if (!alive()) return null;
  let anyOk = false;
  for (let i = 0; i < sents.length; i++) {
    onSentence(i, sents.length, sents[i]);
    for (let r = 0; r < repeat; r++) {
      const ok = await tts.speakSentence(sents[i]);
      if (!alive()) return null;
      anyOk = anyOk || ok;
      if (r < repeat - 1) {
        await tts.playSilence(0.5);
        if (!alive()) return null;
      }
    }
    await tts.playSilence(tts.sentenceSeconds(sents[i]) * pauseScale + pauseExtra);
    if (!alive()) return null;
  }
  return anyOk;
}
