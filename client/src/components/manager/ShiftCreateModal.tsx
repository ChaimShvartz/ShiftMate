import axios from "axios";
import { useMemo, useState } from "react";
import { createShift } from "../../api/shifts";
import type { ComplianceResult, ShiftWeek, User } from "../../types";
import { complianceText } from "../../utils/compliance";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { nowFloating } from "../../utils/datetime";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

interface Props {
    open: boolean;
    week: ShiftWeek;
    employees: User[];
    prefill?: { employeeCode?: string; date?: string };
    onClose: () => void;
    onCreated: () => void;
}

const DAY = 864e5;

// Sunday..Saturday window of the schedule week, as yyyy-mm-dd strings (floating UTC).
function weekDays(week: ShiftWeek): string[] {
    const a = new Date(week.weekStartDate);
    const sunday = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()) - a.getUTCDay() * DAY;
    return Array.from({ length: 7 }, (_, i) => new Date(sunday + i * DAY).toISOString().slice(0, 10));
}

export default function ShiftCreateModal({ open, week, employees, prefill, onClose, onCreated }: Props) {
    const days = useMemo(() => weekDays(week), [week]);
    const today = nowFloating().toISOString().slice(0, 10);
    const firstFree = days.find((d) => d >= today) ?? days[0];

    const [employeeCode, setEmployeeCode] = useState(prefill?.employeeCode ?? "");
    const [date, setDate] = useState(prefill?.date && prefill.date >= today ? prefill.date : firstFree);
    const [start, setStart] = useState("08:00");
    const [end, setEnd] = useState("16:00");
    const [title, setTitle] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<ComplianceResult | null>(null);
    const [busy, setBusy] = useState(false);

    async function submit(force = false) {
        setBusy(true);
        setError(null);
        try {
            await createShift(week.weekNumber, {
                assignedEmployeeCode: employeeCode,
                title: title.trim(),
                startTime: `${date}T${start}:00.000Z`,
                endTime: `${date}T${end}:00.000Z`,
                force,
            });
            onCreated();
            onClose();
        } catch (err) {
            const details = axios.isAxiosError(err) ? err.response?.data?.details : null;
            if (details?.code === "labor_warning") setWarning(details.compliance as ComplianceResult);
            else setError(getErrorMessage(err, "שגיאה בהוספת המשמרת"));
        } finally {
            setBusy(false);
        }
    }

    const valid = employeeCode && date && start && end && end > start;

    return (
        <Modal open={open} onOpenChange={(o) => !o && onClose()} title="הוספת משמרת" description={`שבוע ${week.weekNumber} · הוספה ידנית של משמרת לעובד מהיחידה`}>
            {warning ? (
                <div>
                    <div className="error-message" role="alert" style={{ display: "block" }}>
                        <strong>שים לב: ההוספה חורגת מחוקי העבודה</strong>
                        <p style={{ marginTop: 6 }}>{complianceText(warning)}</p>
                    </div>
                    <p className="modal-subtitle" style={{ marginTop: 12 }}>אפשר להוסיף את המשמרת בכל זאת, באחריות המנהל.</p>
                    <div className="dialog__actions">
                        <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void submit(true)}>הוסף בכל זאת</button>
                        <button type="button" className="btn btn--ghost" onClick={() => setWarning(null)}>חזרה לעריכה</button>
                    </div>
                </div>
            ) : (
                <form className="modal-form" onSubmit={(e) => { e.preventDefault(); void submit(false); }}>
                    <div className="form-group">
                        <label htmlFor="newShiftEmployee">עובד</label>
                        <Select id="newShiftEmployee" name="employee" required value={employeeCode} placeholder="בחר עובד מהיחידה" onValueChange={setEmployeeCode} options={employees.map((e) => ({ value: e.employeeCode, label: `${e.fullName} (#${e.employeeCode})` }))} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="newShiftDate">תאריך</label>
                        <input id="newShiftDate" type="date" required value={date} min={days.find((d) => d >= today) ?? days[0]} max={days[6]} onChange={(e) => setDate(e.target.value)} />
                        <span className="form-hint">אפשר לבחור ימים מהיום ועד סוף שבוע {week.weekNumber}.</span>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="newShiftStart">שעת התחלה</label>
                            <input id="newShiftStart" type="time" required value={start} onChange={(e) => setStart(e.target.value)} dir="ltr" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="newShiftEnd">שעת סיום</label>
                            <input id="newShiftEnd" type="time" required value={end} onChange={(e) => setEnd(e.target.value)} dir="ltr" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="newShiftTitle">תיאור המשמרת (לא חובה)</label>
                        <input id="newShiftTitle" type="text" maxLength={80} placeholder="לדוגמה: משמרת בוקר" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    {end <= start && <p className="form-hint" style={{ color: "var(--bad-text)" }}>שעת הסיום חייבת להיות אחרי שעת ההתחלה. משמרות שחוצות חצות מוסיפים כשתי משמרות.</p>}
                    {error && <div className="error-message">{error}</div>}
                    <div className="dialog__actions">
                        <button type="submit" className="btn btn--primary" disabled={!valid || busy}>{busy ? "מוסיף…" : "הוסף משמרת"}</button>
                        <button type="button" className="btn btn--ghost" onClick={onClose}>ביטול</button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
