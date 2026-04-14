/* 소형 차량 */
export const SMALL_VEHICLES = [
  { id: "1ton", label: "1톤 트럭", icon: "🚚", desc: "소형 이사 / 소형 화물" },
  { id: "damas", label: "다마스", icon: "🚐", desc: "소량 화물 / 퀵 운송" },
  { id: "labo", label: "라보", icon: "🛻", desc: "근거리 소형 화물" },
];

/* 대형 차량 - 일반 목록 */
export const LARGE_VEHICLES = [
  { id: "1.4t", label: "1.4톤 트럭", icon: "🚛", desc: "중형 화물" },
  { id: "2.5t", label: "2.5톤 트럭", icon: "🚛", desc: "중형 화물" },
  { id: "3.5t", label: "3.5톤 트럭", icon: "🚛", desc: "중형 화물" },
  { id: "5t", label: "5톤 트럭", icon: "🚛", desc: "대형 화물" },
  { id: "5t-plus", label: "5톤 플러스 트럭", icon: "🚛", desc: "확장 적재" },
  { id: "8t", label: "8톤 트럭", icon: "🚛", desc: "대형 화물" },
  { id: "11t", label: "11톤 트럭", icon: "🚛", desc: "장거리 운송" },
  { id: "11t-plus", label: "11톤 플러스 트럭", icon: "🚛", desc: "확장 적재" },
];

/* 대형 차량 - 비즈니스 전용 */
export const BUSINESS_LARGE_VEHICLES = [
  { id: "3.5t-wide", label: "3.5톤 광폭", icon: "🚛", desc: "비즈니스 전용" },
  { id: "14t", label: "14톤 트럭", icon: "🚛", desc: "비즈니스 전용" },
  { id: "18t", label: "18톤 트럭", icon: "🚛", desc: "비즈니스 전용" },
  { id: "25t", label: "25톤 트럭", icon: "🚛", desc: "비즈니스 전용" },
];

/* 화물 종류 */
export const CARGO_TYPES = [
  {
    id: "home-appliance",
    label: "가전",
    icon: "📺",
    desc: "냉장고, 세탁기, TV 등",
  },
  {
    id: "furniture",
    label: "가구",
    icon: "🛋️",
    desc: "침대, 책상, 의자, 장롱 등",
  },
  { id: "food", label: "식자재", icon: "🥬", desc: "신선식품, 냉장/냉동 식품" },
  { id: "box", label: "박스류", icon: "📦", desc: "택배 박스, 이삿짐 박스 등" },
  {
    id: "machinery",
    label: "기계/장비",
    icon: "⚙️",
    desc: "공구, 장비, 산업용 기기",
  },
  {
    id: "construction",
    label: "건축자재",
    icon: "🧱",
    desc: "목재, 철근, 자재류",
  },
  {
    id: "document",
    label: "서류/소형물품",
    icon: "📄",
    desc: "서류, 소형 포장 물품",
  },
  { id: "etc", label: "기타", icon: "🧩", desc: "직접 화물명에 자세히 작성" },
];
