/**
 * ============================================================
 *  쥬얼리 매장 홈페이지 시안 - 설정 파일 (config.js)
 * ============================================================
 *
 *  ★ 이 파일 하나만 수정하면 홈페이지 내용이 바뀝니다 ★
 *
 *  - 매장 이름, 문구, 연락처, 상품 목록이 모두 여기 있습니다.
 *  - 값이 "" (빈칸)인 항목은 화면에서 자동으로 숨겨지거나
 *    "준비 중" 자리 표시로 나옵니다.
 *  - 문장 중간의 \n 은 "여기서 줄바꿈" 표시입니다.
 * ============================================================
 */

window.JEWELRY_CONFIG = {
  // ------------------------------------------------------------
  // 0. 미리보기(결제 전 시안) 표시
  // ------------------------------------------------------------
  // true  : "미리보기 · 결제 전 시안입니다" 표시와 흐린 워터마크가 나옵니다.
  // false : 표시가 사라지고 정식 홈페이지가 됩니다. (잔금 확인 후 false 로)
  previewMode: true,

  // ------------------------------------------------------------
  // 0-1. 맨 아래 안내 구역
  // ------------------------------------------------------------
  // show: true  → "홈페이지 안내" (이 홈페이지에 무엇이 들어 있는지와 제작 가격)
  // show: false → "매장 안내" (전화·주소·영업시간) - 실제 매장에 넘길 때 false 로
  siteInfo: {
    show: true,
    title: "홈페이지 안내",
    body: "쥬얼리 매장을 위한 홈페이지 시안입니다. 매장 사진과 정보만 보내 주시면 이 모습 그대로 만들어 드립니다.",
    features: [
      { title: "휴대폰·PC 모두", desc: "손님 대부분이 보는 휴대폰 화면에 맞춰 만듭니다." },
      { title: "홈페이지에서 바로 주문", desc: "제품을 누르면 주문서가 열리고, 인스타그램 DM·카카오톡·문자로 주문이 들어옵니다. 스토어 수수료가 없습니다." },
      { title: "유튜브 → 주문 연결", desc: "유튜브 영상 설명·고정 댓글의 링크를 누르면 영상 속 제품 주문서가 바로 열리고, 유튜브에서 온 주문인지 표시됩니다." },
      { title: "결제 전 시안 확인", desc: "지금 보시는 것처럼 시안을 먼저 보고 결정하실 수 있습니다." },
    ],
  },

  // ------------------------------------------------------------
  // 1. 매장 기본 정보 (확인 필요: 스토어 주소를 보고 짐작한 이름입니다)
  // ------------------------------------------------------------
  storeName: "Finest Jewelry",
  storeNameKo: "파이니스트 주얼리",
  tagline: "매일 끼고 싶은, 오래 남는 반짝임",

  // 연락처 - 빈칸이면 버튼이 숨겨집니다
  // ※ 지금 값은 시안용 가상 정보입니다. 실제 정보를 받으면 바꿔 주세요.
  phone: "010-0000-0000",
  address: "OO시 OO구 OO로 123, 1층",
  hours: "매일 11:00 – 20:00 (월요일 휴무)",

  // 바로가기 주소
  // "#demo" 는 시안용 가상 링크입니다. 누르면 "가상 링크" 안내만 뜹니다.
  links: {
    smartstore: "https://smartstore.naver.com/finest_jewelry", // 매장 안내에만 나옵니다 (구매 버튼은 아래 주문서로 연결)
    dm: "#demo", // 인스타그램 DM 주소 (예: https://ig.me/m/인스타아이디) - 누르면 DM 창이 바로 열립니다
    kakao: "#demo", // 카카오톡 채널 주소 (예: https://pf.kakao.com/_xxxx)
    naverPlace: "#demo", // 네이버플레이스 주소
    instagram: "#demo",
    youtube: "#demo", // 유튜브 채널 주소
  },

  // ------------------------------------------------------------
  // 1-1. 주문서 (스마트스토어 대신 홈페이지에서 바로 주문받기)
  // ------------------------------------------------------------
  // 제품을 누르면 주문서가 열리고, 손님이 고른 내용이 주문 메시지로 만들어집니다.
  //   - 인스타그램 DM / 카카오톡 : 주문 내용이 복사된 채로 대화창이 열려, 붙여넣기만 하면 됩니다
  //   - 문자 : 주문 내용이 미리 채워진 문자 창이 열립니다 (위 phone 번호로)
  // 쓰지 않을 방법은 channels 에서 지우면 버튼이 사라집니다.
  //
  // ★ 유튜브에서 주문 받기 (유튜브에는 DM 기능이 없어서 링크로 연결합니다)
  //   영상 설명란·고정 댓글에 아래 주소를 넣으면, 누른 손님에게 주문서가 바로 열리고
  //   주문 메시지에 "유튜브 영상 보고 주문해요"가 붙어 유튜브 손님인지 알 수 있습니다.
  //     루미에르 4종 세트 : https://okaissem.github.io/jewelry/?from=youtube&order=lumiere-set
  //     특정 제품        : https://okaissem.github.io/jewelry/?from=youtube&order=emerald-ring  (제품의 id)
  //     홈페이지 첫 화면  : https://okaissem.github.io/jewelry/?from=youtube
  order: {
    channels: ["dm", "kakao", "sms"],
    ringSizes: ["5호", "7호", "9호", "11호", "13호", "15호", "17호", "19호"],
    // 유튜브에서 온 손님에게 화면 아래에 띄우는 안내 (빈칸이면 안 띄웁니다)
    youtubeWelcome: "유튜브 시청자님, 영상 속 루미에르 세트를 20% 할인가로 주문하세요",
    youtubeWelcomeItem: "lumiere-set",
  },

  // ------------------------------------------------------------
  // 2. 첫 화면
  // ------------------------------------------------------------
  hero: {
    eyebrow: "HANDPICKED JEWELRY",
    headline: "당신의 하루에\n작은 빛 하나",
    subCopy: "반지 · 목걸이 · 귀걸이 · 팔찌\n매일 착용해도 편안한 쥬얼리를 고릅니다.",
    // 첫 화면 큰 반지 이미지 (배경이 투명한 PNG). 빈칸이면 그림(SVG)으로 나옵니다.
    image: "images/hero-ring.png",
  },

  // ------------------------------------------------------------
  // 3. 브랜드 이야기 + 약속 3가지
  // ------------------------------------------------------------
  story: {
    title: "고르는 기준이 다릅니다",
    body: "유행보다 오래 사랑받는 디자인, 사진보다 실물이 더 예쁜 제품만 매장에 올립니다.",
    points: [
      { title: "정품 소재", desc: "14K·18K·925 실버 등 소재를 정확하게 안내합니다." },
      { title: "선물 포장", desc: "케이스와 쇼핑백, 메시지 카드까지 무료로 준비해 드립니다." },
      { title: "사후 관리", desc: "세척·사이즈 조절 등 구매 후 관리도 도와드립니다." },
    ],
  },

  // ------------------------------------------------------------
  // 3-1. 루미에르 컬렉션 (같은 디자인의 반지·목걸이·귀걸이·팔찌 세트)
  // ------------------------------------------------------------
  // setDiscount: 4종을 함께 사면 깎아 주는 비율(%) - 세트 가격은 자동 계산됩니다
  // 가격·사진은 시안용 가상 정보입니다 (목걸이·귀걸이·팔찌 사진은 3D로 그린 것)
  lumiere: {
    title: "루미에르 컬렉션",
    desc: "빛을 뜻하는 루미에르. 6발로 감싼 라운드 다이아몬드를 반지부터 목걸이, 귀걸이, 팔찌까지 같은 디자인으로 맞췄습니다.",
    setDiscount: 20,
    items: [
      { id: "lumiere-ring", name: "루미에르 반지", category: "반지", price: "89,000원", image: "images/01-solitaire-ring-photo.jpg", virtual: true },
      { id: "lumiere-necklace", name: "루미에르 목걸이", category: "목걸이", price: "79,000원", image: "images/13-lumiere-necklace.jpg", virtual: true },
      { id: "lumiere-earrings", name: "루미에르 귀걸이", category: "귀걸이", price: "59,000원", image: "images/14-lumiere-earrings.jpg", virtual: true },
      { id: "lumiere-bracelet", name: "루미에르 팔찌", category: "팔찌", price: "99,000원", image: "images/15-lumiere-bracelet.jpg", virtual: true },
    ],
  },

  // ------------------------------------------------------------
  // 4. 상품 (시안용 예시 - 실제 상품 사진·이름으로 바꿔 주세요)
  // ------------------------------------------------------------
  // category: 반지 / 목걸이 / 귀걸이 / 팔찌 중 하나
  // image   : 사진 파일 경로 (빈칸이면 예시 그림이 나옵니다)
  //           지금 images/ 폴더의 사진은 3D로 그린 시안용 가상 이미지입니다.
  // virtual : true 이면 사진 위에 "가상 이미지" 표시 (실제 사진으로 바꾸면 지워 주세요)
  // gem     : 예시 그림의 보석 색 (image 가 있으면 쓰지 않습니다)
  // metal   : 예시 그림의 금속 색 - gold / rose / silver
  // price   : 판매 가격 (빈칸이면 "스토어에서 가격 보기"로 나옵니다) - 지금 값은 가상 가격
  // id      : 주문 바로가기 주소에 쓰는 영문 이름 (예: ?order=emerald-ring) - 겹치지 않게
  categories: ["반지", "목걸이", "귀걸이", "팔찌"],
  products: [
    { id: "diamond-ring", name: "루미에르 다이아몬드 반지", price: "89,000원", category: "반지", metal: "gold", gem: "#f4f7ff", virtual: true, image: "images/01-solitaire-ring-photo.jpg" },
    { id: "eternity-ring", name: "이터니티 라인 반지", price: "129,000원", category: "반지", metal: "rose", gem: "#ffe3ea", virtual: true, image: "images/02-eternity-ring.jpg" },
    { id: "emerald-ring", name: "에메랄드 포인트 반지", price: "159,000원", category: "반지", metal: "gold", gem: "#3fb37f", virtual: true, image: "images/03-emerald-ring.jpg" },
    { id: "silver-ring", name: "데일리 실버 반지", price: "39,000원", category: "반지", metal: "silver", gem: "#dfe8ff", virtual: true, image: "images/04-silver-ring.jpg" },
    { id: "pearl-necklace", name: "한 알 진주 목걸이", price: "69,000원", category: "목걸이", metal: "gold", gem: "#fbf4e8", virtual: true, image: "images/05-pearl-necklace.jpg" },
    { id: "heart-necklace", name: "하트 펜던트 목걸이", price: "79,000원", category: "목걸이", metal: "rose", gem: "#ff8fa8", virtual: true, image: "images/06-heart-necklace.jpg" },
    { id: "sapphire-necklace", name: "사파이어 드롭 목걸이", price: "149,000원", category: "목걸이", metal: "silver", gem: "#4a6cf0", virtual: true, image: "images/07-sapphire-necklace.jpg" },
    { id: "ball-earrings", name: "미니 볼 귀걸이", price: "29,000원", category: "귀걸이", metal: "gold", gem: "#f4f7ff", virtual: true, image: "images/08-ball-earrings.jpg" },
    { id: "pearl-earrings", name: "진주 드롭 귀걸이", price: "59,000원", category: "귀걸이", metal: "silver", gem: "#fbf4e8", virtual: true, image: "images/09-pearl-earrings.jpg" },
    { id: "ruby-earrings", name: "루비 스터드 귀걸이", price: "99,000원", category: "귀걸이", metal: "rose", gem: "#d8344f", virtual: true, image: "images/10-ruby-earrings.jpg" },
    { id: "tennis-bracelet", name: "테니스 팔찌", price: "119,000원", category: "팔찌", metal: "gold", gem: "#f4f7ff", virtual: true, image: "images/11-tennis-bracelet.jpg" },
    { id: "chain-bracelet", name: "체인 레이어드 팔찌", price: "49,000원", category: "팔찌", metal: "gold", gem: "#f7d774", virtual: true, image: "images/12-chain-bracelet.jpg" },
  ],

  // ------------------------------------------------------------
  // 5. 영상
  // ------------------------------------------------------------
  // videoId : 유튜브 영상 주소 끝의 ID (예: https://youtu.be/AbCdEf12345 → "AbCdEf12345")
  //           넣으면 유튜브 영상이 우선 나옵니다.
  // video   : 홈페이지에 직접 올린 영상 파일 (videoId 가 빈칸일 때 사용)
  //           지금 영상은 AI 이미지로 만든 시안용 가상 광고입니다 (음악은 직접 합성)
  //           3D로 만든 광고는 video/finest-jewelry-ad.mp4 에 남아 있습니다
  // 둘 다 빈칸이면 "영상이 들어갈 자리" 표시가 나옵니다.
  youtube: {
    title: "20초 광고로 먼저 만나보세요",
    desc: "빛을 받아 반짝이는 순간은 영상으로 보는 게 가장 정확합니다. 소리를 켜고 재생해 보세요.",
    videoId: "",
    video: "video/finest-jewelry-ad-photo.mp4",
    poster: "video/finest-jewelry-ad-photo-poster.jpg",
  },

  // ------------------------------------------------------------
  // 6. 선물 안내
  // ------------------------------------------------------------
  gift: {
    title: "선물하기 좋은 날",
    items: ["기념일·생일", "프러포즈", "어버이날·스승의 날", "졸업·입학"],
    desc: "예산과 받는 분 취향을 알려 주시면 어울리는 제품을 골라 드립니다.",
  },
};
