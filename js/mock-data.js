// 모의고사(실전 시험 화면) 안내문·음성 큐 — 자체 작성 문장 (실제 시험 안내문을 옮긴 것이 아님, 구성과 시간만 같다)
// 영어 문장은 신경망 음성(audio/)으로도 만들어 두므로 고치면 tools/export-texts.mjs → generate_audio.py를 다시 실행한다.
import { TEST_TIMING, PART4_READING_SECONDS } from './seed-data.js';

const t = TEST_TIMING;

// 파트별 시험 안내 화면: title(제목) · en(화면+음성) · ko(보조 해석)
export const MOCK_DIRECTIONS = {
  1: {
    title: 'Questions 1–2 : Read a text aloud',
    en: `In this part of the test, you will read aloud the text on the screen. You will have ${t[1].prep} seconds to prepare. Then you will have ${t[1].response} seconds to read the text aloud.`,
    ko: `이 파트에서는 화면의 글을 소리 내어 읽습니다. 준비 시간은 ${t[1].prep}초이고, 이어서 ${t[1].response}초 동안 글을 소리 내어 읽습니다.`,
  },
  2: {
    title: 'Questions 3–4 : Describe a picture',
    en: `In this part of the test, you will describe the picture on your screen in as much detail as you can. You will have ${t[3].prep} seconds to prepare your response. Then you will have ${t[3].response} seconds to speak about the picture.`,
    ko: `이 파트에서는 화면의 사진을 최대한 자세히 묘사합니다. 준비 시간은 ${t[3].prep}초이고, 이어서 ${t[3].response}초 동안 사진에 대해 말합니다.`,
  },
  3: {
    title: 'Questions 5–7 : Respond to questions',
    en: `In this part of the test, you will answer three questions. For each question, begin responding right after you hear the beep. You will have ${t[5].response} seconds to respond to Questions 5 and 6, and ${t[7].response} seconds to respond to Question 7.`,
    ko: `이 파트에서는 세 개의 질문에 답합니다. 각 질문마다 신호음이 들리면 바로 답하기 시작합니다. 5번과 6번은 ${t[5].response}초, 7번은 ${t[7].response}초 동안 답합니다.`,
  },
  4: {
    title: 'Questions 8–10 : Respond to questions using information provided',
    en: `In this part of the test, you will answer three questions based on the information provided. You will have ${PART4_READING_SECONDS} seconds to read the information before the questions begin. For each question, begin responding right after you hear the beep. You will have ${t[8].response} seconds to respond to Questions 8 and 9, and ${t[10].response} seconds to respond to Question 10.`,
    ko: `이 파트에서는 제공된 정보를 바탕으로 세 개의 질문에 답합니다. 질문이 시작되기 전에 ${PART4_READING_SECONDS}초 동안 정보를 읽습니다. 각 질문마다 신호음이 들리면 바로 답하기 시작합니다. 8번과 9번은 ${t[8].response}초, 10번은 ${t[10].response}초 동안 답합니다.`,
  },
  5: {
    title: 'Question 11 : Express an opinion',
    en: `In this part of the test, you will give your opinion about a specific topic. Be sure to say as much as you can in the time allowed. You will have ${t[11].prep} seconds to prepare. Then you will have ${t[11].response} seconds to speak.`,
    ko: `이 파트에서는 특정 주제에 대한 자신의 의견을 말합니다. 주어진 시간 동안 가능한 한 많이 말하십시오. 준비 시간은 ${t[11].prep}초이고, 이어서 ${t[11].response}초 동안 말합니다.`,
  },
};

// 준비 시간이 긴 문항(Q1–4·Q11)에서 준비·응답을 시작할 때 들려주는 한마디
export const MOCK_CUES = {
  prepare: 'Begin preparing now.',
  readAloud: 'Begin reading aloud now.',
  speak: 'Begin speaking now.',
};

// 음성 생성 대상 (tools/export-texts.mjs가 읽는다)
export const MOCK_AUDIO_TEXTS = [
  ...Object.entries(MOCK_DIRECTIONS).map(([part, d]) => ({ name: `dir${part}`, text: d.en })),
  ...Object.entries(MOCK_CUES).map(([k, text]) => ({ name: `cue-${k}`, text })),
];
