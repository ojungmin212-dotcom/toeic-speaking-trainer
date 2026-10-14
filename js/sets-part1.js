// Part 1 (Q1–2) 지문 읽기 — 자체 제작 지문 (실제 기출 아님, 형식만 실제 시험과 동일: 준비 45초 · 읽기 45초)
// 안내 방송·광고·라디오·소개 등 40~75단어. 목록(A, B, and C)·숫자·고유명사를 넣어 실제 시험의 끊어 읽기 포인트를 연습한다.
// guide: 끊어 읽기 표시 — " / " = 잠깐 쉬기, **단어** = 힘주어 읽기 (표시를 지우면 q[0]과 똑같아야 한다)
export const PART1_PASSAGES = [
  {
    id: "p1-01", no: 1, genre: "매장 안내 방송", d: 1,
    q: ["Attention, shoppers. Thank you for visiting Greenwood Market. This weekend only, all fresh fruit, frozen vegetables, and dairy products are twenty percent off. Don't forget to stop by our bakery, where freshly baked bread is available every morning. If you need any help, please ask one of our friendly staff members. Have a wonderful day!", "쇼핑객 여러분께 알려 드립니다. 그린우드 마켓을 찾아 주셔서 감사합니다. 이번 주말에 한해 모든 신선 과일, 냉동 채소, 유제품을 20퍼센트 할인합니다. 매일 아침 갓 구운 빵을 판매하는 베이커리에도 꼭 들러 주십시오. 도움이 필요하시면 친절한 직원에게 문의해 주십시오. 좋은 하루 보내십시오!"],
    guide: "Attention, **shoppers**. / Thank you for visiting **Greenwood Market**. / This weekend **only**, / all fresh **fruit**, / frozen **vegetables**, / and dairy **products** / are twenty percent **off**. / Don't forget to stop by our **bakery**, / where freshly baked **bread** / is available every **morning**. / If you need any **help**, / please ask one of our friendly **staff** members. / Have a wonderful **day**!",
  },
  {
    id: "p1-02", no: 2, genre: "라디오 날씨 예보", d: 1,
    q: ["Good morning, and welcome to the Riverside weather report. Today will be cloudy in the morning, with light rain expected in the afternoon. Temperatures will stay between twelve and eighteen degrees. If you're heading out this evening, remember to bring an umbrella and a warm jacket. Tomorrow, sunny skies will return across the region.", "좋은 아침입니다. 리버사이드 날씨 예보입니다. 오늘은 오전에 흐리고 오후에는 약한 비가 예상됩니다. 기온은 12도에서 18도 사이를 유지하겠습니다. 저녁에 외출하신다면 우산과 따뜻한 재킷을 챙기십시오. 내일은 지역 전체에 다시 맑은 하늘이 돌아오겠습니다."],
    guide: "Good **morning**, / and welcome to the **Riverside** weather report. / Today will be **cloudy** in the morning, / with light **rain** / expected in the **afternoon**. / Temperatures will stay / between **twelve** and **eighteen** degrees. / If you're heading out this **evening**, / remember to bring an **umbrella** / and a warm **jacket**. / Tomorrow, / **sunny** skies will return / across the **region**.",
  },
  {
    id: "p1-03", no: 1, genre: "공항 탑승 안내", d: 2,
    q: ["Ladies and gentlemen, may I have your attention, please. Flight 307 to Vancouver will now be boarding at Gate 12. Passengers traveling with small children, as well as those needing extra assistance, may board first. Please have your boarding pass, passport, and photo identification ready. Thank you for flying with Pacific Air.", "승객 여러분, 잠시 안내 말씀드리겠습니다. 밴쿠버행 307편이 지금 12번 게이트에서 탑승을 시작합니다. 어린 자녀와 함께 여행하시는 승객과 추가 도움이 필요하신 승객께서는 먼저 탑승하실 수 있습니다. 탑승권, 여권, 사진이 있는 신분증을 준비해 주십시오. 퍼시픽 항공을 이용해 주셔서 감사합니다."],
    guide: "Ladies and **gentlemen**, / may I have your **attention**, please. / Flight **307** to **Vancouver** / will now be boarding at **Gate 12**. / Passengers traveling with small **children**, / as well as those needing extra **assistance**, / may board **first**. / Please have your boarding **pass**, / **passport**, / and photo **identification** ready. / Thank you for flying with **Pacific Air**.",
  },
  {
    id: "p1-04", no: 2, genre: "강연자 소개", d: 2,
    q: ["Welcome to this evening's business lecture. Our speaker tonight is Dr. Sandra Kim, a professor of marketing at Westbrook University. Dr. Kim has written three books about customer behavior, online advertising, and brand design. Tonight, she will share practical tips for growing a small business. Please join me in giving her a warm welcome.", "오늘 저녁 비즈니스 강연에 오신 것을 환영합니다. 오늘 밤 연사는 웨스트브룩 대학교 마케팅 교수인 샌드라 김 박사님입니다. 김 박사님은 고객 행동, 온라인 광고, 브랜드 디자인에 관한 책을 세 권 쓰셨습니다. 오늘 밤에는 작은 사업을 키우기 위한 실용적인 조언을 나눠 주실 것입니다. 따뜻한 박수로 맞아 주십시오."],
    guide: "Welcome to this evening's business **lecture**. / Our speaker tonight is **Dr. Sandra Kim**, / a professor of **marketing** / at **Westbrook University**. / Dr. Kim has written **three** books / about customer **behavior**, / online **advertising**, / and brand **design**. / **Tonight**, / she will share practical **tips** / for growing a small **business**. / Please join me / in giving her a warm **welcome**.",
  },
  {
    id: "p1-05", no: 1, genre: "자동 응답 메시지", d: 2,
    q: ["Thank you for calling Bright Smile Dental Clinic. Our office is open from nine a.m. to six p.m., Monday through Friday. To make or change an appointment, please press one. For questions about insurance or payment, please press two. If this is an emergency, please stay on the line, and our staff will assist you shortly.", "브라이트 스마일 치과에 전화해 주셔서 감사합니다. 저희 병원은 월요일부터 금요일까지 오전 9시부터 오후 6시까지 진료합니다. 예약하거나 예약을 변경하시려면 1번을 눌러 주십시오. 보험이나 결제에 관한 문의는 2번을 눌러 주십시오. 응급 상황이시면 끊지 말고 기다려 주십시오. 곧 직원이 도와드리겠습니다."],
    guide: "Thank you for calling **Bright Smile** Dental Clinic. / Our office is open / from **nine** a.m. to **six** p.m., / **Monday** through **Friday**. / To **make** or **change** an appointment, / please press **one**. / For questions about **insurance** or **payment**, / please press **two**. / If this is an **emergency**, / please stay on the **line**, / and our staff will assist you **shortly**.",
  },
  {
    id: "p1-06", no: 2, genre: "카페 광고", d: 1,
    q: ["Are you looking for a comfortable place to relax after work? Visit Blue Bean Café, located right next to Central Station. We offer fresh coffee, homemade cakes, and light meals at reasonable prices. This month, every customer who brings a reusable cup will receive a free cookie. Blue Bean Café is the perfect place to unwind.", "퇴근 후 편하게 쉴 곳을 찾고 계십니까? 중앙역 바로 옆에 있는 블루 빈 카페를 찾아 주십시오. 신선한 커피, 직접 만든 케이크, 가벼운 식사를 합리적인 가격에 제공합니다. 이번 달에는 다회용 컵을 가져오시는 모든 손님께 쿠키를 무료로 드립니다. 블루 빈 카페는 휴식을 취하기에 완벽한 곳입니다."],
    guide: "Are you looking for a **comfortable** place / to relax after **work**? / Visit **Blue Bean Café**, / located right next to **Central Station**. / We offer fresh **coffee**, / homemade **cakes**, / and light **meals** / at reasonable **prices**. / This **month**, / every customer who brings a **reusable** cup / will receive a free **cookie**. / Blue Bean Café / is the **perfect** place to unwind.",
  },
  {
    id: "p1-07", no: 1, genre: "관광 가이드 안내", d: 1,
    q: ["Welcome aboard the Harbor City bus tour. Over the next two hours, we'll visit the old fishing village, the art museum, and the famous Ocean Bridge. Please remain seated while the bus is moving, and keep your belongings with you at all times. Feel free to ask me questions along the way. Now, let's begin our tour!", "하버 시티 버스 투어에 오신 것을 환영합니다. 앞으로 두 시간 동안 옛 어촌 마을, 미술관, 그리고 유명한 오션 브리지를 방문하겠습니다. 버스가 움직이는 동안에는 자리에 앉아 계시고, 소지품은 항상 몸에 지니십시오. 가는 동안 궁금한 점은 언제든 물어보십시오. 그럼 투어를 시작하겠습니다!"],
    guide: "Welcome aboard the **Harbor City** bus tour. / Over the next **two** hours, / we'll visit the old fishing **village**, / the art **museum**, / and the famous **Ocean Bridge**. / Please remain **seated** / while the bus is **moving**, / and keep your **belongings** with you / at all **times**. / Feel free to ask me **questions** / along the **way**. / Now, / let's **begin** our tour!",
  },
  {
    id: "p1-08", no: 2, genre: "라디오 교통 정보", d: 2,
    q: ["This is your Friday afternoon traffic update. Traffic is moving slowly on Highway 9 because of road construction near Maple Avenue. Drivers heading downtown should use Park Road or Lincoln Street instead. The construction is expected to continue until next Tuesday. For the latest updates, stay tuned to Radio 95.5.", "금요일 오후 교통 정보입니다. 메이플 애비뉴 근처 도로 공사 때문에 9번 고속도로의 차량 흐름이 느립니다. 시내로 가시는 운전자께서는 대신 파크 로드나 링컨 스트리트를 이용하십시오. 공사는 다음 주 화요일까지 계속될 예정입니다. 최신 소식은 라디오 95.5에서 계속 들어 주십시오."],
    guide: "This is your **Friday** afternoon traffic update. / Traffic is moving **slowly** on **Highway 9** / because of road **construction** / near **Maple Avenue**. / Drivers heading **downtown** / should use **Park Road** / or **Lincoln Street** instead. / The construction is expected to **continue** / until next **Tuesday**. / For the latest **updates**, / stay tuned to **Radio 95.5**.",
  },
  {
    id: "p1-09", no: 1, genre: "사내 공지", d: 2,
    q: ["Good morning, everyone. This is a reminder that the annual safety inspection will take place on Thursday. During the inspection, the elevators, the parking garage, and the main kitchen will be closed from ten a.m. to two p.m. We apologize for any inconvenience. If you have questions, please contact the facilities team on the third floor.", "안녕하십니까, 여러분. 연례 안전 점검이 목요일에 실시된다는 것을 다시 알려 드립니다. 점검 동안 엘리베이터, 주차장, 중앙 주방은 오전 10시부터 오후 2시까지 폐쇄됩니다. 불편을 드려 죄송합니다. 문의 사항은 3층 시설 관리팀에 연락해 주십시오."],
    guide: "Good morning, **everyone**. / This is a **reminder** / that the annual safety **inspection** / will take place on **Thursday**. / During the inspection, / the **elevators**, / the parking **garage**, / and the main **kitchen** / will be **closed** / from **ten** a.m. to **two** p.m. / We apologize for any **inconvenience**. / If you have **questions**, / please contact the **facilities** team / on the **third** floor.",
  },
  {
    id: "p1-10", no: 2, genre: "박물관 안내", d: 2,
    q: ["Welcome to the National History Museum. Our new exhibition, Life by the Sea, is now open on the second floor. Visitors can explore ancient boats, fishing tools, and colorful paintings from coastal towns. Guided tours start every hour at the main entrance. Please note that food, drinks, and flash photography are not allowed inside the galleries.", "국립 역사박물관에 오신 것을 환영합니다. 새 전시 '바다와 함께하는 삶'이 지금 2층에서 열리고 있습니다. 관람객은 고대의 배, 고기잡이 도구, 해안 마을의 다채로운 그림을 둘러볼 수 있습니다. 가이드 투어는 정문에서 매시 정각에 시작합니다. 전시실 안에서는 음식, 음료, 플래시 촬영이 금지되어 있으니 유의해 주십시오."],
    guide: "Welcome to the **National History Museum**. / Our new exhibition, / **Life by the Sea**, / is now open on the **second** floor. / Visitors can explore ancient **boats**, / fishing **tools**, / and colorful **paintings** / from coastal **towns**. / Guided tours start every **hour** / at the main **entrance**. / Please note that **food**, / **drinks**, / and flash **photography** / are **not** allowed / inside the **galleries**.",
  },
  {
    id: "p1-11", no: 1, genre: "지역 뉴스", d: 2,
    q: ["In local news, the city of Fairview has opened a brand-new public library downtown. The modern building includes a children's reading room, a computer lab, and a quiet study area. Library cards are free for all residents. Mayor Linda Park said the library will become an important place for learning and community events.", "지역 소식입니다. 페어뷰시가 시내에 새 공공 도서관을 열었습니다. 현대식 건물에는 어린이 열람실, 컴퓨터실, 조용한 학습 공간이 있습니다. 도서관 카드는 모든 주민에게 무료입니다. 린다 박 시장은 이 도서관이 배움과 지역 행사를 위한 중요한 장소가 될 것이라고 말했습니다."],
    guide: "In local **news**, / the city of **Fairview** / has opened a brand-new public **library** / **downtown**. / The modern building includes / a children's reading **room**, / a computer **lab**, / and a quiet study **area**. / Library cards are **free** / for all **residents**. / Mayor **Linda Park** said / the library will become an important **place** / for **learning** / and community **events**.",
  },
  {
    id: "p1-12", no: 2, genre: "호텔 안내", d: 1,
    q: ["Welcome to the Lakeside Hotel. We hope you enjoy your stay with us. Breakfast is served in the Garden Restaurant from six-thirty to ten a.m. Our fitness center, swimming pool, and business lounge are located on the fifth floor. If you need extra towels, a taxi, or a wake-up call, simply dial zero from your room phone.", "레이크사이드 호텔에 오신 것을 환영합니다. 즐거운 시간 보내시기 바랍니다. 아침 식사는 가든 레스토랑에서 오전 6시 30분부터 10시까지 제공됩니다. 피트니스 센터, 수영장, 비즈니스 라운지는 5층에 있습니다. 수건 추가, 택시, 모닝콜이 필요하시면 객실 전화로 0번을 누르시기만 하면 됩니다."],
    guide: "Welcome to the **Lakeside Hotel**. / We hope you **enjoy** your stay with us. / Breakfast is served / in the **Garden Restaurant** / from **six-thirty** to **ten** a.m. / Our fitness **center**, / swimming **pool**, / and business **lounge** / are located on the **fifth** floor. / If you need extra **towels**, / a **taxi**, / or a wake-up **call**, / simply dial **zero** / from your room **phone**.",
  },
  {
    id: "p1-13", no: 1, genre: "시상식 연설", d: 3,
    q: ["Thank you all for coming to tonight's awards ceremony. This year, our company achieved record sales, opened two new branches, and welcomed over fifty new employees. None of this would have been possible without your hard work and dedication. Now, it's my great pleasure to announce the winner of this year's Employee of the Year award.", "오늘 밤 시상식에 와 주신 모든 분께 감사드립니다. 올해 우리 회사는 사상 최고 매출을 달성했고, 지점 두 곳을 새로 열었으며, 신입 직원 50명 이상을 맞이했습니다. 이 모든 것은 여러분의 노고와 헌신이 없었다면 불가능했을 것입니다. 이제 올해의 직원상 수상자를 발표하게 되어 매우 기쁩니다."],
    guide: "Thank you all for coming / to tonight's awards **ceremony**. / This **year**, / our company achieved record **sales**, / opened **two** new branches, / and welcomed over **fifty** new employees. / **None** of this would have been possible / without your hard **work** / and **dedication**. / Now, / it's my great **pleasure** / to announce the **winner** / of this year's **Employee of the Year** award.",
  },
  {
    id: "p1-14", no: 2, genre: "매장 개점 광고", d: 2,
    q: ["Get ready for the grand opening of Sunrise Sports! Starting this Saturday, our new store on Oak Street will offer running shoes, camping gear, and fitness equipment at amazing prices. The first one hundred customers will receive a free water bottle. Come early, meet our friendly staff, and find everything you need for an active lifestyle.", "선라이즈 스포츠의 개점을 기대해 주십시오! 이번 토요일부터 오크 스트리트의 새 매장에서 러닝화, 캠핑 장비, 운동 기구를 놀라운 가격에 판매합니다. 선착순 100명의 고객에게는 물병을 무료로 드립니다. 일찍 오셔서 친절한 직원들을 만나고, 활동적인 생활에 필요한 모든 것을 찾아보십시오."],
    guide: "Get ready for the grand **opening** / of **Sunrise Sports**! / Starting this **Saturday**, / our new store on **Oak Street** / will offer running **shoes**, / camping **gear**, / and fitness **equipment** / at amazing **prices**. / The first **one hundred** customers / will receive a free water **bottle**. / Come **early**, / meet our friendly **staff**, / and find **everything** you need / for an active **lifestyle**.",
  },
  {
    id: "p1-15", no: 1, genre: "기차역 안내 방송", d: 1,
    q: ["Attention, passengers. The express train to Greenville will depart from Platform 4 in ten minutes. This train will stop at Oakdale, Riverside, and Pinehurst before arriving in Greenville. Please make sure you have your ticket ready for inspection. Also, remember that the quiet car is located at the back of the train.", "승객 여러분께 알려 드립니다. 그린빌행 급행열차가 10분 뒤 4번 승강장에서 출발합니다. 이 열차는 그린빌에 도착하기 전에 오크데일, 리버사이드, 파인허스트에 정차합니다. 검표를 위해 승차권을 준비해 주십시오. 또한 조용한 객차는 열차 맨 뒤에 있다는 점을 기억해 주십시오."],
    guide: "Attention, **passengers**. / The express train to **Greenville** / will depart from **Platform 4** / in **ten** minutes. / This train will stop at **Oakdale**, / **Riverside**, / and **Pinehurst** / before arriving in **Greenville**. / Please make sure / you have your **ticket** ready / for **inspection**. / Also, / remember that the **quiet** car / is located at the **back** of the train.",
  },
  {
    id: "p1-16", no: 2, genre: "워크숍 공지", d: 2,
    q: ["Are you interested in improving your presentation skills? Join our free one-day workshop at the Bayview Community Center on March 15. Professional speakers will teach you how to organize your ideas, use your voice effectively, and handle difficult questions. Space is limited, so please register online by Friday. We look forward to seeing you there.", "발표 실력을 키우는 데 관심이 있으십니까? 3월 15일 베이뷰 주민 센터에서 열리는 무료 하루 워크숍에 참여하십시오. 전문 강연자들이 생각을 정리하는 법, 목소리를 효과적으로 쓰는 법, 어려운 질문에 대처하는 법을 가르쳐 드립니다. 자리가 한정되어 있으니 금요일까지 온라인으로 등록해 주십시오. 그곳에서 뵙기를 기대합니다."],
    guide: "Are you interested in improving / your **presentation** skills? / Join our free **one-day** workshop / at the **Bayview Community Center** / on **March 15**. / Professional speakers will teach you / how to organize your **ideas**, / use your voice **effectively**, / and handle difficult **questions**. / Space is **limited**, / so please register **online** / by **Friday**. / We look forward to **seeing** you there.",
  },
  {
    id: "p1-17", no: 1, genre: "도서관 마감 안내", d: 1,
    q: ["Good evening, library visitors. The library will be closing in fifteen minutes. Please bring any books, magazines, or DVDs you wish to borrow to the front desk. Also, remember to log out of the computers and collect your personal belongings. The library will reopen tomorrow morning at nine o'clock. Thank you, and have a pleasant evening.", "도서관 이용객 여러분, 안녕하십니까. 도서관은 15분 뒤에 문을 닫습니다. 대출하실 책, 잡지, DVD는 안내 데스크로 가져와 주십시오. 또한 컴퓨터에서 로그아웃하시고 개인 소지품을 챙기십시오. 도서관은 내일 아침 9시에 다시 문을 엽니다. 감사합니다. 즐거운 저녁 보내십시오."],
    guide: "Good evening, library **visitors**. / The library will be **closing** / in **fifteen** minutes. / Please bring any **books**, / **magazines**, / or **DVDs** you wish to borrow / to the front **desk**. / Also, / remember to log **out** of the computers / and collect your personal **belongings**. / The library will **reopen** / tomorrow morning at **nine** o'clock. / Thank you, / and have a pleasant **evening**.",
  },
  {
    id: "p1-18", no: 2, genre: "식당 광고", d: 2,
    q: ["Looking for a special place to celebrate? Come to Giovanni's, the best Italian restaurant in town. Our talented chefs prepare fresh pasta, wood-fired pizza, and delicious desserts every day. We also have a private dining room for birthdays, business dinners, and family gatherings. Call today to make a reservation, and enjoy a free glass of juice with every meal.", "축하할 특별한 장소를 찾고 계십니까? 시내 최고의 이탈리안 레스토랑 지오바니스로 오십시오. 재능 있는 셰프들이 매일 신선한 파스타, 화덕 피자, 맛있는 디저트를 만듭니다. 생일, 업무 만찬, 가족 모임을 위한 별실도 있습니다. 오늘 전화로 예약하시고, 모든 식사에 무료 주스 한 잔을 즐기십시오."],
    guide: "Looking for a **special** place to celebrate? / Come to **Giovanni's**, / the best **Italian** restaurant in town. / Our talented chefs prepare fresh **pasta**, / wood-fired **pizza**, / and delicious **desserts** / every **day**. / We also have a private dining **room** / for **birthdays**, / business **dinners**, / and family **gatherings**. / Call **today** to make a reservation, / and enjoy a **free** glass of juice / with every **meal**.",
  },
  {
    id: "p1-19", no: 1, genre: "팟캐스트 소개", d: 3,
    q: ["Hello, and welcome to Smart Money, the podcast that helps you make better financial decisions. I'm your host, Daniel Brooks. On today's episode, we'll talk about saving for retirement, paying off credit card debt, and choosing the right bank account. Our special guest is financial planner Rebecca Lee. Let's get started!", "안녕하세요, 더 나은 재정 결정을 돕는 팟캐스트 '스마트 머니'에 오신 것을 환영합니다. 저는 진행자 대니얼 브룩스입니다. 오늘 회차에서는 노후 대비 저축, 신용카드 빚 갚기, 알맞은 은행 계좌 고르기에 대해 이야기하겠습니다. 특별 손님은 재무 설계사 레베카 리입니다. 시작해 보겠습니다!"],
    guide: "Hello, / and welcome to **Smart Money**, / the podcast that helps you / make better **financial** decisions. / I'm your host, / **Daniel Brooks**. / On today's **episode**, / we'll talk about saving for **retirement**, / paying off credit card **debt**, / and choosing the right bank **account**. / Our special **guest** / is financial planner **Rebecca Lee**. / Let's get **started**!",
  },
  {
    id: "p1-20", no: 2, genre: "공원 이용 안내", d: 1,
    q: ["Welcome to Green Valley Park. Our walking trails, picnic areas, and lake are open every day from sunrise to sunset. Bicycles are allowed only on the main path, and dogs must be kept on a leash at all times. Please help us keep the park clean by using the recycling bins near each entrance. Enjoy your visit!", "그린 밸리 공원에 오신 것을 환영합니다. 산책로, 피크닉 장소, 호수는 매일 해 뜰 때부터 해 질 때까지 개방합니다. 자전거는 주 도로에서만 탈 수 있으며, 개는 항상 목줄을 채워야 합니다. 각 입구 근처의 재활용 수거함을 이용해 공원을 깨끗하게 지키는 데 도움을 주십시오. 즐거운 방문 되십시오!"],
    guide: "Welcome to **Green Valley Park**. / Our walking **trails**, / picnic **areas**, / and **lake** / are open every **day** / from **sunrise** to **sunset**. / Bicycles are allowed **only** on the main **path**, / and dogs must be kept on a **leash** / at all **times**. / Please help us keep the park **clean** / by using the **recycling** bins / near each **entrance**. / Enjoy your **visit**!",
  },
];
