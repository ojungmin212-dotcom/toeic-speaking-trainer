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

  // ── 선택 (choice, Part 5) ────────────────────────────────────
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, shopping online or shopping in stores?', '온라인 쇼핑과 매장 쇼핑 중 무엇을 더 선호합니까?', 'I prefer shopping online because it is convenient.', '편리하기 때문에 온라인 쇼핑을 더 좋아합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, watching movies at home or at a theater?', '집에서 영화 보기와 영화관에서 보기 중 무엇을 더 선호합니까?', 'I prefer watching movies at home because it is comfortable.', '편안하기 때문에 집에서 보는 것을 더 좋아합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer coffee or tea?', '커피와 차 중 무엇을 더 좋아합니까?', 'I prefer coffee because it wakes me up.', '잠을 깨워 주기 때문에 커피를 더 좋아합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer texting or calling?', '문자와 전화 중 무엇을 더 좋아합니까?', 'I prefer texting because it is quick and easy.', '빠르고 쉽기 때문에 문자를 더 좋아합니다.'),
  q(5, 'choice', 2, 'Do you prefer A or B', 'Do you prefer working alone or working with a team?', '혼자 일하기와 팀으로 일하기 중 무엇을 더 선호합니까?', 'I prefer working with a team because we can share ideas.', '아이디어를 나눌 수 있어서 팀으로 일하는 것을 더 좋아합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, eating out or cooking at home?', '외식과 집에서 요리하기 중 무엇을 더 선호합니까?', 'I prefer cooking at home because it is cheaper.', '더 저렴하기 때문에 집에서 요리하는 것을 좋아합니다.'),
  q(5, 'choice', 2, 'Do you prefer A or B', 'Do you prefer traveling alone or traveling with friends?', '혼자 여행과 친구와 여행 중 무엇을 더 좋아합니까?', 'I prefer traveling with friends because it is more fun.', '더 재미있기 때문에 친구와 여행하는 것을 좋아합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, paper books or e-books?', '종이책과 전자책 중 무엇을 더 선호합니까?', 'I prefer e-books because they are easy to carry.', '들고 다니기 편해서 전자책을 더 좋아합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer morning exercise or evening exercise?', '아침 운동과 저녁 운동 중 무엇을 더 좋아합니까?', 'I prefer evening exercise because I have more time.', '시간이 더 많아서 저녁 운동을 좋아합니다.'),
  q(5, 'choice', 3, 'Which do you prefer, A or B', 'Which do you prefer, living in a city or living in the countryside?', '도시 생활과 시골 생활 중 무엇을 더 선호합니까?', 'I prefer living in a city because it is convenient.', '편리하기 때문에 도시에 사는 것을 더 좋아합니다.'),

  // ── 의견/장단점 (opinion, Part 5) ────────────────────────────
  q(5, 'opinion', 2, 'Do you think', 'Do you think students should wear school uniforms?', '학생들이 교복을 입어야 한다고 생각합니까?', 'Yes, I think so. Uniforms are simple and save time.', '네, 그렇게 생각합니다. 교복은 간편하고 시간을 아껴 줍니다.'),
  q(5, 'opinion', 2, 'advantages', 'What are the advantages of working from home?', '재택근무의 장점은 무엇입니까?', 'You can save time because you do not commute.', '출퇴근을 하지 않아 시간을 아낄 수 있습니다.'),
  q(5, 'opinion', 3, 'Do you agree', 'Do you agree that smartphones are good for children?', '스마트폰이 아이들에게 좋다는 것에 동의합니까?', 'No, I do not agree. Children need more time outside.', '아니요, 동의하지 않습니다. 아이들은 바깥 활동 시간이 더 필요합니다.'),
  q(5, 'opinion', 2, 'disadvantages', 'What are the disadvantages of living in a big city?', '대도시 생활의 단점은 무엇입니까?', 'It is crowded and expensive.', '붐비고 물가가 비쌉니다.'),
  q(5, 'opinion', 1, 'Do you think', 'Do you think exercise is important?', '운동이 중요하다고 생각합니까?', 'Yes, it keeps us healthy and happy.', '네, 운동은 우리를 건강하고 행복하게 해 줍니다.'),
  q(5, 'opinion', 2, 'advantages', 'What are the advantages of online classes?', '온라인 수업의 장점은 무엇입니까?', 'You can study anywhere, anytime.', '언제 어디서나 공부할 수 있습니다.'),
  q(5, 'opinion', 2, 'Do you agree', 'Do you agree that people should take a vacation every year?', '사람들이 매년 휴가를 가야 한다는 것에 동의합니까?', 'Yes, rest helps people work better.', '네, 휴식은 일을 더 잘하게 도와줍니다.'),
  q(5, 'opinion', 3, 'Do you think', 'Do you think it is better to save money or to enjoy it now?', '돈을 모으는 것과 지금 쓰는 것 중 무엇이 더 낫다고 생각합니까?', 'I think saving money is better because the future is important.', '미래가 중요하기 때문에 저축이 더 낫다고 생각합니다.'),
  q(5, 'opinion', 2, 'disadvantages', 'What are the disadvantages of social media?', '소셜 미디어의 단점은 무엇입니까?', 'It wastes time and can cause stress.', '시간을 낭비하게 하고 스트레스를 줄 수 있습니다.'),
  q(5, 'opinion', 1, 'Do you think', 'Do you think pets are good for families?', '반려동물이 가족에게 좋다고 생각합니까?', 'Yes, pets make people happy.', '네, 반려동물은 사람들을 행복하게 해 줍니다.'),

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

  // ── 추가 문항 (Part 5 — 선택) ────────────────────────────────
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, studying in the morning or at night?', '아침 공부와 밤 공부 중 무엇을 더 선호합니까?', 'I prefer studying at night because it is quiet.', '조용하기 때문에 밤에 공부하는 것을 더 좋아합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer taking a bus or taking the subway?', '버스와 지하철 중 무엇을 더 선호합니까?', 'I prefer the subway because it is faster.', '더 빠르기 때문에 지하철을 더 좋아합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, cash or credit cards?', '현금과 신용카드 중 무엇을 더 선호합니까?', 'I prefer credit cards because they are easy to use.', '사용하기 편해서 신용카드를 더 좋아합니다.'),
  q(5, 'choice', 2, 'Do you prefer A or B', 'Do you prefer watching sports or playing sports?', '스포츠 관람과 직접 하기 중 무엇을 더 좋아합니까?', 'I prefer playing sports because it is good exercise.', '좋은 운동이 되기 때문에 직접 하는 것을 좋아합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, a city trip or a beach trip?', '도시 여행과 바다 여행 중 무엇을 더 선호합니까?', 'I prefer a beach trip because I can relax.', '쉴 수 있어서 바다 여행을 더 좋아합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer listening to music or watching videos?', '음악 듣기와 영상 보기 중 무엇을 더 좋아합니까?', 'I prefer music because I can do other things too.', '다른 일도 같이 할 수 있어서 음악을 더 좋아합니다.'),
  q(5, 'choice', 3, 'Which do you prefer, A or B', 'Which do you prefer, working in an office or working from home?', '사무실 근무와 재택근무 중 무엇을 더 선호합니까?', 'I prefer working from home because I save time.', '시간을 아낄 수 있어서 재택근무를 더 좋아합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer spicy food or mild food?', '매운 음식과 순한 음식 중 무엇을 더 좋아합니까?', 'I prefer spicy food because it is exciting.', '자극적이어서 매운 음식을 더 좋아합니다.'),
  q(5, 'choice', 2, 'Which do you prefer, A or B', 'Which do you prefer, shopping alone or shopping with friends?', '혼자 쇼핑과 친구와 쇼핑 중 무엇을 더 선호합니까?', 'I prefer shopping alone because it is faster.', '더 빠르기 때문에 혼자 쇼핑하는 것을 좋아합니다.'),
  q(5, 'choice', 1, 'Do you prefer A or B', 'Do you prefer summer or winter?', '여름과 겨울 중 무엇을 더 좋아합니까?', 'I prefer summer because I like outdoor activities.', '야외 활동을 좋아해서 여름을 더 좋아합니다.'),

  // ── 추가 문항 (Part 5 — 의견/장단점) ─────────────────────────
  q(5, 'opinion', 1, 'Do you think', 'Do you think breakfast is important?', '아침 식사가 중요하다고 생각합니까?', 'Yes, it gives us energy for the day.', '네, 하루를 위한 에너지를 줍니다.'),
  q(5, 'opinion', 2, 'advantages', 'What are the advantages of using public transportation?', '대중교통 이용의 장점은 무엇입니까?', 'It is cheap and good for the environment.', '저렴하고 환경에 좋습니다.'),
  q(5, 'opinion', 3, 'Do you agree', 'Do you agree that reading books is better than watching TV?', '독서가 TV 시청보다 낫다는 것에 동의합니까?', 'Yes, books help us think more deeply.', '네, 책은 더 깊이 생각하게 도와줍니다.'),
  q(5, 'opinion', 2, 'disadvantages', 'What are the disadvantages of online shopping?', '온라인 쇼핑의 단점은 무엇입니까?', 'You cannot see or try the products.', '상품을 직접 보거나 써 볼 수 없습니다.'),
  q(5, 'opinion', 3, 'Do you think', 'Do you think companies should allow casual clothes at work?', '회사가 자유로운 복장을 허용해야 한다고 생각합니까?', 'Yes, comfortable clothes help people work better.', '네, 편한 옷은 일을 더 잘하게 도와줍니다.'),
  q(5, 'opinion', 2, 'advantages', 'What are the advantages of living near your workplace?', '직장 근처에 사는 것의 장점은 무엇입니까?', 'You can save time and sleep more.', '시간을 아끼고 잠을 더 잘 수 있습니다.'),
  q(5, 'opinion', 3, 'Do you think', 'Do you think children should learn a second language early?', '아이들이 외국어를 일찍 배워야 한다고 생각합니까?', 'Yes, they can learn languages faster when young.', '네, 어릴 때 언어를 더 빨리 배웁니다.'),
  q(5, 'opinion', 2, 'Do you agree', 'Do you agree that eating at home is healthier than eating out?', '집밥이 외식보다 건강하다는 것에 동의합니까?', 'Yes, you can choose fresh ingredients.', '네, 신선한 재료를 고를 수 있습니다.'),
  q(5, 'opinion', 2, 'disadvantages', 'What are the disadvantages of working long hours?', '장시간 근무의 단점은 무엇입니까?', 'People get tired and stressed.', '사람들이 지치고 스트레스를 받습니다.'),
  q(5, 'opinion', 1, 'Do you think', 'Do you think music helps people study?', '음악이 공부에 도움이 된다고 생각합니까?', 'Yes, quiet music helps people focus.', '네, 조용한 음악은 집중을 도와줍니다.'),
];

// 시드 데이터 버전 — 올리면 기존 사용자에게 새 문항이 자동 병합된다 (store.js)
export const SEED_VERSION = 2;
