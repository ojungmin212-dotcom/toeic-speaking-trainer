import { LEVEL_ANSWERS } from './level-answers.js';

// 자체 제작 연습 문항 시드 데이터 (실제 ETS 기출 아님 — 시험 구조만 참고)
// 유형별 10문항, 총 110문항. 영어 초보자가 이해하고 답할 수 있는 짧은 문장.

export const QUESTION_TYPES = {
  time:       { ko: '시간',   key: 'When / What time',   hint: 'When = 시간' },
  place:      { ko: '장소',   key: 'Where',              hint: 'Where = 장소' },
  frequency:  { ko: '빈도',   key: 'How often',          hint: 'How often = 빈도' },
  reason:     { ko: '이유',   key: 'Why',                hint: 'Why = 이유' },
  preference: { ko: '선호',   key: 'What ~ like / favorite', hint: 'favorite / like = 선호' },
  experience: { ko: '경험',   key: 'Have you ever',      hint: 'Have you ever = 경험' },
  person:     { ko: '사람',   key: 'Who',                hint: 'Who = 사람' },
  action:     { ko: '행동',   key: 'What do you do',     hint: 'What do you do = 행동' },
  choice:     { ko: '선택',   key: 'Which do you prefer, A or B', hint: 'A or B = 선택' },
  opinion:    { ko: '의견/장단점', key: 'Do you think / advantages', hint: 'Do you think = 의견' },
  schedule:   { ko: '일정/정보확인', key: 'What time / Is that right?', hint: '일정표 정보를 묻는 질문' },
};

// 목표 레벨 (TOEIC Speaking ACTFL 등급) — 점수 구간은 ETS 등급표 기준
// (NL 0~30 · NM 40~60 · NH 70~80 · IL 90~100 · IM1 110 · IM2 120 · IM3 130 · IH 140~150 · AL 160~170 · AM 180~190 · AH 200)
export const LEVEL_ORDER = ['IL', 'IM', 'IH', 'AL'];
export const LEVELS = {
  IL: {
    full: 'Intermediate Low', score: '90~100점',
    desc: '짧고 쉬운 문장으로 핵심만 말하기',
    guide: 'Part 3: 한 문장으로 답하기 · Part 5: 입장 + 이유 2개를 쉬운 문장으로 (약 75단어)',
  },
  IM: {
    full: 'Intermediate Mid', score: '110~130점 (IM1~IM3)',
    desc: '이유와 세부 정보를 붙여 자연스럽게 연결하기',
    guide: 'Part 3: 답 + 이유 1개 (약 20단어) · Part 5: 입장 + 이유 2개 + 예시 1개 (약 90단어)',
  },
  IH: {
    full: 'Intermediate High', score: '140~150점',
    desc: '다양한 연결어와 구체적 경험으로 막힘없이 말하기',
    guide: 'Part 3: 답 + 이유 + 경험 (약 30단어) · Part 5: 구체적 경험이 담긴 예시 (약 120단어)',
  },
  AL: {
    full: 'Advanced Low', score: '160~170점',
    desc: '자연스러운 표현과 복문으로 설득력 있게 말하기',
    guide: 'Part 3: 다양한 문장 구조 (약 40단어) · Part 5: 논리적 전개와 자연스러운 마무리 (약 140단어)',
  },
};

export const PARTS = {
  3: { name: 'Part 3', desc: '듣고 질문에 답하기 (Q5–7) — 일상 주제 짧은 질문' },
  4: { name: 'Part 4', desc: '제공된 정보로 답하기 (Q8–10) — 일정/정보 확인' },
  5: { name: 'Part 5', desc: '의견 제시하기 (Q11) — 의견·선택·장단점' },
};

let n = 0;
function q(part, type, diff, keyExpr, en, ko, aEn, aKo) {
  n += 1;
  return {
    id: 'seed-' + String(n).padStart(3, '0'),
    part, questionType: type, difficulty: diff,
    keyExpression: keyExpr,
    questionEnglish: en, questionKorean: ko,
    answerEnglish: aEn, answerKorean: aKo,
    questionAudioUrl: null, answerAudioUrl: null,
    status: 'approved',
  };
}

export const SEED_QUESTIONS = [
  // ── 시간 (time) ──────────────────────────────────────────────
  q(3, 'time', 1, 'When', 'When do you usually get up in the morning?', '아침에 보통 언제 일어납니까?', 'I usually get up at seven.', '저는 보통 7시에 일어납니다.'),
  q(3, 'time', 1, 'When', 'When did you last go shopping?', '마지막으로 쇼핑한 것은 언제입니까?', 'I went shopping last weekend.', '지난 주말에 쇼핑을 했습니다.'),
  q(3, 'time', 1, 'When', 'When do you usually watch TV?', '보통 언제 TV를 봅니까?', 'I usually watch TV at night.', '저는 보통 밤에 TV를 봅니다.'),
  q(3, 'time', 1, 'What time', 'What time do you usually have lunch?', '보통 몇 시에 점심을 먹습니까?', 'I have lunch at noon.', '저는 정오에 점심을 먹습니다.'),
  q(3, 'time', 1, 'When', 'When do you usually exercise?', '보통 언제 운동합니까?', 'I exercise in the evening.', '저는 저녁에 운동합니다.'),
  q(3, 'time', 1, 'When', 'When did you last see a movie?', '마지막으로 영화를 본 것은 언제입니까?', 'I saw a movie last month.', '지난달에 영화를 봤습니다.'),
  q(3, 'time', 1, 'When', 'When do you usually meet your friends?', '보통 언제 친구들을 만납니까?', 'I meet my friends on weekends.', '저는 주말에 친구들을 만납니다.'),
  q(3, 'time', 1, 'What time', 'What time do you usually go to bed?', '보통 몇 시에 잠자리에 듭니까?', 'I go to bed at eleven.', '저는 11시에 잠자리에 듭니다.'),
  q(3, 'time', 2, 'When', 'When do you use your phone the most?', '휴대폰을 가장 많이 사용하는 때는 언제입니까?', 'I use it the most at night.', '밤에 가장 많이 사용합니다.'),
  q(3, 'time', 2, 'When', 'When did you last take a trip?', '마지막으로 여행을 간 것은 언제입니까?', 'I took a trip last summer.', '지난여름에 여행을 갔습니다.'),

  // ── 장소 (place) ─────────────────────────────────────────────
  q(3, 'place', 1, 'Where', 'Where do you usually buy groceries?', '보통 어디에서 장을 봅니까?', 'I buy groceries at a supermarket near my home.', '집 근처 슈퍼마켓에서 장을 봅니다.'),
  q(3, 'place', 1, 'Where', 'Where do you usually exercise?', '보통 어디에서 운동합니까?', 'I exercise at a gym.', '저는 헬스장에서 운동합니다.'),
  q(3, 'place', 1, 'Where', 'Where do you like to meet your friends?', '친구들을 어디에서 만나는 것을 좋아합니까?', 'I like to meet them at a cafe.', '카페에서 만나는 것을 좋아합니다.'),
  q(3, 'place', 1, 'Where', 'Where do you usually study English?', '보통 어디에서 영어를 공부합니까?', 'I study English at home.', '저는 집에서 영어를 공부합니다.'),
  q(3, 'place', 1, 'Where', 'Where did you go last weekend?', '지난 주말에 어디에 갔습니까?', 'I went to a park.', '공원에 갔습니다.'),
  q(3, 'place', 1, 'Where', 'Where do you usually eat lunch?', '보통 어디에서 점심을 먹습니까?', 'I eat lunch near my office.', '회사 근처에서 점심을 먹습니다.'),
  q(3, 'place', 2, 'Where', 'Where is your favorite place in your city?', '당신의 도시에서 가장 좋아하는 장소는 어디입니까?', 'My favorite place is the river park.', '제가 가장 좋아하는 곳은 강변 공원입니다.'),
  q(3, 'place', 1, 'Where', 'Where do you usually listen to music?', '보통 어디에서 음악을 듣습니까?', 'I listen to music on the bus.', '저는 버스에서 음악을 듣습니다.'),
  q(3, 'place', 1, 'Where', 'Where do you usually shop for clothes?', '보통 어디에서 옷을 삽니까?', 'I usually shop for clothes online.', '저는 보통 온라인에서 옷을 삽니다.'),
  q(3, 'place', 2, 'Where', 'Where would you like to travel someday?', '언젠가 어디로 여행을 가고 싶습니까?', 'I would like to visit Jeju Island.', '제주도에 가 보고 싶습니다.'),

  // ── 빈도 (frequency) ─────────────────────────────────────────
  q(3, 'frequency', 1, 'How often', 'How often do you exercise?', '얼마나 자주 운동합니까?', 'I exercise three times a week.', '일주일에 세 번 운동합니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you eat out?', '얼마나 자주 외식합니까?', 'I eat out once a week.', '일주일에 한 번 외식합니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you go to the movies?', '얼마나 자주 영화관에 갑니까?', 'I go about once a month.', '한 달에 한 번 정도 갑니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you use public transportation?', '얼마나 자주 대중교통을 이용합니까?', 'I use it every day.', '매일 이용합니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you drink coffee?', '얼마나 자주 커피를 마십니까?', 'I drink coffee twice a day.', '하루에 두 번 커피를 마십니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you travel?', '얼마나 자주 여행을 갑니까?', 'I travel once or twice a year.', '일 년에 한두 번 여행을 갑니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you clean your room?', '얼마나 자주 방을 청소합니까?', 'I clean my room every weekend.', '주말마다 방을 청소합니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you shop online?', '얼마나 자주 온라인 쇼핑을 합니까?', 'I shop online two or three times a month.', '한 달에 두세 번 온라인 쇼핑을 합니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you call your family?', '얼마나 자주 가족에게 전화합니까?', 'I call my family every day.', '매일 가족에게 전화합니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you read books?', '얼마나 자주 책을 읽습니까?', 'I read books a few times a week.', '일주일에 몇 번 책을 읽습니다.'),

  // ── 이유 (reason) ────────────────────────────────────────────
  q(3, 'reason', 1, 'Why', 'Why do you exercise?', '왜 운동을 합니까?', 'I exercise to stay healthy.', '건강을 유지하기 위해 운동합니다.'),
  q(3, 'reason', 1, 'Why', 'Why do you study English?', '왜 영어를 공부합니까?', 'I study English for my job.', '일 때문에 영어를 공부합니다.'),
  q(3, 'reason', 2, 'Why', 'Why do people like online shopping?', '사람들은 왜 온라인 쇼핑을 좋아합니까?', 'Because it is fast and easy.', '빠르고 편리하기 때문입니다.'),
  q(3, 'reason', 1, 'Why', 'Why do you like your favorite restaurant?', '가장 좋아하는 식당을 왜 좋아합니까?', 'Because the food is delicious and cheap.', '음식이 맛있고 저렴하기 때문입니다.'),
  q(3, 'reason', 2, 'Why', 'Why do people use social media?', '사람들은 왜 소셜 미디어를 사용합니까?', 'To keep in touch with friends.', '친구들과 연락하기 위해서입니다.'),
  q(3, 'reason', 2, 'Why', 'Why did you choose your major?', '왜 그 전공을 선택했습니까?', 'Because I was interested in it.', '그 분야에 관심이 있었기 때문입니다.'),
  q(3, 'reason', 1, 'Why', 'Why do people drink coffee in the morning?', '사람들은 왜 아침에 커피를 마십니까?', 'To wake up.', '잠을 깨기 위해서입니다.'),
  q(3, 'reason', 1, 'Why', 'Why do you like weekends?', '왜 주말을 좋아합니까?', 'Because I can rest.', '쉴 수 있기 때문입니다.'),
  q(3, 'reason', 2, 'Why', 'Why do people travel?', '사람들은 왜 여행을 갑니까?', 'To relax and see new things.', '쉬면서 새로운 것을 보기 위해서입니다.'),
  q(3, 'reason', 1, 'Why', 'Why do you use your smartphone every day?', '왜 매일 스마트폰을 사용합니까?', 'Because it is very useful.', '매우 유용하기 때문입니다.'),

  // ── 선호 (preference) ────────────────────────────────────────
  q(3, 'preference', 1, 'What kind of ~ like', 'What kind of music do you like?', '어떤 종류의 음악을 좋아합니까?', 'I like pop music.', '저는 팝 음악을 좋아합니다.'),
  q(3, 'preference', 1, 'favorite', 'What is your favorite food?', '가장 좋아하는 음식은 무엇입니까?', 'My favorite food is pizza.', '제가 가장 좋아하는 음식은 피자입니다.'),
  q(3, 'preference', 1, 'What kind of ~ like', 'What kind of movies do you like?', '어떤 종류의 영화를 좋아합니까?', 'I like comedy movies.', '저는 코미디 영화를 좋아합니다.'),
  q(3, 'preference', 1, 'favorite', 'What is your favorite season?', '가장 좋아하는 계절은 무엇입니까?', 'My favorite season is spring.', '제가 가장 좋아하는 계절은 봄입니다.'),
  q(3, 'preference', 1, 'like to watch', 'What sports do you like to watch?', '어떤 스포츠 보는 것을 좋아합니까?', 'I like to watch soccer.', '저는 축구 보는 것을 좋아합니다.'),
  q(3, 'preference', 2, 'favorite way', 'What is your favorite way to relax?', '가장 좋아하는 휴식 방법은 무엇입니까?', 'I relax by listening to music.', '저는 음악을 들으며 쉽니다.'),
  q(3, 'preference', 1, 'What kind of ~ like', 'What kind of books do you like to read?', '어떤 종류의 책을 읽는 것을 좋아합니까?', 'I like reading novels.', '저는 소설 읽는 것을 좋아합니다.'),
  q(3, 'preference', 1, 'favorite', 'What is your favorite app on your phone?', '휴대폰에서 가장 좋아하는 앱은 무엇입니까?', 'My favorite app is a music app.', '제가 가장 좋아하는 앱은 음악 앱입니다.'),
  q(3, 'preference', 1, 'favorite', 'What is your favorite drink?', '가장 좋아하는 음료는 무엇입니까?', 'My favorite drink is iced coffee.', '제가 가장 좋아하는 음료는 아이스커피입니다.'),
  q(3, 'preference', 1, 'What kind of ~ like', 'What kind of TV shows do you like?', '어떤 종류의 TV 프로그램을 좋아합니까?', 'I like cooking shows.', '저는 요리 프로그램을 좋아합니다.'),

  // ── 경험 (experience) ────────────────────────────────────────
  q(3, 'experience', 1, 'Have you ever', 'Have you ever traveled abroad?', '해외여행을 해 본 적이 있습니까?', 'Yes, I have been to Japan.', '네, 일본에 가 본 적이 있습니다.'),
  q(3, 'experience', 1, 'Have you ever', 'Have you ever cooked for your family?', '가족을 위해 요리해 본 적이 있습니까?', 'Yes, I made dinner last week.', '네, 지난주에 저녁을 만들었습니다.'),
  q(3, 'experience', 1, 'Have you ever', 'Have you ever taken an online class?', '온라인 수업을 들어 본 적이 있습니까?', 'Yes, I took one last year.', '네, 작년에 하나 들었습니다.'),
  q(3, 'experience', 1, 'Have you ever', 'Have you ever lost your phone?', '휴대폰을 잃어버린 적이 있습니까?', 'No, I have never lost my phone.', '아니요, 잃어버린 적이 없습니다.'),
  q(3, 'experience', 2, 'Have you ever', 'Have you ever run in a race?', '달리기 대회에 나가 본 적이 있습니까?', 'No, but I want to try someday.', '아니요, 하지만 언젠가 해 보고 싶습니다.'),
  q(3, 'experience', 1, 'Have you ever', 'Have you ever worked part-time?', '아르바이트를 해 본 적이 있습니까?', 'Yes, I worked at a cafe.', '네, 카페에서 일했습니다.'),
  q(3, 'experience', 1, 'Have you ever', 'Have you ever been camping?', '캠핑을 가 본 적이 있습니까?', 'Yes, I went camping last fall.', '네, 지난가을에 캠핑을 갔습니다.'),
  q(3, 'experience', 1, 'Have you ever', 'Have you ever met a famous person?', '유명한 사람을 만나 본 적이 있습니까?', 'No, I have not.', '아니요, 없습니다.'),
  q(3, 'experience', 2, 'Have you ever', 'Have you ever moved to a new city?', '새로운 도시로 이사해 본 적이 있습니까?', 'Yes, I moved two years ago.', '네, 2년 전에 이사했습니다.'),
  q(3, 'experience', 2, 'Have you ever', 'Have you ever returned something you bought online?', '온라인에서 산 물건을 반품해 본 적이 있습니까?', 'Yes, I returned some shoes.', '네, 신발을 반품한 적이 있습니다.'),

  // ── 사람 (person) ────────────────────────────────────────────
  q(3, 'person', 1, 'Who', 'Who do you usually eat lunch with?', '보통 누구와 점심을 먹습니까?', 'I eat lunch with my coworkers.', '동료들과 점심을 먹습니다.'),
  q(3, 'person', 1, 'Who', 'Who taught you to cook?', '누가 요리를 가르쳐 주었습니까?', 'My mother taught me.', '어머니가 가르쳐 주셨습니다.'),
  q(3, 'person', 1, 'Who', 'Who do you usually go shopping with?', '보통 누구와 쇼핑을 갑니까?', 'I go shopping with my friend.', '친구와 쇼핑을 갑니다.'),
  q(3, 'person', 1, 'Who', 'Who do you call when you have a problem?', '문제가 있을 때 누구에게 전화합니까?', 'I call my best friend.', '가장 친한 친구에게 전화합니다.'),
  q(3, 'person', 1, 'Who', 'Who do you usually exercise with?', '보통 누구와 운동합니까?', 'I usually exercise alone.', '저는 보통 혼자 운동합니다.'),
  q(3, 'person', 1, 'Who', 'Who in your family do you talk to the most?', '가족 중 누구와 가장 많이 이야기합니까?', 'I talk to my sister the most.', '언니(누나/여동생)와 가장 많이 이야기합니다.'),
  q(3, 'person', 1, 'Who', 'Who do you usually watch movies with?', '보통 누구와 영화를 봅니까?', 'I watch movies with my friends.', '친구들과 영화를 봅니다.'),
  q(3, 'person', 2, 'Who', 'Who helps you the most at work?', '직장에서 누가 가장 많이 도와줍니까?', 'My team leader helps me the most.', '팀장님이 가장 많이 도와주십니다.'),
  q(3, 'person', 1, 'Who', 'Who do you usually spend weekends with?', '보통 누구와 주말을 보냅니까?', 'I spend weekends with my family.', '가족과 주말을 보냅니다.'),
  q(3, 'person', 1, 'Who', 'Who cooks at your home?', '집에서 누가 요리를 합니까?', 'My father usually cooks.', '보통 아버지가 요리를 하십니다.'),

  // ── 행동 (action) ────────────────────────────────────────────
  q(3, 'action', 1, 'What do you do', 'What do you usually do on weekends?', '주말에 보통 무엇을 합니까?', 'I usually exercise at home.', '저는 보통 집에서 운동합니다.'),
  q(3, 'action', 1, 'What do you do', 'What do you usually do after work?', '퇴근 후에 보통 무엇을 합니까?', 'I watch TV and rest.', 'TV를 보며 쉽니다.'),
  q(3, 'action', 1, 'What do you do', 'What do you do in your free time?', '여가 시간에 무엇을 합니까?', 'I listen to music.', '음악을 듣습니다.'),
  q(3, 'action', 1, 'What do you do', 'What do you usually do in the morning?', '아침에 보통 무엇을 합니까?', 'I drink coffee and check my phone.', '커피를 마시고 휴대폰을 확인합니다.'),
  q(3, 'action', 1, 'What did you do', 'What did you do last night?', '어젯밤에 무엇을 했습니까?', 'I had dinner and watched a movie.', '저녁을 먹고 영화를 봤습니다.'),
  q(3, 'action', 1, 'What do you do', 'What do you usually do on the subway?', '지하철에서 보통 무엇을 합니까?', 'I listen to music on the subway.', '지하철에서 음악을 듣습니다.'),
  q(3, 'action', 2, 'What do you do', 'What do you do when you feel stressed?', '스트레스를 받을 때 무엇을 합니까?', 'I take a walk.', '산책을 합니다.'),
  q(3, 'action', 1, 'What do you do', 'What do you usually do during lunch time?', '점심시간에 보통 무엇을 합니까?', 'I eat and take a short walk.', '밥을 먹고 잠깐 산책합니다.'),
  q(3, 'action', 2, 'What are you going to do', 'What are you going to do this weekend?', '이번 주말에 무엇을 할 예정입니까?', 'I am going to meet my friends.', '친구들을 만날 예정입니다.'),
  q(3, 'action', 1, 'What do you do', 'What do you usually do before going to bed?', '자기 전에 보통 무엇을 합니까?', 'I usually watch short videos.', '저는 보통 짧은 영상을 봅니다.'),

  // ── 선택 (choice, Part 5) — 60초 IL 수준 모범답변 ────────────
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, shopping online or shopping in stores?', '온라인 쇼핑과 매장 쇼핑 중 무엇을 더 선호합니까?', 'I prefer shopping online. I have two reasons. First, it is very convenient. I can shop anytime, even late at night, and the items come to my door. Second, it is easy to compare prices. For example, last month I bought a bag online, and I found the same bag at a lower price in just five minutes. Shopping in stores takes too much time. For these reasons, I prefer shopping online.', '저는 온라인 쇼핑을 선호합니다. 두 가지 이유가 있습니다. 첫째, 매우 편리합니다. 늦은 밤에도 언제든 쇼핑할 수 있고 물건이 집까지 옵니다. 둘째, 가격 비교가 쉽습니다. 예를 들어 지난달에 온라인에서 가방을 샀는데, 단 5분 만에 같은 가방을 더 싼 가격에 찾았습니다. 매장 쇼핑은 시간이 너무 많이 걸립니다. 이런 이유로 저는 온라인 쇼핑을 선호합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, watching movies at home or at a theater?', '집에서 영화 보기와 영화관에서 보기 중 무엇을 더 선호합니까?', 'I prefer watching movies at home. I have two reasons. First, it is very comfortable. I can sit on my sofa, wear comfortable clothes, and stop the movie anytime I want. Second, it saves money. Movie tickets and popcorn are expensive these days. For example, last weekend I watched two movies at home for free. Also, there are no noisy people around me. For these reasons, I prefer watching movies at home.', '저는 집에서 영화 보는 것을 선호합니다. 두 가지 이유가 있습니다. 첫째, 매우 편안합니다. 소파에 앉아 편한 옷을 입고, 원할 때 언제든 영화를 멈출 수 있습니다. 둘째, 돈이 절약됩니다. 요즘 영화표와 팝콘은 비쌉니다. 예를 들어 지난 주말에는 집에서 공짜로 영화 두 편을 봤습니다. 또 주변에 시끄러운 사람도 없습니다. 이런 이유로 저는 집에서 영화 보는 것을 선호합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer coffee or tea?', '커피와 차 중 무엇을 더 좋아합니까?', 'I prefer coffee. I have two reasons. First, coffee wakes me up. I feel very tired in the morning, but after one cup of coffee, I can focus on my work. Second, I love the smell and taste of coffee. For example, I meet my friends at a coffee shop every weekend, and we enjoy talking with a nice cup of coffee. Tea is too weak for me. For these reasons, I prefer coffee.', '저는 커피를 선호합니다. 두 가지 이유가 있습니다. 첫째, 커피는 잠을 깨워 줍니다. 아침에 많이 피곤하지만 커피 한 잔을 마시면 일에 집중할 수 있습니다. 둘째, 커피의 향과 맛을 아주 좋아합니다. 예를 들어 주말마다 친구들을 커피숍에서 만나는데, 맛있는 커피와 함께 이야기하는 시간이 즐겁습니다. 차는 저에게 너무 약합니다. 이런 이유로 저는 커피를 선호합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer texting or calling?', '문자와 전화 중 무엇을 더 좋아합니까?', 'I prefer texting. I have two reasons. First, texting is quick and easy. I can send a message anywhere, even on the subway or in a meeting. Second, I can keep the messages. For example, when my friend sends me an address, I can check it again later. With a phone call, I sometimes forget important things. For these reasons, I prefer texting.', '저는 문자를 선호합니다. 두 가지 이유가 있습니다. 첫째, 문자는 빠르고 쉽습니다. 지하철이나 회의 중에도 어디서든 메시지를 보낼 수 있습니다. 둘째, 메시지를 보관할 수 있습니다. 예를 들어 친구가 주소를 보내 주면 나중에 다시 확인할 수 있습니다. 전화 통화는 중요한 내용을 가끔 잊어버립니다. 이런 이유로 저는 문자를 선호합니다.'),
  q(5, 'choice', 2, 'Do you prefer A or B', 'Do you prefer working alone or working with a team?', '혼자 일하기와 팀으로 일하기 중 무엇을 더 선호합니까?', 'I prefer working with a team. I have two reasons. First, we can share ideas. When I work alone, I sometimes cannot find a good answer, but my team members often have fresh ideas. Second, we can help each other. For example, last month I had too much work, and my team helped me finish it on time. Working together also makes the office more fun. For these reasons, I prefer working with a team.', '저는 팀으로 일하는 것을 선호합니다. 두 가지 이유가 있습니다. 첫째, 아이디어를 나눌 수 있습니다. 혼자 일하면 좋은 답이 안 떠오를 때가 있는데, 팀 동료들은 신선한 아이디어를 자주 냅니다. 둘째, 서로 도울 수 있습니다. 예를 들어 지난달에 일이 너무 많았는데 팀이 도와줘서 제시간에 끝냈습니다. 함께 일하면 사무실 분위기도 더 즐겁습니다. 이런 이유로 저는 팀으로 일하는 것을 선호합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, eating out or cooking at home?', '외식과 집에서 요리하기 중 무엇을 더 선호합니까?', 'I prefer cooking at home. I have two reasons. First, it is much cheaper. The price of one meal at a restaurant is the same as three meals at home. Second, it is healthier. I can use fresh vegetables and less salt and oil. For example, I started cooking dinner last year, and I feel much healthier now. Cooking is also a fun hobby for me. For these reasons, I prefer cooking at home.', '저는 집에서 요리하는 것을 선호합니다. 두 가지 이유가 있습니다. 첫째, 훨씬 저렴합니다. 식당 한 끼 가격이면 집에서 세 끼를 먹을 수 있습니다. 둘째, 더 건강합니다. 신선한 채소를 쓰고 소금과 기름을 줄일 수 있습니다. 예를 들어 작년부터 저녁을 직접 만들기 시작했는데 지금 훨씬 건강해진 것을 느낍니다. 요리는 저에게 재미있는 취미이기도 합니다. 이런 이유로 저는 집에서 요리하는 것을 선호합니다.'),
  q(5, 'choice', 2, 'Do you prefer A or B', 'Do you prefer traveling alone or traveling with friends?', '혼자 여행과 친구와 여행 중 무엇을 더 좋아합니까?', 'I prefer traveling with friends. I have two reasons. First, it is more fun. We can talk, take pictures together, and enjoy delicious food together. Second, it is safer and cheaper. We can share the hotel room and taxi costs, and we can help each other in a new place. For example, last summer I went to the beach with two friends, and it was the best trip of my life. For these reasons, I prefer traveling with friends.', '저는 친구와 여행하는 것을 선호합니다. 두 가지 이유가 있습니다. 첫째, 더 재미있습니다. 함께 이야기하고 사진을 찍고 맛있는 음식을 즐길 수 있습니다. 둘째, 더 안전하고 저렴합니다. 호텔비와 택시비를 나눌 수 있고 낯선 곳에서 서로 도울 수 있습니다. 예를 들어 지난여름에 친구 두 명과 바다에 갔는데 인생 최고의 여행이었습니다. 이런 이유로 저는 친구와 여행하는 것을 선호합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, paper books or e-books?', '종이책과 전자책 중 무엇을 더 선호합니까?', 'I prefer e-books. I have two reasons. First, they are easy to carry. I can keep one hundred books in my phone and read them anywhere, even on the subway. Second, buying e-books is fast and cheap. For example, last night I wanted a new novel, and I bought it in one minute without going to a bookstore. Paper books are heavy and take up space. For these reasons, I prefer e-books.', '저는 전자책을 선호합니다. 두 가지 이유가 있습니다. 첫째, 들고 다니기 쉽습니다. 휴대폰에 책 백 권을 넣고 지하철에서도 어디서든 읽을 수 있습니다. 둘째, 전자책은 사기 빠르고 저렴합니다. 예를 들어 어젯밤에 새 소설이 읽고 싶었는데 서점에 가지 않고 1분 만에 샀습니다. 종이책은 무겁고 자리를 차지합니다. 이런 이유로 저는 전자책을 선호합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer morning exercise or evening exercise?', '아침 운동과 저녁 운동 중 무엇을 더 좋아합니까?', 'I prefer evening exercise. I have two reasons. First, I have more time in the evening. In the morning, I am always busy getting ready for work, so I cannot exercise enough. Second, evening exercise helps me relieve stress. For example, after a hard day at work, I run for thirty minutes, and all my stress goes away. I can also sleep better at night. For these reasons, I prefer evening exercise.', '저는 저녁 운동을 선호합니다. 두 가지 이유가 있습니다. 첫째, 저녁에 시간이 더 많습니다. 아침에는 출근 준비로 항상 바빠서 충분히 운동할 수 없습니다. 둘째, 저녁 운동은 스트레스 해소에 도움이 됩니다. 예를 들어 힘든 하루를 보낸 뒤 30분을 달리면 스트레스가 모두 사라집니다. 밤에 잠도 더 잘 옵니다. 이런 이유로 저는 저녁 운동을 선호합니다.'),
  q(5, 'choice', 3, 'Which do you prefer, A or B', 'Which do you prefer, living in a city or living in the countryside?', '도시 생활과 시골 생활 중 무엇을 더 선호합니까?', 'I prefer living in a city. I have two reasons. First, a city is very convenient. There are many stores, hospitals, and subway stations near my home, so I can do everything quickly. Second, there are more things to enjoy. For example, I can watch movies, visit museums, and try new restaurants every weekend. There are also more jobs in a city. For these reasons, I prefer living in a city.', '저는 도시에 사는 것을 선호합니다. 두 가지 이유가 있습니다. 첫째, 도시는 매우 편리합니다. 집 근처에 상점, 병원, 지하철역이 많아서 모든 일을 빨리 할 수 있습니다. 둘째, 즐길 거리가 더 많습니다. 예를 들어 주말마다 영화를 보고 박물관에 가고 새로운 식당에 가 볼 수 있습니다. 도시에는 일자리도 더 많습니다. 이런 이유로 저는 도시에 사는 것을 선호합니다.'),

  // ── 의견/장단점 (opinion, Part 5) — 60초 IL 수준 모범답변 ────
  q(5, 'opinion', 2, 'Do you think', 'Do you think students should wear school uniforms?', '학생들이 교복을 입어야 한다고 생각합니까?', 'Yes, I think students should wear school uniforms. I have two reasons. First, uniforms save time and money. Students do not have to worry about what to wear every morning, and parents do not need to buy many clothes. Second, uniforms make students equal. Nobody can compare expensive clothes, so students can focus on studying. For example, I wore a uniform in high school, and it made my school life simple. For these reasons, I agree with school uniforms.', '네, 학생들이 교복을 입어야 한다고 생각합니다. 두 가지 이유가 있습니다. 첫째, 교복은 시간과 돈을 아껴 줍니다. 학생은 매일 아침 무엇을 입을지 고민하지 않아도 되고, 부모는 옷을 많이 사 줄 필요가 없습니다. 둘째, 교복은 학생들을 평등하게 만듭니다. 비싼 옷을 비교할 수 없어서 공부에 집중할 수 있습니다. 예를 들어 저는 고등학교 때 교복을 입었는데 학교생활이 단순해졌습니다. 이런 이유로 저는 교복에 찬성합니다.'),
  q(5, 'opinion', 2, 'advantages', 'What are the advantages of working from home?', '재택근무의 장점은 무엇입니까?', 'I think working from home has two big advantages. First, we can save commuting time. For example, my friend saves two hours every day, and she uses that time for exercise and hobbies. Second, we can work in a comfortable place. There is no noise from the office, so we can focus better. We can also spend more time with our family. For these reasons, I think working from home is very good for workers.', '재택근무에는 두 가지 큰 장점이 있다고 생각합니다. 첫째, 출퇴근 시간을 아낄 수 있습니다. 예를 들어 제 친구는 매일 두 시간을 아껴서 그 시간을 운동과 취미에 씁니다. 둘째, 편안한 곳에서 일할 수 있습니다. 사무실 소음이 없어서 더 잘 집중할 수 있습니다. 가족과 더 많은 시간을 보낼 수도 있습니다. 이런 이유로 재택근무는 직장인에게 매우 좋다고 생각합니다.'),
  q(5, 'opinion', 3, 'Do you agree', 'Do you agree that smartphones are good for children?', '스마트폰이 아이들에게 좋다는 것에 동의합니까?', 'No, I do not agree that smartphones are good for children. I have two reasons. First, too much screen time is bad for their eyes and sleep. Many children watch videos late at night. Second, children need to play outside and meet real friends. For example, my nephew played phone games all day, and he became less active and less healthy. Smartphone games are also easy to become addicted to. For these reasons, I do not agree.', '아니요, 스마트폰이 아이들에게 좋다는 것에 동의하지 않습니다. 두 가지 이유가 있습니다. 첫째, 긴 화면 시간은 눈과 수면에 나쁩니다. 많은 아이들이 늦은 밤까지 영상을 봅니다. 둘째, 아이들은 밖에서 놀고 진짜 친구를 만나야 합니다. 예를 들어 제 조카는 하루 종일 폰 게임을 했는데 활동량이 줄고 건강도 나빠졌습니다. 스마트폰 게임은 중독되기도 쉽습니다. 이런 이유로 저는 동의하지 않습니다.'),
  q(5, 'opinion', 2, 'disadvantages', 'What are the disadvantages of living in a big city?', '대도시 생활의 단점은 무엇입니까?', 'I think living in a big city has two big disadvantages. First, it is too crowded. For example, the subway is full of people every morning, so going to work is very tiring. Second, everything is expensive. House prices are especially high, so it is hard to buy a home. The air is also not clean, and the streets are noisy. For these reasons, living in a big city can be stressful.', '대도시 생활에는 두 가지 큰 단점이 있다고 생각합니다. 첫째, 너무 붐빕니다. 예를 들어 매일 아침 지하철이 사람으로 가득 차서 출근이 매우 피곤합니다. 둘째, 모든 것이 비쌉니다. 특히 집값이 높아서 집을 사기 어렵습니다. 공기도 깨끗하지 않고 거리도 시끄럽습니다. 이런 이유로 대도시 생활은 스트레스가 될 수 있습니다.'),
  q(5, 'opinion', 1, 'Do you think', 'Do you think exercise is important?', '운동이 중요하다고 생각합니까?', 'Yes, I think exercise is very important. I have two reasons. First, exercise keeps our body healthy. It makes our heart strong, and we get sick less often. Second, exercise is good for our mind. For example, I walk for thirty minutes every evening, and it takes away my stress and helps me sleep well. Exercise also gives me energy for the next day. For these reasons, I think exercise is important for everyone.', '네, 운동은 매우 중요하다고 생각합니다. 두 가지 이유가 있습니다. 첫째, 운동은 몸을 건강하게 지켜 줍니다. 심장을 튼튼하게 하고 병에 덜 걸리게 합니다. 둘째, 운동은 마음에도 좋습니다. 예를 들어 저는 매일 저녁 30분씩 걷는데 스트레스가 사라지고 잠도 잘 옵니다. 운동은 다음 날을 위한 에너지도 줍니다. 이런 이유로 운동은 모두에게 중요하다고 생각합니다.'),
  q(5, 'opinion', 2, 'advantages', 'What are the advantages of online classes?', '온라인 수업의 장점은 무엇입니까?', 'I think online classes have two big advantages. First, we can study anywhere and anytime. For example, busy workers can take a class at night at home, and they can watch the lecture again when it is difficult. Second, online classes save money and time. We do not have to travel to school, and the classes are usually cheaper. For these reasons, I think online classes are very useful for many people.', '온라인 수업에는 두 가지 큰 장점이 있다고 생각합니다. 첫째, 언제 어디서나 공부할 수 있습니다. 예를 들어 바쁜 직장인은 밤에 집에서 수업을 들을 수 있고, 어려운 부분은 강의를 다시 볼 수 있습니다. 둘째, 온라인 수업은 돈과 시간을 아껴 줍니다. 학교까지 갈 필요가 없고 수업료도 보통 더 저렴합니다. 이런 이유로 온라인 수업은 많은 사람에게 매우 유용하다고 생각합니다.'),
  q(5, 'opinion', 2, 'Do you agree', 'Do you agree that people should take a vacation every year?', '사람들이 매년 휴가를 가야 한다는 것에 동의합니까?', 'Yes, I agree that people should take a vacation every year. I have two reasons. First, rest gives us new energy. After a good vacation, we can focus better and work harder. Second, a vacation gives us special time with family. For example, last year I traveled with my parents, and we still talk about those happy memories. Working without rest makes people sick and tired. For these reasons, I agree.', '네, 사람들이 매년 휴가를 가야 한다는 것에 동의합니다. 두 가지 이유가 있습니다. 첫째, 휴식은 새로운 에너지를 줍니다. 좋은 휴가 후에는 더 잘 집중하고 더 열심히 일할 수 있습니다. 둘째, 휴가는 가족과의 특별한 시간을 줍니다. 예를 들어 작년에 부모님과 여행을 갔는데 지금도 그 행복한 추억을 이야기합니다. 쉬지 않고 일하면 병이 나고 지칩니다. 이런 이유로 저는 동의합니다.'),
  q(5, 'opinion', 3, 'Do you think', 'Do you think it is better to save money or to enjoy it now?', '돈을 모으는 것과 지금 쓰는 것 중 무엇이 더 낫다고 생각합니까?', 'I think saving money is better. I have two reasons. First, the future is uncertain. We may suddenly need money for a hospital visit or for losing a job. Saving money makes me feel safe. Second, we need money for big goals. For example, I am saving money every month to buy my own house someday. Of course, small spending for fun is okay, but saving should come first. For these reasons, I think saving money is better.', '저는 돈을 모으는 것이 더 낫다고 생각합니다. 두 가지 이유가 있습니다. 첫째, 미래는 알 수 없습니다. 병원비나 실직으로 갑자기 돈이 필요할 수 있습니다. 저축은 저를 안심하게 합니다. 둘째, 큰 목표에는 돈이 필요합니다. 예를 들어 저는 언젠가 제 집을 사려고 매달 저축하고 있습니다. 물론 즐거움을 위한 작은 지출은 괜찮지만 저축이 먼저여야 합니다. 이런 이유로 저축이 더 낫다고 생각합니다.'),
  q(5, 'opinion', 2, 'disadvantages', 'What are the disadvantages of social media?', '소셜 미디어의 단점은 무엇입니까?', 'I think social media has two big disadvantages. First, it wastes a lot of time. For example, I sometimes check my phone for two hours without knowing it, and then I have no time for important things. Second, it can cause stress. People compare their lives with others and feel unhappy. There is also a lot of fake news on social media. For these reasons, I think we should use social media carefully.', '소셜 미디어에는 두 가지 큰 단점이 있다고 생각합니다. 첫째, 시간을 많이 낭비하게 합니다. 예를 들어 저도 모르게 두 시간씩 휴대폰을 볼 때가 있는데, 그러면 중요한 일을 할 시간이 없어집니다. 둘째, 스트레스를 줄 수 있습니다. 사람들은 자기 삶을 남과 비교하며 불행해집니다. 소셜 미디어에는 가짜 뉴스도 많습니다. 이런 이유로 소셜 미디어는 조심해서 써야 한다고 생각합니다.'),
  q(5, 'opinion', 1, 'Do you think', 'Do you think pets are good for families?', '반려동물이 가족에게 좋다고 생각합니까?', 'Yes, I think pets are good for families. I have two reasons. First, pets make people happy. When I come home tired, my dog runs to me, and I forget all my stress. Second, pets teach children responsibility. For example, my niece feeds her cat and cleans its house every day, and she has become more careful and kind. A pet is like a family member. For these reasons, I think pets are good for families.', '네, 반려동물은 가족에게 좋다고 생각합니다. 두 가지 이유가 있습니다. 첫째, 반려동물은 사람을 행복하게 합니다. 지쳐서 집에 오면 강아지가 달려오는데 그러면 스트레스를 모두 잊습니다. 둘째, 반려동물은 아이들에게 책임감을 가르칩니다. 예를 들어 제 조카는 매일 고양이 밥을 주고 집을 치우는데 더 세심하고 다정한 아이가 되었습니다. 반려동물은 가족과 같습니다. 이런 이유로 반려동물은 가족에게 좋다고 생각합니다.'),

  // ── 일정/정보확인 (schedule, Part 4) ─────────────────────────
  q(4, 'schedule', 2, 'What time / Where', 'What time does the conference start, and where is it held?', '회의는 몇 시에 시작하고 어디에서 열립니까?', 'It starts at 9 a.m. in the Grand Hall.', '오전 9시에 그랜드 홀에서 시작합니다.'),
  q(4, 'schedule', 2, 'Who / What topic', 'Who is the first speaker, and what is the topic?', '첫 번째 발표자는 누구이고 주제는 무엇입니까?', 'Ms. Kim will speak about marketing.', '김 선생님이 마케팅에 대해 발표합니다.'),
  q(4, 'schedule', 1, 'How much', 'How much is the registration fee?', '등록비는 얼마입니까?', 'It is thirty dollars.', '30달러입니다.'),
  q(4, 'schedule', 1, 'When', 'When is the lunch break?', '점심시간은 언제입니까?', 'It is from noon to 1 p.m.', '정오부터 오후 1시까지입니다.'),
  q(4, 'schedule', 3, 'Is that right?', 'I heard the workshop is on Friday. Is that right?', '워크숍이 금요일이라고 들었는데, 맞습니까?', 'Actually, it is on Thursday.', '사실은 목요일입니다.'),
  q(4, 'schedule', 2, 'Where', 'Where will the closing session take place?', '폐회 세션은 어디에서 열립니까?', 'It will take place in Room 201.', '201호에서 열립니다.'),
  q(4, 'schedule', 2, 'How long', 'How long is the training session?', '교육 세션은 얼마나 걸립니까?', 'It is two hours, from 2 to 4 p.m.', '오후 2시부터 4시까지 두 시간입니다.'),
  q(4, 'schedule', 2, 'Is there', 'Is there a session about time management?', '시간 관리에 관한 세션이 있습니까?', 'Yes, there is one at 3 p.m.', '네, 오후 3시에 하나 있습니다.'),
  q(4, 'schedule', 2, 'What should I bring', 'What should I bring to the seminar?', '세미나에 무엇을 가져가야 합니까?', 'You should bring your laptop.', '노트북을 가져오셔야 합니다.'),
  q(4, 'schedule', 3, 'Could you tell me who', 'Could you tell me who is leading the afternoon session?', '오후 세션은 누가 진행하는지 알려 주시겠습니까?', 'Mr. Lee is leading it.', '이 선생님이 진행합니다.'),

  // ── 추가 문항 (Part 3) ──────────────────────────────────────
  q(3, 'time', 1, 'When', 'When do you usually check your email?', '보통 언제 이메일을 확인합니까?', 'I check it in the morning.', '아침에 확인합니다.'),
  q(3, 'time', 2, 'When', 'When was the last time you visited a park?', '마지막으로 공원에 간 것은 언제입니까?', 'I visited one last Sunday.', '지난 일요일에 갔습니다.'),
  q(3, 'time', 1, 'What time', 'What time do you usually leave home?', '보통 몇 시에 집에서 나갑니까?', 'I leave home at eight.', '8시에 집에서 나갑니다.'),
  q(3, 'place', 1, 'Where', 'Where do you usually drink coffee?', '보통 어디에서 커피를 마십니까?', 'I drink coffee at a cafe nearby.', '근처 카페에서 커피를 마십니다.'),
  q(3, 'place', 1, 'Where', 'Where did you eat dinner yesterday?', '어제 어디에서 저녁을 먹었습니까?', 'I ate dinner at home.', '집에서 저녁을 먹었습니다.'),
  q(3, 'place', 1, 'Where', 'Where do you keep your phone at night?', '밤에 휴대폰을 어디에 둡니까?', 'I keep it next to my bed.', '침대 옆에 둡니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you watch videos online?', '얼마나 자주 온라인 영상을 봅니까?', 'I watch them every day.', '매일 봅니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you buy coffee at a cafe?', '얼마나 자주 카페에서 커피를 삽니까?', 'About three times a week.', '일주일에 세 번 정도입니다.'),
  q(3, 'frequency', 1, 'How often', 'How often do you take a taxi?', '얼마나 자주 택시를 탑니까?', 'Only once or twice a month.', '한 달에 한두 번뿐입니다.'),
  q(3, 'reason', 1, 'Why', 'Why do you like listening to music?', '왜 음악 듣는 것을 좋아합니까?', 'Because it makes me feel good.', '기분이 좋아지기 때문입니다.'),
  q(3, 'reason', 2, 'Why', 'Why do people exercise at a gym?', '사람들은 왜 헬스장에서 운동합니까?', 'Because they can use many machines.', '다양한 기구를 사용할 수 있기 때문입니다.'),
  q(3, 'reason', 1, 'Why', 'Why do you like your neighborhood?', '왜 당신의 동네를 좋아합니까?', 'Because it is quiet and safe.', '조용하고 안전하기 때문입니다.'),
  q(3, 'preference', 1, 'favorite', 'What is your favorite day of the week?', '일주일 중 가장 좋아하는 요일은 무엇입니까?', 'My favorite day is Saturday.', '가장 좋아하는 요일은 토요일입니다.'),
  q(3, 'preference', 1, 'What kind of ~ like', 'What kind of weather do you like?', '어떤 날씨를 좋아합니까?', 'I like sunny weather.', '맑은 날씨를 좋아합니다.'),
  q(3, 'experience', 2, 'Have you ever', 'Have you ever tried a new sport?', '새로운 운동을 시도해 본 적이 있습니까?', 'Yes, I tried swimming last year.', '네, 작년에 수영을 해 봤습니다.'),
  q(3, 'experience', 1, 'Have you ever', 'Have you ever ordered food late at night?', '늦은 밤에 음식을 주문해 본 적이 있습니까?', 'Yes, I have, many times.', '네, 여러 번 있습니다.'),
  q(3, 'person', 1, 'Who', 'Who do you usually have dinner with?', '보통 누구와 저녁을 먹습니까?', 'I have dinner with my family.', '가족과 저녁을 먹습니다.'),
  q(3, 'person', 1, 'Who', 'Who do you text the most?', '누구에게 문자를 가장 많이 보냅니까?', 'I text my best friend the most.', '가장 친한 친구에게 가장 많이 보냅니다.'),
  q(3, 'action', 1, 'What do you do', 'What do you usually do on Sunday mornings?', '일요일 아침에 보통 무엇을 합니까?', 'I sleep late and relax.', '늦잠을 자고 쉽니다.'),
  q(3, 'action', 1, 'What do you do', 'What do you do first when you get home?', '집에 오면 가장 먼저 무엇을 합니까?', 'I wash my hands and change clothes.', '손을 씻고 옷을 갈아입습니다.'),

  // ── 추가 문항 (Part 4 — 일정/정보확인) ──────────────────────
  q(4, 'schedule', 1, 'What time', 'What time does the first class begin?', '첫 수업은 몇 시에 시작합니까?', 'It begins at 10 a.m.', '오전 10시에 시작합니다.'),
  q(4, 'schedule', 1, 'Where', 'Where will the staff meeting be held?', '직원 회의는 어디에서 열립니까?', 'It will be held in Meeting Room A.', '회의실 A에서 열립니다.'),
  q(4, 'schedule', 2, 'How much', 'How much does the full-day workshop cost?', '종일 워크숍 비용은 얼마입니까?', 'It costs fifty dollars.', '50달러입니다.'),
  q(4, 'schedule', 1, 'When', 'When does the museum tour end?', '박물관 투어는 언제 끝납니까?', 'It ends at 5 p.m.', '오후 5시에 끝납니다.'),
  q(4, 'schedule', 2, 'Who', 'Who is giving the presentation on sales?', '영업에 관한 발표는 누가 합니까?', 'Ms. Park is giving it.', '박 선생님이 합니다.'),
  q(4, 'schedule', 3, 'Is that correct?', 'I heard the seminar starts at 10. Is that correct?', '세미나가 10시에 시작한다고 들었는데, 맞습니까?', 'Actually, it starts at 9:30.', '사실은 9시 30분에 시작합니다.'),
  q(4, 'schedule', 1, 'How long', 'How long is the lunch meeting?', '점심 회의는 얼마나 걸립니까?', 'It is one hour.', '한 시간입니다.'),
  q(4, 'schedule', 2, 'Is there', 'Is there a break between the sessions?', '세션 사이에 휴식 시간이 있습니까?', 'Yes, there is a 15-minute break.', '네, 15분 휴식이 있습니다.'),
  q(4, 'schedule', 2, 'What is the last', 'What is the last event of the day?', '그날 마지막 행사는 무엇입니까?', 'It is the closing speech.', '폐회사입니다.'),
  q(4, 'schedule', 3, 'Could you tell me when', 'Could you tell me when the bus leaves for the hotel?', '호텔로 가는 버스가 언제 출발하는지 알려 주시겠습니까?', 'It leaves at 6 p.m.', '오후 6시에 출발합니다.'),
  q(4, 'schedule', 1, 'What time', 'What time does registration open?', '등록은 몇 시에 시작합니까?', 'It opens at 8:30 a.m.', '오전 8시 30분에 시작합니다.'),
  q(4, 'schedule', 2, 'Where', 'Where can I pick up my name tag?', '이름표는 어디에서 받을 수 있습니까?', 'You can pick it up at the front desk.', '안내 데스크에서 받을 수 있습니다.'),
  q(4, 'schedule', 2, 'Who', 'Who should I contact if I have questions?', '질문이 있으면 누구에게 연락해야 합니까?', 'You can contact Mr. Choi.', '최 선생님에게 연락하시면 됩니다.'),
  q(4, 'schedule', 2, 'Is ~ included', 'Is lunch included in the program?', '프로그램에 점심이 포함되어 있습니까?', 'Yes, lunch is included.', '네, 점심이 포함되어 있습니다.'),
  q(4, 'schedule', 3, 'Is that right?', 'I heard the interview is at 2 p.m. Is that right?', '면접이 오후 2시라고 들었는데, 맞습니까?', 'Actually, it is at 3 p.m.', '사실은 오후 3시입니다.'),
  q(4, 'schedule', 2, 'How many', 'How many sessions are there in the morning?', '오전에 세션이 몇 개 있습니까?', 'There are three sessions.', '세 개 있습니다.'),
  q(4, 'schedule', 2, 'When', 'When is the deadline for registration?', '등록 마감일은 언제입니까?', 'It is this Friday.', '이번 주 금요일입니다.'),
  q(4, 'schedule', 3, 'What topic', 'What topic will be covered in the final session?', '마지막 세션에서는 어떤 주제를 다룹니까?', 'It will cover customer service.', '고객 서비스를 다룹니다.'),
  q(4, 'schedule', 2, 'Could you tell me where', 'Could you tell me where the parking area is?', '주차장이 어디인지 알려 주시겠습니까?', 'It is behind the main building.', '본관 뒤에 있습니다.'),
  q(4, 'schedule', 3, 'Is ~ the same', 'Is the schedule the same on both days?', '이틀 모두 일정이 같습니까?', 'No, the second day ends earlier.', '아니요, 둘째 날은 더 일찍 끝납니다.'),

  // ── 추가 문항 (Part 5 — 선택, 60초 IL 모범답변) ──────────────
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, studying in the morning or at night?', '아침 공부와 밤 공부 중 무엇을 더 선호합니까?', 'I prefer studying at night. I have two reasons. First, it is quiet at night. My family is sleeping and nobody calls me, so I can focus well. Second, I have more free time at night. In the morning, I have to get ready for work in a hurry. For example, I study English for one hour every night after eleven, and I remember things better. For these reasons, I prefer studying at night.', '저는 밤에 공부하는 것을 선호합니다. 두 가지 이유가 있습니다. 첫째, 밤에는 조용합니다. 가족이 자고 있고 전화도 오지 않아서 잘 집중할 수 있습니다. 둘째, 밤에는 자유 시간이 더 많습니다. 아침에는 서둘러 출근 준비를 해야 합니다. 예를 들어 저는 매일 밤 11시 이후에 한 시간씩 영어를 공부하는데 기억이 더 잘 됩니다. 이런 이유로 저는 밤에 공부하는 것을 선호합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer taking a bus or taking the subway?', '버스와 지하철 중 무엇을 더 선호합니까?', 'I prefer taking the subway. I have two reasons. First, the subway is faster. There is no traffic underground. For example, going to work takes twenty minutes by subway, but forty minutes by bus. Second, the subway is always on time, so I can plan my day easily. I can also read a book or listen to music comfortably. For these reasons, I prefer taking the subway.', '저는 지하철 타는 것을 선호합니다. 두 가지 이유가 있습니다. 첫째, 지하철이 더 빠릅니다. 지하에는 교통 체증이 없습니다. 예를 들어 출근할 때 지하철은 20분이지만 버스는 40분이 걸립니다. 둘째, 지하철은 항상 정시에 와서 하루 계획을 세우기 쉽습니다. 편하게 책을 읽거나 음악을 들을 수도 있습니다. 이런 이유로 저는 지하철 타는 것을 선호합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, cash or credit cards?', '현금과 신용카드 중 무엇을 더 선호합니까?', 'I prefer credit cards. I have two reasons. First, they are easy and fast. I do not need to carry heavy coins, and I can pay with one touch. Second, I can check my spending. For example, my card app shows what I bought this month, so I can save money more easily. Carrying a lot of cash is also dangerous. For these reasons, I prefer credit cards.', '저는 신용카드를 선호합니다. 두 가지 이유가 있습니다. 첫째, 쉽고 빠릅니다. 무거운 동전을 들고 다닐 필요가 없고 한 번의 터치로 결제할 수 있습니다. 둘째, 지출을 확인할 수 있습니다. 예를 들어 카드 앱이 이번 달에 무엇을 샀는지 보여 줘서 돈을 더 쉽게 아낄 수 있습니다. 현금을 많이 들고 다니는 것은 위험하기도 합니다. 이런 이유로 저는 신용카드를 선호합니다.'),
  q(5, 'choice', 2, 'Do you prefer A or B', 'Do you prefer watching sports or playing sports?', '스포츠 관람과 직접 하기 중 무엇을 더 좋아합니까?', 'I prefer playing sports. I have two reasons. First, playing sports is good exercise. When I just watch sports, my body does not get healthy. Second, it is more fun and I can make friends. For example, I play soccer every Saturday, and I have made many good friends there. After playing, I feel fresh and happy. For these reasons, I prefer playing sports.', '저는 직접 운동하는 것을 선호합니다. 두 가지 이유가 있습니다. 첫째, 직접 하는 운동은 몸에 좋습니다. 보기만 하면 몸이 건강해지지 않습니다. 둘째, 더 재미있고 친구를 사귈 수 있습니다. 예를 들어 저는 매주 토요일에 축구를 하는데 거기서 좋은 친구를 많이 사귀었습니다. 운동을 하고 나면 상쾌하고 행복합니다. 이런 이유로 저는 직접 운동하는 것을 선호합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, a city trip or a beach trip?', '도시 여행과 바다 여행 중 무엇을 더 선호합니까?', 'I prefer a beach trip. I have two reasons. First, I can relax at the beach. I love listening to the sound of the waves and walking on the sand without any schedule. Second, there are fun activities. For example, last summer I went swimming and ate fresh seafood at the beach, and I felt truly happy. A city trip is often crowded and tiring. For these reasons, I prefer a beach trip.', '저는 바다 여행을 선호합니다. 두 가지 이유가 있습니다. 첫째, 바다에서는 쉴 수 있습니다. 파도 소리를 듣고 일정 없이 모래사장을 걷는 것을 아주 좋아합니다. 둘째, 재미있는 활동이 있습니다. 예를 들어 지난여름에 바다에서 수영을 하고 신선한 해산물을 먹었는데 정말 행복했습니다. 도시 여행은 붐비고 피곤할 때가 많습니다. 이런 이유로 저는 바다 여행을 선호합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer listening to music or watching videos?', '음악 듣기와 영상 보기 중 무엇을 더 좋아합니까?', 'I prefer listening to music. I have two reasons. First, I can do other things while listening. For example, I listen to music when I walk, clean my room, or exercise. Watching videos needs my eyes and my full time. Second, music helps me relax. When I feel stressed, my favorite songs make me feel calm and happy. For these reasons, I prefer listening to music.', '저는 음악 듣는 것을 선호합니다. 두 가지 이유가 있습니다. 첫째, 들으면서 다른 일을 할 수 있습니다. 예를 들어 걸을 때, 방을 청소할 때, 운동할 때 음악을 듣습니다. 영상은 눈과 시간을 온전히 써야 합니다. 둘째, 음악은 휴식에 도움이 됩니다. 스트레스를 받을 때 좋아하는 노래를 들으면 마음이 편안하고 행복해집니다. 이런 이유로 저는 음악 듣는 것을 선호합니다.'),
  q(5, 'choice', 3, 'Which do you prefer, A or B', 'Which do you prefer, working in an office or working from home?', '사무실 근무와 재택근무 중 무엇을 더 선호합니까?', 'I prefer working from home. I have two reasons. First, I can save commuting time. I used to spend two hours on the road every day, but now I use that time for exercise and sleep. Second, my home is quiet, so I can focus better. For example, I finish my reports faster at home because nobody interrupts me. I can also save money on lunch. For these reasons, I prefer working from home.', '저는 재택근무를 선호합니다. 두 가지 이유가 있습니다. 첫째, 출퇴근 시간을 아낄 수 있습니다. 예전에는 매일 길에서 두 시간을 썼는데 지금은 그 시간을 운동과 잠에 씁니다. 둘째, 집은 조용해서 더 잘 집중할 수 있습니다. 예를 들어 집에서는 아무도 방해하지 않아서 보고서를 더 빨리 끝냅니다. 점심값도 아낄 수 있습니다. 이런 이유로 저는 재택근무를 선호합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer spicy food or mild food?', '매운 음식과 순한 음식 중 무엇을 더 좋아합니까?', 'I prefer spicy food. I have two reasons. First, spicy food is exciting and delicious. It goes very well with rice, so I can enjoy my meal more. Second, it helps me relieve stress. For example, when I have a hard day, I eat spicy noodles, and I feel much better after that. Mild food is sometimes too boring for me. For these reasons, I prefer spicy food.', '저는 매운 음식을 선호합니다. 두 가지 이유가 있습니다. 첫째, 매운 음식은 자극적이고 맛있습니다. 밥과 아주 잘 어울려서 식사를 더 즐길 수 있습니다. 둘째, 스트레스 해소에 도움이 됩니다. 예를 들어 힘든 날에는 매운 라면을 먹는데 그 후에 기분이 훨씬 나아집니다. 순한 음식은 가끔 너무 심심합니다. 이런 이유로 저는 매운 음식을 선호합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, shopping alone or shopping with friends?', '혼자 쇼핑과 친구와 쇼핑 중 무엇을 더 선호합니까?', 'I prefer shopping alone. I have two reasons. First, it is faster. I buy only the things I need and go home quickly. I do not have to wait for anyone. Second, I can save money. For example, when I shop with friends, I often buy things I do not need because they say the items look good on me. Shopping alone helps me think clearly. For these reasons, I prefer shopping alone.', '저는 혼자 쇼핑하는 것을 선호합니다. 두 가지 이유가 있습니다. 첫째, 더 빠릅니다. 필요한 것만 사고 빨리 집에 갑니다. 누구를 기다릴 필요도 없습니다. 둘째, 돈을 아낄 수 있습니다. 예를 들어 친구와 쇼핑하면 어울린다는 말에 필요 없는 물건을 자주 삽니다. 혼자 쇼핑하면 차분하게 생각할 수 있습니다. 이런 이유로 저는 혼자 쇼핑하는 것을 선호합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer summer or winter?', '여름과 겨울 중 무엇을 더 좋아합니까?', 'I prefer summer. I have two reasons. First, I can enjoy many outdoor activities. For example, I go swimming and camping with my family every summer, and we make great memories. Second, the days are long in summer. After work, it is still bright outside, so I can take a walk or meet friends. Winter is too cold, and the roads are dangerous. For these reasons, I prefer summer.', '저는 여름을 선호합니다. 두 가지 이유가 있습니다. 첫째, 야외 활동을 많이 즐길 수 있습니다. 예를 들어 매년 여름 가족과 수영과 캠핑을 하러 가는데 좋은 추억을 만듭니다. 둘째, 여름은 해가 깁니다. 퇴근 후에도 밖이 밝아서 산책을 하거나 친구를 만날 수 있습니다. 겨울은 너무 춥고 길이 위험합니다. 이런 이유로 저는 여름을 선호합니다.'),

  // ── 추가 문항 (Part 5 — 의견/장단점, 60초 IL 모범답변) ───────
  q(5, 'opinion', 1, 'Do you think', 'Do you think breakfast is important?', '아침 식사가 중요하다고 생각합니까?', 'Yes, I think breakfast is very important. I have two reasons. First, breakfast gives us energy for the day. When I eat breakfast, I can focus better at work in the morning. Second, skipping breakfast is bad for our health. For example, when I skip breakfast, I eat too much at lunch, and I feel sleepy after that. A simple breakfast like eggs and milk is enough. For these reasons, I think breakfast is important.', '네, 아침 식사는 매우 중요하다고 생각합니다. 두 가지 이유가 있습니다. 첫째, 아침 식사는 하루의 에너지를 줍니다. 아침을 먹으면 오전에 일에 더 잘 집중할 수 있습니다. 둘째, 아침을 거르는 것은 건강에 나쁩니다. 예를 들어 저는 아침을 거르면 점심을 과식하고 그 후에 졸립니다. 달걀과 우유 같은 간단한 아침이면 충분합니다. 이런 이유로 아침 식사는 중요하다고 생각합니다.'),
  q(5, 'opinion', 2, 'advantages', 'What are the advantages of using public transportation?', '대중교통 이용의 장점은 무엇입니까?', 'I think public transportation has two big advantages. First, it is cheap. A car needs gas, insurance, and parking money, but a bus or subway ticket costs very little. Second, it is good for the environment. When more people use buses, there are fewer cars and less air pollution. For example, I read a book or rest while riding the subway, so my commuting time is not wasted. For these reasons, I think public transportation is great.', '대중교통에는 두 가지 큰 장점이 있다고 생각합니다. 첫째, 저렴합니다. 자동차는 기름값, 보험료, 주차비가 들지만 버스나 지하철 요금은 아주 쌉니다. 둘째, 환경에 좋습니다. 더 많은 사람이 버스를 타면 차가 줄고 대기 오염도 줄어듭니다. 예를 들어 저는 지하철에서 책을 읽거나 쉬기 때문에 출퇴근 시간이 낭비되지 않습니다. 이런 이유로 대중교통은 훌륭하다고 생각합니다.'),
  q(5, 'opinion', 3, 'Do you agree', 'Do you agree that reading books is better than watching TV?', '독서가 TV 시청보다 낫다는 것에 동의합니까?', 'Yes, I agree that reading books is better than watching TV. I have two reasons. First, reading helps us think deeply. We imagine the story in our head, so our brain works more. Second, we can learn at our own speed. For example, when I read a difficult part, I can stop and read it again, but TV just goes on. Watching TV is easy, but we often forget it quickly. For these reasons, I agree.', '네, 독서가 TV 시청보다 낫다는 것에 동의합니다. 두 가지 이유가 있습니다. 첫째, 독서는 깊이 생각하게 도와줍니다. 이야기를 머릿속으로 상상하기 때문에 두뇌가 더 많이 움직입니다. 둘째, 자신의 속도로 배울 수 있습니다. 예를 들어 어려운 부분은 멈춰서 다시 읽을 수 있지만 TV는 그냥 지나갑니다. TV는 편하지만 금방 잊어버릴 때가 많습니다. 이런 이유로 저는 동의합니다.'),
  q(5, 'opinion', 2, 'disadvantages', 'What are the disadvantages of online shopping?', '온라인 쇼핑의 단점은 무엇입니까?', 'I think online shopping has two big disadvantages. First, we cannot see or try the products. For example, I bought a jacket online last month, but the size was wrong, and returning it took a week. Second, it is easy to spend too much money. Buying is so easy that I sometimes order things I do not really need. We also have to wait for delivery. For these reasons, we should shop online carefully.', '온라인 쇼핑에는 두 가지 큰 단점이 있다고 생각합니다. 첫째, 상품을 직접 보거나 입어 볼 수 없습니다. 예를 들어 지난달에 온라인에서 재킷을 샀는데 사이즈가 맞지 않아 반품에 일주일이 걸렸습니다. 둘째, 돈을 너무 많이 쓰기 쉽습니다. 구매가 너무 쉬워서 정말 필요하지 않은 물건을 주문할 때가 있습니다. 배송을 기다려야 하기도 합니다. 이런 이유로 온라인 쇼핑은 신중하게 해야 합니다.'),
  q(5, 'opinion', 3, 'Do you think', 'Do you think companies should allow casual clothes at work?', '회사가 자유로운 복장을 허용해야 한다고 생각합니까?', 'Yes, I think companies should allow casual clothes at work. I have two reasons. First, comfortable clothes help people work better. When my body is comfortable, I can focus on my work for a long time. Second, casual clothes save money and time. For example, suits are expensive, and choosing formal clothes every morning takes time. Of course, we can wear formal clothes for important meetings. For these reasons, I agree with casual clothes at work.', '네, 회사가 자유로운 복장을 허용해야 한다고 생각합니다. 두 가지 이유가 있습니다. 첫째, 편한 옷은 일을 더 잘하게 도와줍니다. 몸이 편하면 오랫동안 일에 집중할 수 있습니다. 둘째, 자유 복장은 돈과 시간을 아껴 줍니다. 예를 들어 정장은 비싸고 매일 아침 격식 있는 옷을 고르는 데 시간이 걸립니다. 물론 중요한 회의에는 정장을 입으면 됩니다. 이런 이유로 저는 회사의 자유 복장에 찬성합니다.'),
  q(5, 'opinion', 2, 'advantages', 'What are the advantages of living near your workplace?', '직장 근처에 사는 것의 장점은 무엇입니까?', 'I think living near the workplace has two big advantages. First, we can save commuting time. For example, my coworker lives near the office, so he sleeps one hour more than me and never worries about traffic. Second, life becomes less stressful. We can go home early, have dinner with family, and enjoy our evening. When we are less tired, we also work better. For these reasons, living near the workplace is very good.', '직장 근처에 사는 것에는 두 가지 큰 장점이 있다고 생각합니다. 첫째, 출퇴근 시간을 아낄 수 있습니다. 예를 들어 제 동료는 회사 근처에 살아서 저보다 한 시간 더 자고 교통 체증 걱정도 없습니다. 둘째, 생활 스트레스가 줄어듭니다. 일찍 집에 가서 가족과 저녁을 먹고 저녁 시간을 즐길 수 있습니다. 덜 피곤하면 일도 더 잘됩니다. 이런 이유로 직장 근처에 사는 것은 매우 좋습니다.'),
  q(5, 'opinion', 3, 'Do you think', 'Do you think children should learn a second language early?', '아이들이 외국어를 일찍 배워야 한다고 생각합니까?', 'Yes, I think children should learn a second language early. I have two reasons. First, children learn languages very fast. Their brains are like a sponge, and they can copy new sounds easily. For example, a friend of mine has a daughter who started English at five, and now she speaks without fear. Second, a second language gives children more chances in the future, like better jobs and foreign friends. For these reasons, I agree with early language learning.', '네, 아이들이 외국어를 일찍 배워야 한다고 생각합니다. 두 가지 이유가 있습니다. 첫째, 아이들은 언어를 매우 빨리 배웁니다. 아이들의 뇌는 스펀지 같아서 새로운 소리를 쉽게 따라 합니다. 예를 들어 제 친구의 딸은 다섯 살에 영어를 시작했는데 지금은 두려움 없이 말합니다. 둘째, 외국어는 좋은 직업과 외국인 친구처럼 아이의 미래에 더 많은 기회를 줍니다. 이런 이유로 저는 조기 언어 교육에 찬성합니다.'),
  q(5, 'opinion', 2, 'Do you agree', 'Do you agree that eating at home is healthier than eating out?', '집밥이 외식보다 건강하다는 것에 동의합니까?', 'Yes, I agree that eating at home is healthier than eating out. I have two reasons. First, we can choose fresh ingredients. I use fresh vegetables and good meat when I cook. Second, we can control salt, sugar, and oil. For example, restaurant food is often too salty, but at home I make my food lighter. We can also control how much we eat. For these reasons, I agree that eating at home is healthier.', '네, 집밥이 외식보다 건강하다는 것에 동의합니다. 두 가지 이유가 있습니다. 첫째, 신선한 재료를 고를 수 있습니다. 저는 요리할 때 신선한 채소와 좋은 고기를 씁니다. 둘째, 소금·설탕·기름을 조절할 수 있습니다. 예를 들어 식당 음식은 너무 짤 때가 많지만 집에서는 더 담백하게 만듭니다. 먹는 양도 조절할 수 있습니다. 이런 이유로 집밥이 더 건강하다는 것에 동의합니다.'),
  q(5, 'opinion', 2, 'disadvantages', 'What are the disadvantages of working long hours?', '장시간 근무의 단점은 무엇입니까?', 'I think working long hours has two big disadvantages. First, it is bad for our health. People who work late cannot sleep or exercise enough, so they get tired and sick easily. Second, there is no time for family and hobbies. For example, when my father worked late every day, we could not have dinner together, and he was always stressed. Tired workers also make more mistakes. For these reasons, working long hours is not good.', '장시간 근무에는 두 가지 큰 단점이 있다고 생각합니다. 첫째, 건강에 나쁩니다. 늦게까지 일하는 사람은 잠과 운동이 부족해서 쉽게 지치고 병이 납니다. 둘째, 가족과 취미를 위한 시간이 없습니다. 예를 들어 아버지가 매일 늦게까지 일하셨을 때 우리는 함께 저녁을 먹지 못했고 아버지는 늘 스트레스를 받으셨습니다. 지친 직원은 실수도 더 많이 합니다. 이런 이유로 장시간 근무는 좋지 않습니다.'),
  q(5, 'opinion', 1, 'Do you think', 'Do you think music helps people study?', '음악이 공부에 도움이 된다고 생각합니까?', 'Yes, I think music helps people study. I have two reasons. First, quiet music blocks noise. For example, when I study in a cafe, I listen to soft piano music, and I cannot hear the people talking around me. Second, music makes me feel calm. Before an exam, slow music helps me relax and worry less. Of course, loud songs with words can be distracting, so quiet music is best. For these reasons, I think music helps studying.', '네, 음악이 공부에 도움이 된다고 생각합니다. 두 가지 이유가 있습니다. 첫째, 조용한 음악은 소음을 막아 줍니다. 예를 들어 카페에서 공부할 때 잔잔한 피아노 음악을 들으면 주변 사람들의 대화가 들리지 않습니다. 둘째, 음악은 마음을 차분하게 합니다. 시험 전에 느린 음악을 들으면 긴장이 풀리고 걱정이 줄어듭니다. 물론 가사가 있는 시끄러운 노래는 방해가 되니 조용한 음악이 가장 좋습니다. 이런 이유로 음악은 공부에 도움이 된다고 생각합니다.'),
];

// 레벨별 모범답변 (IM/IH/AL) 부착 — IL은 answerEnglish/answerKorean 그대로
for (const sq of SEED_QUESTIONS) {
  if (LEVEL_ANSWERS[sq.id]) sq.levelAnswers = LEVEL_ANSWERS[sq.id];
}

// 시드 데이터 버전 — 올리면 기존 사용자에게 새 문항 추가 + 시드 문항 내용 개선분이 자동 반영된다 (store.js)
// v3: Part 5 모범답변을 60초 IL 수준(입장→이유2개+예시→마무리)으로 전면 확장
// v4: 전 문항에 IM/IH/AL 레벨별 모범답변 추가
// v5: 레벨별 답변 검수 반영 (오류 75건 수정, 반복 템플릿 제거·Part 5 구조 다양화 194건)
export const SEED_VERSION = 5;
