import { useMemo, useState } from "react";

const TIME_OPTIONS = [
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

export default function SchedulePanel({
  transportDate,
  transportTime,
  updateField,
  closePanel,
}) {
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(transportDate || today);
  const [selectedTime, setSelectedTime] = useState(transportTime || "");

  // 현재 시간 기준 HH:mm 생성
  const nowTime = useMemo(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = now.getMinutes();

    // 30분 단위 맞추기 (중요)
    const rounded = mm < 30 ? "30" : "00";

    const hourAdjusted =
      mm < 30 ? hh : String(now.getHours() + 1).padStart(2, "0");

    return `${hourAdjusted}:${rounded}`;
  }, []);

  // 시간 필터링
  const filteredTimes = useMemo(() => {
    // 오늘이 아니면 전체 허용
    if (selectedDate !== today) return TIME_OPTIONS;

    // 오늘이면 현재시간 이후만
    return TIME_OPTIONS.filter((time) => time >= nowTime);
  }, [selectedDate, nowTime, today]);

  const handleDateChange = (e) => {
    const value = e.target.value;

    setSelectedDate(value);
    updateField("transportDate", value);

    // 날짜 바뀌면 시간 초기화
    setSelectedTime("");
    updateField("transportTime", "");
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    updateField("transportDate", selectedDate);
    updateField("transportTime", time);
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;

    updateField("transportDate", selectedDate);
    updateField("transportTime", selectedTime);

    closePanel();
  };

  return (
    <div className="schedule-panel">
      <div className="side-panel-header">
        <h3>운송일자</h3>
        <button
          type="button"
          className="panel-close-button"
          onClick={closePanel}
        >
          ×
        </button>
      </div>

      <div className="schedule-vertical-layout">
        {/* 날짜 */}
        <div className="schedule-date-section">
          <div className="schedule-section-header">출발일자</div>

          <div className="schedule-date-card">
            <input
              type="date"
              value={selectedDate}
              min={today}
              onChange={handleDateChange}
              className="schedule-date-input"
            />
          </div>
        </div>

        {/* 시간 */}
        <div className="schedule-time-section">
          <div className="schedule-section-header">출발일자 도착 시간</div>

          <div className="schedule-time-list-box">
            {filteredTimes.map((time) => {
              const isSelected = selectedTime === time;

              return (
                <button
                  key={time}
                  type="button"
                  className={`schedule-time-item ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </button>
              );
            })}

            {/* 예외 케이스 */}
            {filteredTimes.length === 0 && (
              <div style={{ padding: "16px", color: "#999" }}>
                선택 가능한 시간이 없습니다
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="schedule-confirm-button"
        onClick={handleConfirm}
        disabled={!selectedDate || !selectedTime}
      >
        확인
      </button>
    </div>
  );
}
