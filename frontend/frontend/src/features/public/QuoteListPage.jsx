export default function QuoteListPage({ controller }) {
  return (
    <div className="public-shell">
      <button onClick={() => controller.setDashboardTab("home")}>
        메인으로 돌아가기
      </button>
      <h1>견적 목록</h1>

      {/* 전체 견적 개수 표시
          - 서버에서 totalCount 받아오기
          - 예: "전체 23건의 견적이 등록되어 있습니다"
      */}
      <p>전체 (전체 견적 등록 수)건의 견적이 등록되어있습니다.</p>

      {/*필터 영역 
        - 진행 상태, 출발지, 도착지 select
        - 선택시 controller 상태 변경
        - 선택값에 따라 리스트 재조회
      */}
      <p>select (진행상태, 출발지, 도착지) 선택할때마다 해당 결과 나오게</p>

      {/* 추가 옵션 영역
          - 체크박스: 진행중인 공고만 보기
          - select: n개씩 보기 (페이지 사이즈)
          - 변경 시 리스트 재조회
      */}
      <p>진행중인 공고만 보기 / n개씩 보기 / 견적 등록 버튼</p>
      <input
        className="toolbar-search"
        placeholder="제목, 지역, 화물 종류 검색"
      />
      <button onClick={() => controller.setDashboardTab("quoteRegister")}>
        견적 요청하기
      </button>

      {/* 리스트 영역 (추후 추가)
          - 견적 카드/테이블 형태로 출력
          - map으로 반복 렌더링
          - 각 견적 클릭 시 상세 페이지 이동
      */}
      <p></p>
    </div>
  );
}
