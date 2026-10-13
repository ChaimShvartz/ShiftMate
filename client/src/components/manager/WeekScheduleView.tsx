import type React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useUiStore } from "../../store/uiStore";
import type { Shift, ShiftWeek, User } from "../../types";
import { dayKey, fmtDayMonth, fmtTimeRange, fmtWeekday, isToday, nowFloating } from "../../utils/datetime";
import { personClass } from "../../utils/person";
import { matches } from "../../utils/search";
import Avatar from "../ui/Avatar";

interface Props {
    week: ShiftWeek | null;
    employees: User[];
    query: string;
    onEditShift: (shift: Shift) => void;
    onDeleteShift: (shiftId: number) => Promise<void>;
    onAddShift: (employeeCode: string, date: string) => void;
}

// People × days. Each cell lists that person's shifts for that day.
export default function WeekScheduleView({ week, employees, query, onEditShift, onDeleteShift, onAddShift }: Props) {
    const shifts = useMemo(() => week?.shifts ?? [], [week]);

    // Always the full Sunday-Saturday week, so a shift can be added on an empty day.
    const days = useMemo(() => {
        if (!week) return [];
        const a = new Date(week.weekStartDate);
        const sunday = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()) - a.getUTCDay() * 864e5;
        return Array.from({ length: 7 }, (_, i) => new Date(sunday + i * 864e5).toISOString().slice(0, 10));
    }, [week]);
    const today = nowFloating().toISOString().slice(0, 10);

    const rows = useMemo(() => {
        const known = new Set(employees.map((e) => e.employeeCode));
        const unknown = [...new Set(shifts.map((s) => s.assignedEmployeeCode).filter((c) => c && !known.has(c)))].map((c) => ({ employeeCode: c, fullName: `עובד #${c}` }) as User);
        return [...employees, ...unknown].filter((e) => {
            const own = shifts.filter((s) => s.assignedEmployeeCode === e.employeeCode);
            return matches(query, e.fullName, e.employeeCode, own.map((s) => s.title).join(" "));
        });
    }, [employees, shifts, query]);

    if (!week || shifts.length === 0) {
        return (
            <div className="detail__empty">
                <strong>אין משמרות בשבוע הזה</strong>
                <span>העלה קובץ שיבוץ (אקסל) כדי ליצור את לוח השבוע. אחרי ההעלאה אפשר לערוך משמרת בודדת בלחיצה עליה.</span>
            </div>
        );
    }

    const remove = async (s: Shift, name: string) => {
        const ok = await useUiStore.getState().confirm({ title: "מחיקת משמרת", message: `המשמרת של ${name} תוסר מהלוח. אם יש עליה בקשת החלפה — היא תיסגר.`, confirmLabel: "מחק משמרת", danger: true });
        if (ok) await onDeleteShift(s.id);
    };

    return (
        <div className="roster">
            <div className="roster__grid" style={{ "--days": days.length } as React.CSSProperties}>
                <div className="roster__corner">עובד</div>
                {days.map((d) => (
                    <div key={d} className={`roster__day ${isToday(`${d}T00:00:00Z`) ? "is-today" : ""}`}>
                        {fmtWeekday(`${d}T00:00:00Z`)}
                        <small>{fmtDayMonth(`${d}T00:00:00Z`)}</small>
                    </div>
                ))}
                {rows.length === 0 && <div className="inbox__empty" style={{ gridColumn: "1 / -1" }}>לא נמצאו עובדים שמתאימים לחיפוש.</div>}
                {rows.map((e) => (
                    <div key={e.employeeCode} style={{ display: "contents" }}>
                        <div className="roster__who">
                            <Avatar name={e.fullName} code={e.employeeCode} size="sm" />
                            <div style={{ minWidth: 0 }}><strong>{e.fullName}</strong><small>#{e.employeeCode}</small></div>
                        </div>
                        {days.map((d) => (
                            <div key={d} className="roster__cell">
                                {shifts.filter((s) => s.assignedEmployeeCode === e.employeeCode && dayKey(s.startTime) === d).map((s) => (
                                    <div key={s.id} style={{ position: "relative" }}>
                                        <button type="button" className={`shiftblock ${personClass(e.employeeCode)} ${s.status === "swap_pending" ? "shiftblock--swap" : ""}`} onClick={() => onEditShift(s)} title="לחץ לעריכה">
                                            <b>{fmtTimeRange(s.startTime, s.endTime)}</b>
                                            <span>{s.title || "משמרת"}{s.status === "swap_pending" ? " · בהחלפה" : ""}</span>
                                        </button>
                                        <button type="button" aria-label="מחק משמרת" className="btn-close" style={{ position: "absolute", insetBlockStart: 2, insetInlineEnd: 2, width: 22, height: 22 }} onClick={() => void remove(s, e.fullName)}><Trash2 size={12} /></button>
                                    </div>
                                ))}
                                {d >= today && (
                                    <button type="button" className="roster__add" aria-label={`הוסף משמרת ל${e.fullName}`} title="הוסף משמרת" onClick={() => onAddShift(e.employeeCode, d)}>
                                        <Plus size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="roster__legend"><span><i />משובץ</span><span><i className="sw" />בתהליך החלפה</span><span className="muted">סה״כ {shifts.length} משמרות</span></div>
        </div>
    );
}
