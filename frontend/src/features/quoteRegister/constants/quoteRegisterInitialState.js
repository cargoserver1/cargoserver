export const QUOTE_REGISTER_INITIAL_STATE = {
  // ===== 기본 정보 =====
  estimateName: "", // 게시글 제목 (견적 제목)
  originAddress: "", // 출발지 주소 (메인 주소)
  originDetailAddress: "", // 출발지 상세 주소 (층수, 엘리베이터 여부 등 포함 가능)
  destinationAddress: "", // 도착지 주소 (메인 주소)
  destinationDetailAddress: "", // 도착지 상세 주소
  transportDate: "", // 운송 날짜 (YYYY-MM-DD)
  transportTime: "", // 운송 시간 (HH:mm)

  // ===== 차량 정보 =====
  vehicleType: "", // 선택된 차량 종류 (예: "다마스", "1톤 트럭")
  vehicleNeedConsult: false, // 차량 상담 필요 여부 (true면 차량 미선택 상태로 상담 요청)

  // ===== 화물 정보 =====
  cargoType: "", // 화물 종류 카테고리 (예: 가전, 가구, 식자재 등)
  cargoName: "", // 화물 상세 이름 (예: 냉장고, 세탁기)

  // ===== 중량 정보 =====
  weight: "", // 입력된 중량 값 (문자열로 관리), 서버 전송 시에는 반드시 숫자(Number)로 변환됨

  weightUnit: "kg", // 입력 단위 ("kg" 또는 "t"), 서버 전송 시에는 항상 "kg"로 변환해서 전달됨

  weightNeedConsult: false, // 중량 상담 필요 여부 (true면 weight는 null로 전송)

  // ===== 추가 요청 =====
  requestNote: "", // 요청사항 (자유 텍스트)

  // ===== 가격 정보 =====
  desiredPrice: "", // 희망 운임 (문자열로 입력), 서버 전송 시 숫자(Number)로 변환됨
  priceProposalAllowed: false, // 기사 제안 허용 여부 (true면 가격 협의 가능)

  // ===== 첨부 파일 =====
  cargoImages: [], // 첨부 이미지 배열 (File 객체 배열), 서버 전송 시 FormData 또는 별도 업로드 처리 필요
};

/*
백엔드 알아야 하는 내용
1. 중량 처리 -> 항상 kg 기준 숫자만 받으면 됨
프론트: 3 + t
서버 전송: 3000 + kg

2. 가격 타입
프론트: string ("3000000")
서버: number (3000000)

3. 이미지
cargoImages는 File 배열
그대로 JSON으로 못 보냄

반드시: FormData 사용하거나 presigned URL 방식 필요
*/
