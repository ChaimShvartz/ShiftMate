import { Repeat } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getShifts } from "../api/shifts";
import { createSwap, getMySwaps } from "../api/swaps";
import TimeGrid from "../components/calendar/TimeGrid";
import SwapRequestModal from "../components/employee/SwapRequestModal";
import Modal from "../components/ui/Modal";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { useUiStore } from "../store/uiStore";
import type { Shift, ShiftWeek, SwapRequest } from "../types";
import { durationHours, fmtDateLong, fmtDayMonth, fmtTime, fmtTimeRange, fmtWeekday, nowFloating } from "../utils/datetime";
import { getErrorMessage } from "../utils/getErrorMessage";

const OPEN = ["pending_manager_publish", "published_to_board"];

export default function MyShiftsPage() {
    const user = useAuthStore((s) => s.user);
    const addToast = useUiStore((s) => s.addToast);
    const shiftsVersion = useNotificationStore((s) => s.shiftsVersion);
    const swapsVersion = useNotificationStore((s) => s.swapsVersion);

    const [weekDoc, setWeekDoc] = useState<ShiftWeek | null>(null);
    const [swaps, setSwaps] = useState<SwapRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<Shift | null>(null);
    const [asking, setAsking] = useState<Shift | null>(null);

    const load = useCallback(async (weekNumber?: number) => {
        try {
            const [week, mine] = await Promise.all([getShifts(weekNumber), getMySwaps()]);
            setWeekDoc(week);
            setSwaps(mine);
        } catch (err) {
            addToast(getErrorMessage(err, "שגיאה בטעינת המשמרות"), "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        void load(weekDoc?.weekNumber ?? undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load, shiftsVersion, swapsVersion]);

    async function handleSwapConfirm(shiftId: number, reason: string) {
        await createSwap(shiftId, reason, weekDoc?.weekNumber);
        addToast("הבקשה נשלחה למנהל. תקבל התראה כשתטופל.", "success");
        await load(weekDoc?.weekNumber);
    }

    const now = nowFloating().getTime();
    const mine = useMemo(() => (weekDoc?.shifts ?? []).filter((s) => s.assignedEmployeeCode === user?.employeeCode).sort((a, b) => a.startTime.localeCompare(b.startTime)), [weekDoc, user]);
    const limit = user?.maxWeeklyHours ?? 40;
    const hours = mine.reduce((n, s) => n + durationHours(s.startTime, s.endTime), 0);
    const next = mine.find((s) => new Date(s.endTime).getTime() > now);
    const swapOf = (s: Shift) => swaps.find((w) => w.shiftId === s.id && w.weekNumber === weekDoc?.weekNumber && OPEN.includes(w.status));
    const segs = Math.max(8, Math.ceil(limit / 4));
    const filled = Math.min(segs, Math.round((hours / limit) * segs));
    const detailSwap = detail ? swapOf(detail) : undefined;
    const detailPast = detail ? new Date(detail.endTime).getTime() <= now : false;

    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <h1 className="page__title">שלום, {user?.fullName.split(" ")[0]}</h1>
                    <p className="page__subtitle">{loading ? "טוען…" : mine.length ? `יש לך ${mine.length} משמרות בשבוע ${weekDoc?.weekNumber}. לחיצה על משמרת פותחת את הפרטים.` : "אין לך משמרות משובצות כרגע."}</p>
                </div>
            </header>

            <div className="nextup">
                {next && (
                    <div className="routesign">
                        <span className="routesign__time">{fmtTime(next.startTime)}–{fmtTime(next.endTime)}</span>
                        <span className="routesign__meta"><small>המשמרת הבאה</small><b>{fmtWeekday(next.startTime)} {fmtDayMonth(next.startTime)}</b>{next.title || "משמרת"}</span>
                    </div>
                )}
                {mine.length > 0 && (
                    <div className="meter nextup__meter" aria-label="שעות שבועיות" style={{ marginBottom: 0 }}>
                        <div className="meter__head"><span>שעות מתוכננות השבוע</span><b dir="ltr">{hours.toFixed(1).replace(/\.0$/, "")} / {limit}</b></div>
                        <div className="meter__bar" aria-hidden>{Array.from({ length: segs }, (_, i) => <i key={i} className={i < filled ? (hours > limit ? "over" : "on") : ""} />)}</div>
                    </div>
                )}
            </div>

            {loading ? <div className="loading-state">טוען משמרות…</div> : <TimeGrid shifts={mine} startDate={weekDoc?.weekStartDate} onSelect={setDetail} />}

            <Modal open={Boolean(detail)} onOpenChange={(o) => !o && setDetail(null)} title={detail?.title || "משמרת"} description={detail ? fmtDateLong(detail.startTime) : ""} size="sm">
                {detail && (
                    <>
                        <div className="routesign" style={{ marginBottom: 14 }}>
                            <span className="routesign__time">{fmtTimeRange(detail.startTime, detail.endTime)}</span>
                            <span className="routesign__meta"><b>{durationHours(detail.startTime, detail.endTime)} שעות</b>{detail.title || "משמרת"}</span>
                        </div>
                        {detail.status === "swap_pending" && <p className="detail__reason"><small>סטטוס</small>{detailSwap?.status === "published_to_board" ? `מפורסמת בבורסה · ${detailSwap.applicantsCount} מועמדים` : "ממתינה לאישור המנהל לפרסום בבורסה"}</p>}
                        <div className="dialog__actions">
                            {!detailPast && detail.status !== "swap_pending" && <button type="button" className="btn btn--primary" onClick={() => { setAsking(detail); setDetail(null); }}><Repeat size={16} />בקש החלפה</button>}
                            <button type="button" className="btn btn--ghost" onClick={() => setDetail(null)}>סגור</button>
                        </div>
                    </>
                )}
            </Modal>

            {asking && <SwapRequestModal shift={asking} onConfirm={handleSwapConfirm} onClose={() => setAsking(null)} />}
        </div>
    );
}
