import { motion } from "framer-motion";
import { ArrowLeft, Check, Hand } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { applySwap, getMySwaps } from "../api/swaps";
import Avatar, { AvatarStack } from "../components/ui/Avatar";
import SearchInput from "../components/ui/SearchInput";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { useSwapStore } from "../store/useSwapStore";
import { useUiStore } from "../store/uiStore";
import type { SwapRequest } from "../types";
import { fmtDayMonth, fmtTimeRange, fmtWeekday, timeAgo } from "../utils/datetime";
import { getErrorMessage } from "../utils/getErrorMessage";
import { personClass } from "../utils/person";
import { matches } from "../utils/search";

type Filter = "all" | "open" | "mine";
const FILTERS: [Filter, string][] = [["all", "הכול"], ["open", "פתוחות עבורי"], ["mine", "הבקשות שלי"]];

const STATUS: Record<string, { text: string; plate: string }> = {
    pending_manager_publish: { text: "ממתינה לאישור מנהל", plate: "plate--warn" },
    published_to_board: { text: "פורסמה בבורסה", plate: "plate--info" },
    closed_approved: { text: "אושרה", plate: "plate--ok" },
    closed_rejected: { text: "נדחתה", plate: "plate--bad" },
    closed_employee_removed: { text: "בוטלה", plate: "plate--idle" },
};

const dayLabel = (iso: string) => {
    const d = new Date(iso);
    const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 864e5);
    if (days <= 0) return "היום";
    if (days === 1) return "אתמול";
    return d.toLocaleDateString("he-IL", { day: "numeric", month: "long" });
};

export default function SwapBoardPage() {
    const user = useAuthStore((s) => s.user);
    const addToast = useUiStore((s) => s.addToast);
    const swapsVersion = useNotificationStore((s) => s.swapsVersion);
    const { board, loadingBoard, fetchBoard } = useSwapStore();
    const [params] = useSearchParams();

    const [filter, setFilter] = useState<Filter>("all");
    const [q, setQ] = useState(params.get("q") ?? "");
    const [mine, setMine] = useState<SwapRequest[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);
    const endRef = useRef<HTMLDivElement>(null);

    const refresh = useCallback(async () => {
        try {
            const [, my] = await Promise.all([fetchBoard(), getMySwaps()]);
            setMine(my);
        } catch (err) {
            addToast(getErrorMessage(err, "שגיאה בטעינת הבורסה"), "error");
        }
    }, [fetchBoard, addToast]);

    useEffect(() => {
        void refresh();
    }, [refresh, swapsVersion]);

    async function apply(id: string) {
        setBusyId(id);
        try {
            await applySwap(id);
            addToast("המועמדות הוגשה. המנהל יחליט בקרוב.", "success");
            await refresh();
        } catch (err) {
            addToast(getErrorMessage(err, "שגיאה בהגשת מועמדות"), "error");
        } finally {
            setBusyId(null);
        }
    }

    // One conversation: other people's open requests + my own requests, oldest first.
    const messages = useMemo(() => {
        const me = user?.employeeCode;
        const byId = new Map<string, SwapRequest>();
        board.filter((s) => s.requesterEmployeeCode !== me).forEach((s) => byId.set(s._id, s));
        mine.filter((s) => s.requesterEmployeeCode === me).forEach((s) => byId.set(s._id, s));
        return [...byId.values()]
            .filter((s) => (filter === "open" ? s.requesterEmployeeCode !== me && s.status === "published_to_board" : filter === "mine" ? s.requesterEmployeeCode === me : true))
            .filter((s) => matches(q, s.requesterName, s.requesterEmployeeCode === me ? s.reason : "", s.shiftDetails?.title))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }, [board, mine, user, filter, q]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ block: "end" });
    }, [messages.length]);

    const groups = useMemo(() => {
        const out: { label: string; items: SwapRequest[] }[] = [];
        messages.forEach((m) => {
            const label = dayLabel(m.createdAt);
            const last = out[out.length - 1];
            if (last && last.label === label) last.items.push(m);
            else out.push({ label, items: [m] });
        });
        return out;
    }, [messages]);

    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <h1 className="page__title">בורסת משמרות</h1>
                    <p className="page__subtitle">כאן עמיתים ביחידה מחפשים מחליף. כשמשמרת מתאימה לך, לחץ עליה והמנהל יאשר.</p>
                </div>
                <div className="page-actions">
                    <SearchInput label="חיפוש בבורסה" placeholder="חיפוש לפי עובד" value={q} onChange={setQ} />
                    <div className="filters" role="tablist" aria-label="סינון">
                        {FILTERS.map(([key, label]) => (
                            <button key={key} type="button" role="tab" aria-selected={filter === key} className={filter === key ? "is-active" : ""} onClick={() => setFilter(key)}>
                                {filter === key && <motion.span layoutId="filter-pill" className="filters__pill" transition={{ type: "spring", stiffness: 460, damping: 36 }} />}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="chat">
                {loadingBoard && messages.length === 0 && <div className="loading-state">טוען…</div>}
                {!loadingBoard && messages.length === 0 && (
                    <div className="detail__empty">
                        <strong>{q ? "לא נמצאו תוצאות" : "הבורסה שקטה כרגע"}</strong>
                        <span>{q ? "נסה חיפוש אחר." : "כשעמית יפרסם משמרת להחלפה היא תופיע כאן, ותקבל על כך התראה."}</span>
                    </div>
                )}

                {groups.map((g) => (
                    <div key={g.label} style={{ display: "contents" }}>
                        <span className="chat__day">{g.label}</span>
                        {g.items.map((s, i) => {
                            const me = s.requesterEmployeeCode === user?.employeeCode;
                            const sh = s.shiftDetails;
                            const myApp = s.applicants.find((a) => a.employeeCode === user?.employeeCode);
                            const st = STATUS[s.status];
                            return (
                                <motion.article
                                    key={s._id}
                                    className={`msg ${me ? "msg--mine" : ""} ${personClass(s.requesterEmployeeCode)}`}
                                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 340, damping: 30, delay: Math.min(i, 6) * 0.05 }}
                                >
                                    {!me && <Avatar name={s.requesterName} code={s.requesterEmployeeCode} size="md" />}
                                    <div className="msg__bubble">
                                        <div className="msg__meta">
                                            <strong>{me ? "הבקשה שלך" : s.requesterName}</strong>
                                            <small>{timeAgo(s.createdAt)}</small>
                                        </div>
                                        <p className="msg__text">{me ? (s.reason ? `“${s.reason}”` : "ביקשת להחליף משמרת") : "מחפש/ת מחליף/ה למשמרת הבאה"}</p>
                                        {sh && (
                                            <div className="msg__shift">
                                                <b>{fmtTimeRange(sh.startTime, sh.endTime)}</b>
                                                <span><em>{fmtWeekday(sh.startTime)} {fmtDayMonth(sh.startTime)}</em>{sh.title || "משמרת"}</span>
                                            </div>
                                        )}
                                        <div className="msg__foot">
                                            {me ? (
                                                <>
                                                    <span className={`plate ${st.plate}`}>{st.text}</span>
                                                    {s.status === "published_to_board" && <small>{s.applicantsCount} מועמדים</small>}
                                                    {s.status === "closed_approved" && s.replacementName && <small>עברה אל {s.replacementName}</small>}
                                                </>
                                            ) : myApp ? (
                                                <span className="plate plate--idle"><Check size={13} />{myApp.status === "rejected" ? "לא התקבלת" : "הגשת מועמדות"}</span>
                                            ) : (
                                                <>
                                                    <button type="button" className="btn btn--primary btn--sm" disabled={busyId === s._id} onClick={() => apply(s._id)}><Hand size={15} />אני לוקח/ת את המשמרת</button>
                                                    <AvatarStack people={s.applicants.map((a) => ({ name: a.employeeName, code: a.employeeCode }))} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                ))}
                <div ref={endRef} />

                <div className="chat__bar">
                    <span>הבורסה לקריאה בלבד. כדי לבקש החלפה, בחר משמרת בלוח שלך.</span>
                    <Link to="/my-shifts" className="btn btn--ghost btn--sm">למשמרות שלי<ArrowLeft size={15} /></Link>
                </div>
            </div>
        </div>
    );
}
