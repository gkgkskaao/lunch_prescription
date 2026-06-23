/* 프로토타입: 인라인 데이터. 상용화 시 /data API(JSON)로 분리 예정 */

export const DATA = {
  quiz: [
    {
      id: 'q1',
      question: '오늘, 혀가 원하는 맛은?',
      options: [
        { label: '🍃 자극 없이 슴슴하게', tags: ['mild'] },
        { label: '🌶️ 콧등에 땀나게 맵게', tags: ['spicy'] },
        { label: '🧀 기름지고 진하게', tags: ['greasy'] },
      ],
    },
    {
      id: 'q2',
      question: '지금 당신의 멘탈 상태는?',
      options: [
        { label: '번아웃, 그냥 쉬고 싶다', tags: ['tired'] },
        { label: '오늘 누가 날 빡치게 함', tags: ['angry'] },
        { label: '꾸역꾸역 버티는 중', tags: ['survive'] },
      ],
    },
    {
      id: 'q3',
      question: '점심 예산, 솔직하게.',
      options: [
        { label: '카드값 무서운 거지', tags: ['broke'] },
        { label: '오늘은 좀 쓴다', tags: ['rich'] },
      ],
    },
  ],
  results: [
    {
      id: 'pyeongnaengmyeon',
      tags: ['mild', 'tired', 'broke'],
      menu: '평양냉면',
      message: '맵고 자극적인 거에 절여진 혀로 평냉을 시키네. 어른 다 됐다. 첫 입엔 "이게 무슨 맛이야" 싶다가 결국 국물까지 들이켜는 게 인생임. 자극 없는 게 제일 사치인 거, 오늘 알게 될 거임.',
      dosage: '면치기 금지, 천천히 음미',
      sideEffect: '"이게 맛있나?" 3분 후 중독',
      combo: '수육 한 점 (선택)',
      share: '결정장애로 30분 날리다 평양냉면 처방받음 🍜 슴슴한 게 어른의 맛이라며? #점심처방전 #평양냉면 #결정장애_치료완료',
    },
    {
      id: 'maeun-galbijjim',
      tags: ['spicy', 'angry', 'rich'],
      menu: '매운 갈비찜',
      message: '오늘 세상이 너한테 한 짓, 그 매운맛으로 갚아주려는 거 다 앎. 입안 얼얼하게 만들어서 머릿속 빡침 잠깐 잊자는 거잖아. 단, 내일 아침 화장실에서 한 번 더 매워질 각오는 하고 시켜라.',
      dosage: '밥 두 공기 필수, 우유 대기',
      sideEffect: '내일 아침 2차 매운맛',
      combo: '아이스 음료 1.5L',
      share: '빡친 날엔 매운 갈비찜 처방 🌶️🔥 세상아 덤벼라 (입은 이미 항복함) #점심처방전 #매운갈비찜 #스트레스_혀로_해소',
    },
    {
      id: 'cheese-donkatsu',
      tags: ['greasy', 'survive', 'rich'],
      menu: '치즈 돈까스',
      message: '다이어트? 그건 내일의 네가 할 일이고. 오늘의 넌 치즈 폭포에 돈까스 적셔 먹을 권리가 있음. 느끼한 거 당길 때 안 먹으면 그게 더 스트레스임. 콜라 시켜서 같이 때려넣으셈.',
      dosage: '치즈 늘어날 때 사진 필수',
      sideEffect: '오후 3시 식곤증 + 죄책감',
      combo: '제로콜라 (양심)',
      share: '버티는 중엔 치즈 돈까스 처방받음 🧀 다이어트는 내일의 내가 함 #점심처방전 #치즈돈까스 #느끼함이_답이다',
    },
    {
      fallback: true,
      id: 'kimchijjigae',
      tags: [],
      menu: '김치찌개',
      message: '메뉴 고민하다 점심시간 다 날린 거 실화임? 결정장애도 병이라니까. 그럴 땐 묻지도 따지지도 말고 김치찌개 가. 한국인 디폴트값엔 실패가 없음. 가끔은 남이 골라주는 대로 사는 게 맘 편함.',
      dosage: '공깃밥 추가는 국룰',
      sideEffect: '없음 (검증된 안전성)',
      combo: '계란말이 (있으면)',
      share: '뭐 먹을지 몰라서 김치찌개 처방받음 🍲 한국인 디폴트값은 실패가 없음 #점심처방전 #김치찌개 #무난한게_최고',
    },
  ],
};

export const LOADING_MESSAGES = [
  '처방전 조제 중...',
  '오늘의 당신을 진단하는 중...',
  '결정장애 치료제 선별 중...',
];
