import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Clock } from "lucide-react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function EmployeeShift() {
  const [shifts, setShifts] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    api
      .get(
        `/my-shifts?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      )
      .then((res) => setShifts(res.data.data || []))
      .catch(() => setShifts([]));
  }, [month, year]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const getDaysInMonth = () => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = () => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfWeek();
  const today = new Date();
  const shiftMap = {};
  shifts.forEach((s) => {
    const d = new Date(s.date);
    shiftMap[d.getDate()] = s;
  });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <h1 className="text-2xl font-bold">My Shift</h1>
      <p className="text-text-secondary text-sm mb-6">
        View your assigned shifts
      </p>
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="px-3 sm:px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors"
          >
            &larr; Prev
          </button>
          <h2 className="text-base sm:text-lg font-bold">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="px-3 sm:px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors"
          >
            Next &rarr;
          </button>
        </div>
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {weekdays.map((day) => (
            <div
              key={day}
              className="bg-page-bg px-1 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-semibold text-text-secondary uppercase"
            >
              {day}
            </div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="bg-card min-h-[50px] sm:min-h-[80px]"
            />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const assignment = shiftMap[day];
            const isToday =
              today.getDate() === day &&
              today.getMonth() === month &&
              today.getFullYear() === year;
            const dayOfWeek = new Date(year, month, day).getDay();
            const isWeekend = assignment?.shift?.weekends?.includes(dayOfWeek);
            return (
              <div
                key={day}
                className={`min-h-[50px] sm:min-h-[80px] p-1 sm:p-2 ${isWeekend ? "bg-amber-50" : "bg-card"} ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
              >
                <div
                  className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${isToday ? "text-primary font-bold" : isWeekend ? "text-amber-600" : "text-text-primary"}`}
                >
                  {day}
                  {isWeekend && (
                    <span className="ml-0.5 text-[9px] sm:text-[10px] text-amber-400 font-normal">
                      W
                    </span>
                  )}
                </div>
                {isWeekend ? (
                  <div className="text-[9px] sm:text-[11px] text-amber-500 font-medium">
                    Weekend
                  </div>
                ) : assignment && assignment.shift ? (
                  <div className="bg-primary/10 text-primary rounded px-1 py-0.5 text-[9px] sm:text-[11px] font-medium leading-tight">
                    <div>{assignment.shift.name}</div>
                    <div className="hidden sm:block">
                      {assignment.shift.startTime} - {assignment.shift.endTime}
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] sm:text-[11px] text-text-secondary">
                    No shift
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {shifts.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-border">
            <h2 className="font-semibold">Shift Schedule</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-border bg-page-bg/50">
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">
                    Shift
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">
                    Time
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">
                    Grace
                  </th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => {
                  const dayOfWeek = new Date(s.date).getDay();
                  const isWeekend = s.shift?.weekends?.includes(dayOfWeek);
                  return (
                    <tr
                      key={s._id}
                      className={`border-b border-border last:border-0 ${isWeekend ? "bg-amber-50" : ""}`}
                    >
                      <td className="px-4 sm:px-6 py-4 text-sm">
                        {new Date(s.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                        {isWeekend ? (
                          <span className="text-amber-500">Weekend</span>
                        ) : (
                          s.shift?.name
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">
                        {isWeekend
                          ? "-"
                          : `${s.shift?.startTime} - ${s.shift?.endTime}`}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">
                        {isWeekend ? "-" : `${s.shift?.graceMinutes} min`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
