import { motion } from "framer-motion";
import { Clock, User, Edit2, Trash2, Calendar } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import type { Shift, ShiftWeek, User as UserType } from "../../types";
import { fmtDateLong, fmtTimeRange } from "../../utils/datetime";

interface WeekScheduleViewProps {
    week: ShiftWeek | null;
    employees: UserType[];
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
                <span className="empty-icon">
                    <Calendar size={40} style={{ color: "var(--brand)" }} />
                </span>
                <h3>אין משמרות להצגה בשבוע זה</h3>
                <p>
                    לא נמצאו משמרות עבור היחידה. ניתן להעלות קובץ שיבוץ באקסל
                    בכל עת.
                </p>
            </div>
        );
    }

    const employeeMap = new Map<string, string>();
    employees.forEach((emp) => {
        employeeMap.set(emp.employeeCode, emp.fullName);
    });

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
                                        <motion.article
                                            key={shift.id}
                                            className={`shift-card status-${shift.status}`}
                                            whileHover={{ y: -3 }}
                                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                            layout
                                        >
                                            <header className="shift-card-header">
                                                <span className="shift-time" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                                    <Clock size={13} style={{ opacity: 0.6 }} />
                                                    <span>
                                                        {fmtTimeRange(
                                                            shift.startTime,
                                                            shift.endTime,
                                                        )}
                                                    </span>
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
                                                <div className="shift-employee-info" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <User size={13} style={{ opacity: 0.6 }} />
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
                                                <motion.button
                                                    type="button"
                                                    className="btn-edit-shift"
                                                    onClick={() =>
                                                        onEditShift(shift)
                                                    }
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                        <Edit2 size={12} />
                                                        <span>ערוך</span>
                                                    </span>
                                                </motion.button>
                                                <motion.button
                                                    type="button"
                                                    className="btn-delete-shift"
                                                    onClick={() =>
                                                        handleDelete(shift)
                                                    }
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                        <Trash2 size={12} />
                                                        <span>מחק</span>
                                                    </span>
                                                </motion.button>
                                            </footer>
                                        </motion.article>
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
