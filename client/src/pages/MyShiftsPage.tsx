import { useCallback, useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
    Calendar,
    Clock,
    Hourglass,
    ArrowLeftRight,
    Sparkles,
} from "lucide-react";
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

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 25 },
    },
};

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
        <motion.div
            className="page"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.header className="page-head" variants={itemVariants}>
                <div>
                    <h1 className="page__title">
                        שלום, {user?.fullName.split(" ")[0]}
                    </h1>
                    <p className="page__subtitle">
                        {user?.unitName && <>יחידה: <strong>{user.unitName}</strong></>}
                        {weekDoc?.weekNumber ? ` · שבוע ${weekDoc.weekNumber}` : ""}
                    </p>
                </div>
            </motion.header>

            <motion.section className="kpi-grid" aria-label="סיכום" variants={itemVariants}>
                <motion.div
                    className="kpi kpi--brand"
                    whileHover={{ scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="kpi__label">המשמרת הבאה</span>
                        <Sparkles size={16} style={{ opacity: 0.7 }} />
                    </div>
                    <b className="kpi__value kpi__value--sm">
                        {next ? fmtDateLong(next.startTime) : "—"}
                    </b>
                    <span className="kpi__hint">
                        {next ? fmtTimeRange(next.startTime, next.endTime) : "אין משמרות קרובות"}
                    </span>
                </motion.div>

                <motion.div
                    className="kpi"
                    whileHover={{ scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="kpi__label">משמרות השבוע</span>
                        <Calendar size={16} style={{ color: "var(--brand)" }} />
                    </div>
                    <b className="kpi__value">
                        <CountUp value={myShifts.length} />
                    </b>
                    <span className="kpi__hint">משובצות במערכת</span>
                </motion.div>

                <motion.div
                    className="kpi"
                    whileHover={{ scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="kpi__label">שעות מתוכננות</span>
                        <Hourglass size={16} style={{ color: "#38bdf8" }} />
                    </div>
                    <b className="kpi__value">
                        {totalHours.toFixed(1).replace(/\.0$/, "")}
                        <small>/{user?.maxWeeklyHours ?? 40}</small>
                    </b>
                    <span className="kpi__hint">מתוך מכסת השעות השבועית</span>
                </motion.div>

                <motion.div
                    className="kpi"
                    whileHover={{ scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="kpi__label">בקשות החלפה פתוחות</span>
                        <ArrowLeftRight size={16} style={{ color: "var(--warning)" }} />
                    </div>
                    <b className="kpi__value">
                        <CountUp value={openSwaps} />
                    </b>
                    <span className="kpi__hint">בבורסה או בהמתנה למנהל</span>
                </motion.div>
            </motion.section>

            {loading && <div className="loading-state">טוען משמרות...</div>}

            {!loading && myShifts.length === 0 && (
                <motion.div className="empty-card" variants={itemVariants}>
                    <span className="empty-icon">🗓️</span>
                    <h3>אין משמרות משובצות בשבוע זה</h3>
                    <p>כשמנהל היחידה יפרסם לוח חדש — תקבל על כך התראה בזמן אמת.</p>
                </motion.div>
            )}

            {[...grouped.entries()].map(([key, list]) => (
                <motion.section key={key} className="day-group" variants={itemVariants}>
                    <h2 className="day-group__title">
                        <Clock size={16} style={{ opacity: 0.6 }} />
                        <span>{fmtDateLong(list[0].startTime)}</span>
                    </h2>
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
                </motion.section>
            ))}

            {selected && (
                <SwapRequestModal
                    shift={selected}
                    onConfirm={handleSwapConfirm}
                    onClose={() => setSelected(null)}
                />
            )}
        </motion.div>
    );
}
