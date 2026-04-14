export const SMALL_VEHICLES = [
  { id: '1ton', label: '1톤 트럭', icon: '🚚', desc: '소형 이사 / 소형 화물' },
  { id: 'damas', label: '다마스', icon: '🚐', desc: '소량 화물 / 퀵 운송' },
  { id: 'labo', label: '라보', icon: '🛻', desc: '근거리 소형 화물' },
]

export const LARGE_VEHICLES = [
  { id: '1.4t', label: '1.4톤 트럭', icon: '🚛', desc: '중형 화물' },
  { id: '2.5t', label: '2.5톤 트럭', icon: '🚛', desc: '중형 화물' },
  { id: '3.5t', label: '3.5톤 트럭', icon: '🚛', desc: '중형 화물' },
  { id: '5t', label: '5톤 트럭', icon: '🚛', desc: '대형 화물' },
  { id: '5t-plus', label: '5톤 플러스 트럭', icon: '🚛', desc: '확장 적재' },
  { id: '8t', label: '8톤 트럭', icon: '🚛', desc: '대형 화물' },
  { id: '11t', label: '11톤 트럭', icon: '🚛', desc: '장거리 운송' },
  { id: '11t-plus', label: '11톤 플러스 트럭', icon: '🚛', desc: '확장 적재' },
]

export const BUSINESS_LARGE_VEHICLES = [
  { id: '3.5t-wide', label: '3.5톤 광폭', icon: '🚛', desc: '비즈니스 전용' },
  { id: '14t', label: '14톤 트럭', icon: '🚛', desc: '비즈니스 전용' },
  { id: '18t', label: '18톤 트럭', icon: '🚛', desc: '비즈니스 전용' },
  { id: '25t', label: '25톤 트럭', icon: '🚛', desc: '비즈니스 전용' },
]

export const ALL_VEHICLES = [
  ...SMALL_VEHICLES,
  ...LARGE_VEHICLES,
  ...BUSINESS_LARGE_VEHICLES,
]

export function parseVehicleTypeString(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function stringifyVehicleTypes(values = []) {
  return Array.from(new Set((values || []).map((item) => String(item).trim()).filter(Boolean))).join(', ')
}
