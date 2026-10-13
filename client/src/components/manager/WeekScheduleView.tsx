import { useUiStore } from "../../store/uiStore";
import type { Shift, ShiftWeek, User } from "../../types";
import { fmtDateLong, fmtTimeRange } from "../../utils/datetime";

interface WeekScheduleViewProps {
    week: ShiftWeek | null;
    employees: User[];
    onEditShift: (shift: Shift) => void;
    onDeleteShift: (shiftId: number) => Promise<void>;
}

const WeekScheduleView = ({
    week,
    employees,
    onEditShift,
    onDeleteShift,
}: WeekScheduleViewProps) => {
    if (!week || !week.shifts || week.shifts.length === 0) {
        return (
            <div className="empty-schedule-card">
                <span className="empty-icon">📅</span>
                <h3>אין משמרות להצגה בשבוע זה</h3>
                <p>
                    לא נמצאו משמרות עבור היחידה. ניתן להעלות קובץ שיבוץ באקסל
                    ביום חמישי.
                </p>
            </div>
        );
    }

    const employeeMap = new Map<string, string>();
    employees.forEach((emp) => {
        employeeMap.set(emp.employeeCode, emp.fullName);
    });

    // Group shifts by date string
    const shiftsByDay = new Map<string, Shift[]>();
    week.shifts.forEach((shift) => {
        const dayKey = shift.startTime
            ? shift.startTime.split("T")[0]
            : "unknown";
        const current = shiftsByDay.get(dayKey) || [];
        current.push(shift);
        shiftsByDay.set(dayKey, current);
    });

    const sortedDayKeys = Array.from(shiftsByDay.keys()).sort();

    const handleDelete = async (shift: Shift) => {
        const empName =
            employeeMap.get(shift.assignedEmployeeCode) ||
            `#${shift.assignedEmployeeCode}`;
        const ok = await useUiStore.getState().confirm({
            title: "מחיקת משמרת",
            message: `למחוק את המשמרת של ${empName}? אם קיימת עליה בקשת החלפה — היא תיסגר.`,
            confirmLabel: "מחק משמרת",
            danger: true,
        });
        if (ok) await onDeleteShift(shift.id);
    };

    return (
        <div className="week-schedule-view">
            <header className="schedule-header-meta">
                <h2>שבוע מספר {week.weekNumber}</h2>
                <span className="unit-tag">יחידה: {week.unitName}</span>
                <span className="total-shifts-tag">
                    סה״כ משמרות: {week.shifts.length}
                </span>
            </header>

            <div className="days-columns-container">
                {sortedDayKeys.map((dayKey) => {
                    const dayShifts = shiftsByDay.get(dayKey) || [];
                    const dayTitle = fmtDateLong(`${dayKey}T00:00:00Z`);

                    return (
                        <div key={dayKey} className="day-column">
                            <div className="day-column-header">
                                <h4>{dayTitle}</h4>
                                <span className="day-date">{dayKey}</span>
                            </div>

                            <div className="day-shifts-list">
                                {dayShifts.map((shift) => {
                                    const employeeName =
                                        employeeMap.get(
                                            shift.assignedEmployeeCode,
                                        ) ||
                                        `עובד #${shift.assignedEmployeeCode}`;

                                    return (
                                        <article
                                            key={shift.id}
                                            className={`shift-card status-${shift.status}`}
                                        >
                                            <header className="shift-card-header">
                                                <span className="shift-time">
                                                    ⏰{" "}
                                                    {fmtTimeRange(
                                                        shift.startTime,
                                                        shift.endTime,
                                                    )}
                                                </span>
                                                <span
                                                    className={`shift-badge badge-${shift.status}`}
                                                >
                                                    {shift.status ===
                                                    "swap_pending"
                                                        ? "בהמתנה להחלפה"
                                                        : "משובץ"}
                                                </span>
                                            </header>

                                            <div className="shift-card-body">
                                                {shift.title && (
                                                    <h5 className="shift-title">
                                                        {shift.title}
                                                    </h5>
                                                )}
                                                <div className="shift-employee-info">
                                                    👤{" "}
                                                    <strong>
                                                        {employeeName}
                                                    </strong>
                                                    <span className="emp-code">
                                                        (#
                                                        {
                                                            shift.assignedEmployeeCode
                                                        }
                                                        )
                                                    </span>
                                                </div>
                                            </div>

                                            <footer className="shift-card-actions">
                                                <button
                                                    type="button"
                                                    className="btn-edit-shift"
                                                    onClick={() =>
                                                        onEditShift(shift)
                                                    }
                                                >
                                                    ערוך
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-delete-shift"
                                                    onClick={() =>
                                                        handleDelete(shift)
                                                    }
                                                >
                                                    מחק
                                                </button>
                                            </footer>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeekScheduleView;
