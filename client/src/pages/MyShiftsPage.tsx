import { useCallback, useEffect, useState } from "react";
import { getShifts } from "../api/shifts";
import { createSwap, getMySwaps } from "../api/swaps";
import ShiftCard from "../components/employee/ShiftCard";
import SwapRequestModal from "../components/employee/SwapRequestModal";
import CountUp from "../components/ui/CountUp";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { useUiStore } from "../store/uiStore";
import type { Shift, ShiftWeek, SwapRequest } from "../types";
import { dayKey, durationHours, fmtDateLong, fmtTimeRange, nowFloating } from "../utils/datetime";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function MyShiftsPage() {
    const user = useAuthStore((s) => s.user);
    const addToast = useUiStore((s) => s.addToast);
    const shiftsVersion = useNotificationStore((s) => s.shiftsVersion);
    const swapsVersion = useNotificationStore((s) => s.swapsVersion);

    const [weekDoc, setWeekDoc] = useState<ShiftWeek | null>(null);
    const [swaps, setSwaps] = useState<SwapRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Shift | null>(null);

    const load = useCallback(
        async (weekNumber?: number) => {
            try {
                const [week, mine] = await Promise.all([getShifts(weekNumber), getMySwaps()]);
                setWeekDoc(week);
                setSwaps(mine);
            } catch (err) {
                addToast(getErrorMessage(err, "שגיאה בטעינת המשמרות"), "error");
            } finally {
                setLoading(false);
            }
        },
        [addToast],
    );

    useEffect(() => {
        void load(weekDoc?.weekNumber ?? undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load, shiftsVersion, swapsVersion]);

    async function handleSwapConfirm(shiftId: number, reason: string) {
        await createSwap(shiftId, reason, weekDoc?.weekNumber);
        addToast("בקשת ההחלפה נשלחה למנהל לאישור", "success");
        await load(weekDoc?.weekNumber);
    }

    const now = nowFloating().getTime();
    const myShifts = (weekDoc?.shifts ?? [])
        .filter((s) => s.assignedEmployeeCode === user?.employeeCode)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const next = myShifts.find((s) => new Date(s.endTime).getTime() > now);
    const totalHours = myShifts.reduce((sum, s) => sum + durationHours(s.startTime, s.endTime), 0);
    const openSwaps = swaps.filter(
        (s) => s.requesterEmployeeCode === user?.employeeCode && ["pending_manager_publish", "published_to_board"].includes(s.status),
    ).length;
    const swapOfShift = (shift: Shift) =>
        swaps.find(
            (s) =>
                s.shiftId === shift.id &&
                s.weekNumber === weekDoc?.weekNumber &&
                ["pending_manager_publish", "published_to_board"].includes(s.status),
        );

    const grouped = new Map<string, Shift[]>();
    myShifts.forEach((s) => grouped.set(dayKey(s.startTime), [...(grouped.get(dayKey(s.startTime)) ?? []), s]));

    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <h1 className="page__title">שלום, {user?.fullName.split(" ")[0]} 👋</h1>
                    <p className="page__subtitle">
                        {user?.unitName && <>יחידה: <strong>{user.unitName}</strong></>}
                        {weekDoc?.weekNumber ? ` · שבוע ${weekDoc.weekNumber}` : ""}
                    </p>
                </div>
            </header>

            <section className="kpi-grid" aria-label="סיכום">
                <div className="kpi kpi--brand">
                    <span className="kpi__label">המשמרת הבאה</span>
                    <b className="kpi__value kpi__value--sm">{next ? fmtDateLong(next.startTime) : "—"}</b>
                    <span className="kpi__hint">{next ? fmtTimeRange(next.startTime, next.endTime) : "אין משמרות קרובות"}</span>
                </div>
                <div className="kpi">
                    <span className="kpi__label">משמרות השבוע</span>
                    <b className="kpi__value"><CountUp value={myShifts.length} /></b>
                </div>
                <div className="kpi">
                    <span className="kpi__label">שעות מתוכננות</span>
                    <b className="kpi__value">{totalHours.toFixed(1).replace(/\.0$/, "")}<small>/{user?.maxWeeklyHours ?? 40}</small></b>
                </div>
                <div className="kpi">
                    <span className="kpi__label">בקשות החלפה פתוחות</span>
                    <b className="kpi__value"><CountUp value={openSwaps} /></b>
                </div>
            </section>

            {loading && <div className="loading-state">טוען משמרות...</div>}

            {!loading && myShifts.length === 0 && (
                <div className="empty-card">
                    <span className="empty-icon">🗓️</span>
                    <h3>אין משמרות משובצות</h3>
                    <p>כשמנהל היחידה יפרסם לוח חדש — תקבל על כך התראה כאן.</p>
                </div>
            )}

            {[...grouped.entries()].map(([key, list]) => (
                <section key={key} className="day-group">
                    <h2 className="day-group__title">{fmtDateLong(list[0].startTime)}</h2>
                    <div className="shifts-grid">
                        {list.map((shift) => (
                            <ShiftCard
                                key={shift.id}
                                shift={shift}
                                swap={swapOfShift(shift)}
                                past={new Date(shift.endTime).getTime() <= now}
                                onRequestSwap={setSelected}
                            />
                        ))}
                    </div>
                </section>
            ))}

            {selected && (
                <SwapRequestModal shift={selected} onConfirm={handleSwapConfirm} onClose={() => setSelected(null)} />
            )}
        </div>
    );
}
