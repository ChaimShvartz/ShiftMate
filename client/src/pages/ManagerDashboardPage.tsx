import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
    AlertCircle,
    ArrowLeftRight,
    CheckCircle2,
    Calendar,
    Radio,
    History,
    Sparkles,
    Send,
    X,
    Clock,
} from "lucide-react";
import { getShifts } from "../api/shifts";
import {
    approveApplicant,
    getManagerSwaps,
    publishSwap,
    rejectApplicant,
    rejectSwap,
} from "../api/swaps";
import CountUp from "../components/ui/CountUp";
import ApplicantsList from "../components/swaps/ApplicantsList";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { useUiStore } from "../store/uiStore";
import type { ShiftWeek, SwapRequest } from "../types";
import { dayKey, fmtDateShort, fmtTimeRange, nowFloating, timeAgo } from "../utils/datetime";
import { getErrorMessage } from "../utils/getErrorMessage";

const CLOSED_LABEL: Record<string, { text: string; tone: string }> = {
    closed_approved: { text: "אושר", tone: "success" },
    closed_rejected: { text: "נדחה", tone: "danger" },
    closed_employee_removed: { text: "בוטל", tone: "muted" },
};

function ShiftLine({ swap }: { swap: SwapRequest }) {
    const s = swap.shiftDetails;
    if (!s) return <span className="muted">פרטי המשמרת אינם זמינים</span>;
    return (
        <span className="shift-line">
            <Calendar size={13} style={{ opacity: 0.6 }} />
            <span>{fmtDateShort(s.startTime)} · <b>{fmtTimeRange(s.startTime, s.endTime)}</b></span>
            {s.title ? ` · ${s.title}` : ""}
        </span>
    );
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.07,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 25 },
    },
};

export default function ManagerDashboardPage() {
    const user = useAuthStore((s) => s.user);
    const addToast = useUiStore((s) => s.addToast);
    const confirm = useUiStore((s) => s.confirm);
    const { swapsVersion, shiftsVersion, items, connected } = useNotificationStore();

    const [swaps, setSwaps] = useState<SwapRequest[]>([]);
    const [week, setWeek] = useState<ShiftWeek | null>(null);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const [s, w] = await Promise.all([getManagerSwaps(), getShifts()]);
            setSwaps(s);
            setWeek(w);
        } catch (err) {
            addToast(getErrorMessage(err, "שגיאה בטעינת הדאשבורד"), "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        void load();
    }, [load, swapsVersion, shiftsVersion]);

    async function act(id: string, fn: () => Promise<void>, ok: string, tone: "success" | "warning" = "success") {
        setBusyId(id);
        try {
            await fn();
            addToast(ok, tone);
            await load();
        } catch (err) {
            addToast(getErrorMessage(err, "הפעולה נכשלה"), "error");
        } finally {
            setBusyId(null);
        }
    }

    async function handleReject(swap: SwapRequest) {
        const okay = await confirm({
            title: "דחיית בקשה",
            message: `לדחות את בקשת ההחלפה של ${swap.requesterName}? העובד יקבל על כך התראה.`,
            confirmLabel: "דחה בקשה",
            danger: true,
        });
        if (okay) await act(swap._id, () => rejectSwap(swap._id), "הבקשה נדחתה", "warning");
    }

    async function handleApprove(swap: SwapRequest, code: string, name?: string) {
        const okay = await confirm({
            title: "אישור מחליף",
            message: `לאשר את ${name ?? code} כמחליף/ה של ${swap.requesterName}? שאר המועמדים יידחו אוטומטית.`,
            confirmLabel: "אשר החלפה",
        });
        if (okay) await act(swap._id, () => approveApplicant(swap._id, code), "ההחלפה אושרה ועודכנה בלוח");
    }

    const pending = swaps.filter((s) => s.status === "pending_manager_publish");
    const onBoard = swaps.filter((s) => s.status === "published_to_board");
    const closed = swaps.filter((s) => s.status.startsWith("closed")).slice(0, 8);
    const waitingApplicants = onBoard.reduce((n, s) => n + s.applicants.filter((a) => a.status === "pending").length, 0);
    const approvedCount = swaps.filter((s) => s.status === "closed_approved").length;

    const stats = useMemo(() => {
        const shifts = week?.shifts ?? [];
        const today = nowFloating().toISOString().slice(0, 10);
        return {
            total: shifts.length,
            today: shifts.filter((s) => dayKey(s.startTime) === today).length,
            inSwap: shifts.filter((s) => s.status === "swap_pending").length,
        };
    }, [week]);

    return (
        <motion.div
            className="page page--wide"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.header className="page-head" variants={itemVariants}>
                <div>
                    <h1 className="page__title">דאשבורד ניהול יחידה</h1>
                    <p className="page__subtitle">
                        יחידה: <strong>{user?.unitName}</strong>
                        {week?.weekNumber ? ` · שבוע ${week.weekNumber}` : ""}
                    </p>
                </div>
                <span className={`live-pill ${connected ? "is-live" : ""}`}>
                    <Radio size={12} />
                    <span>{connected ? "סנכרון פעיל בזמן אמת" : "מתחבר מחדש…"}</span>
                </span>
            </motion.header>

            <motion.section className="kpi-grid" aria-label="מדדים" variants={itemVariants}>
                <motion.div
                    className={`kpi ${pending.length ? "kpi--alert" : ""}`}
                    whileHover={{ scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="kpi__label">ממתינות לאישור פרסום</span>
                        <AlertCircle size={16} style={{ color: pending.length ? "var(--warning)" : "var(--text-3)" }} />
                    </div>
                    <b className="kpi__value"><CountUp value={pending.length} /></b>
                    <span className="kpi__hint">{pending.length ? "דורש טיפול מנהל" : "הכול מטופל"}</span>
                </motion.div>

                <motion.div
                    className="kpi kpi--brand"
                    whileHover={{ scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="kpi__label">פעילות בבורסה</span>
                        <ArrowLeftRight size={16} style={{ color: "#38bdf8" }} />
                    </div>
                    <b className="kpi__value"><CountUp value={onBoard.length} /></b>
                    <span className="kpi__hint">{waitingApplicants} מועמדים ממתינים להחלטה</span>
                </motion.div>

                <motion.div
                    className="kpi"
                    whileHover={{ scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="kpi__label">החלפות שאושרו</span>
                        <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                    </div>
                    <b className="kpi__value"><CountUp value={approvedCount} /></b>
                    <span className="kpi__hint">ב-30 הימים האחרונים</span>
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
                    <b className="kpi__value"><CountUp value={stats.total} /></b>
                    <span className="kpi__hint">{stats.today} היום · {stats.inSwap} בתהליך החלפה</span>
                </motion.div>
            </motion.section>

            <div className="dash-grid">
                <div className="dash-main">
                    <motion.section className="panel" variants={itemVariants}>
                        <header className="panel__head">
                            <h2>
                                <Clock size={17} style={{ color: "var(--warning)" }} />
                                <span>ממתינות לאישור פרסום</span>
                            </h2>
                            <span className="count">{pending.length}</span>
                        </header>
                        {loading && <div className="loading-state">טוען נתונים...</div>}
                        {!loading && pending.length === 0 && (
                            <p className="panel__empty">אין בקשות שממתינות לאישור פרסום ✨</p>
                        )}
                        {pending.map((swap) => (
                            <motion.article
                                key={swap._id}
                                className="request-row"
                                layout
                            >
                                <div className="request-row__info">
                                    <div className="request-row__who">
                                        <span className="avatar">{(swap.requesterName ?? "?").slice(0, 1)}</span>
                                        <div>
                                            <strong>{swap.requesterName}</strong>
                                            <small>{timeAgo(swap.createdAt)}</small>
                                        </div>
                                    </div>
                                    <ShiftLine swap={swap} />
                                    {swap.reason && <p className="request-row__reason">“{swap.reason}”</p>}
                                </div>
                                <div className="request-row__actions">
                                    <motion.button
                                        className="mgr-btn mgr-btn--publish"
                                        disabled={busyId === swap._id}
                                        onClick={() => act(swap._id, () => publishSwap(swap._id), "הבקשה פורסמה בבורסה")}
                                        whileTap={{ scale: 0.96 }}
                                    >
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                            <Send size={13} />
                                            <span>פרסם לבורסה</span>
                                        </span>
                                    </motion.button>
                                    <motion.button
                                        className="mgr-btn mgr-btn--reject"
                                        disabled={busyId === swap._id}
                                        onClick={() => handleReject(swap)}
                                        whileTap={{ scale: 0.96 }}
                                    >
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                            <X size={13} />
                                            <span>דחה</span>
                                        </span>
                                    </motion.button>
                                </div>
                            </motion.article>
                        ))}
                    </motion.section>

                    <motion.section className="panel" variants={itemVariants}>
                        <header className="panel__head">
                            <h2>
                                <ArrowLeftRight size={17} style={{ color: "var(--brand)" }} />
                                <span>בבורסה — מועמדים להחלטה</span>
                            </h2>
                            <span className="count">{onBoard.length}</span>
                        </header>
                        {!loading && onBoard.length === 0 && (
                            <p className="panel__empty">אין כרגע בקשות פתוחות בבורסה.</p>
                        )}
                        {onBoard.map((swap) => (
                            <motion.article
                                key={swap._id}
                                className="request-row request-row--stack"
                                layout
                            >
                                <div className="request-row__info">
                                    <div className="request-row__who">
                                        <span className="avatar">{(swap.requesterName ?? "?").slice(0, 1)}</span>
                                        <div>
                                            <strong>{swap.requesterName}</strong>
                                            <small>{timeAgo(swap.createdAt)}</small>
                                        </div>
                                    </div>
                                    <ShiftLine swap={swap} />
                                    {swap.reason && <p className="request-row__reason">“{swap.reason}”</p>}
                                </div>
                                <ApplicantsList
                                    applicants={swap.applicants}
                                    busy={busyId === swap._id}
                                    onApprove={(code) =>
                                        handleApprove(
                                            swap,
                                            code,
                                            swap.applicants.find((a) => a.employeeCode === code)?.employeeName,
                                        )
                                    }
                                    onReject={(code) =>
                                        act(
                                            swap._id,
                                            () => rejectApplicant(swap._id, code),
                                            "המועמד נדחה",
                                            "warning",
                                        )
                                    }
                                />
                            </motion.article>
                        ))}
                    </motion.section>
                </div>

                <aside className="dash-side">
                    <motion.section className="panel" variants={itemVariants}>
                        <header className="panel__head">
                            <h2>
                                <Sparkles size={16} style={{ color: "var(--brand)" }} />
                                <span>פעילות שוטפת</span>
                            </h2>
                        </header>
                        <ul className="feed">
                            {items.length === 0 && (
                                <li className="panel__empty">פעילות בזמן אמת תופיע כאן.</li>
                            )}
                            {items.slice(0, 10).map((n) => (
                                <li key={n.id} className={`feed__item feed__item--${n.level}`}>
                                    <span className="feed__dot" />
                                    <div>
                                        <p>{n.message}</p>
                                        <time>{timeAgo(n.createdAt)}</time>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.section>

                    <motion.section className="panel" variants={itemVariants}>
                        <header className="panel__head">
                            <h2>
                                <History size={16} style={{ opacity: 0.7 }} />
                                <span>היסטוריה אחרונה</span>
                            </h2>
                        </header>
                        <ul className="history">
                            {closed.length === 0 && <li className="panel__empty">אין עדיין היסטוריה.</li>}
                            {closed.map((s) => {
                                const label = CLOSED_LABEL[s.status] || { text: s.status, tone: "muted" };
                                return (
                                    <li key={s._id}>
                                        <div>
                                            <strong>{s.requesterName}</strong>
                                            {s.replacementName && <span> ← {s.replacementName}</span>}
                                            <small>{timeAgo(s.createdAt)}</small>
                                        </div>
                                        <span className={`chip chip--${label.tone}`}>{label.text}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.section>

                    <Link to="/schedule" className="btn-secondary btn-block">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <Calendar size={15} />
                            <span>מעבר ללוח המשמרות המלא</span>
                        </span>
                    </Link>
                </aside>
            </div>
        </motion.div>
    );
}
