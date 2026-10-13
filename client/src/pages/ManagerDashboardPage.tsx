import { Check, Inbox, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getShifts } from "../api/shifts";
import { approveApplicant, getManagerSwaps, publishSwap, rejectApplicant, rejectSwap } from "../api/swaps";
import ApplicantsList from "../components/swaps/ApplicantsList";
import Avatar, { AvatarStack } from "../components/ui/Avatar";
import SearchInput from "../components/ui/SearchInput";
import Sheet from "../components/ui/Sheet";
import { useNotificationStore } from "../store/notificationStore";
import { useUiStore } from "../store/uiStore";
import type { ShiftWeek, SwapRequest } from "../types";
import { fmtDateLong, fmtDayMonth, fmtTimeRange, fmtWeekday, timeAgo } from "../utils/datetime";
import { personClass } from "../utils/person";
import { getErrorMessage } from "../utils/getErrorMessage";
import { matches } from "../utils/search";

const CLOSED: Record<string, { text: string; plate: string }> = {
    closed_approved: { text: "אושרה", plate: "plate--ok" },
    closed_rejected: { text: "נדחתה", plate: "plate--bad" },
    closed_employee_removed: { text: "בוטלה", plate: "plate--idle" },
};

function statusPlate(s: SwapRequest) {
    if (s.status === "pending_manager_publish") return { text: "ממתינה לפרסום", plate: "plate--warn" };
    if (s.status === "published_to_board") return { text: `בבורסה · ${s.applicantsCount}`, plate: "plate--info" };
    return CLOSED[s.status] ?? { text: s.status, plate: "plate--idle" };
}

export default function ManagerDashboardPage() {
    const addToast = useUiStore((s) => s.addToast);
    const confirm = useUiStore((s) => s.confirm);
    const { swapsVersion, shiftsVersion, items, connected } = useNotificationStore();
    const [params, setParams] = useSearchParams();

    const [swaps, setSwaps] = useState<SwapRequest[]>([]);
    const [week, setWeek] = useState<ShiftWeek | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [q, setQ] = useState(params.get("q") ?? "");
    const selectedId = params.get("swap");

    const load = useCallback(async () => {
        try {
            const [s, w] = await Promise.all([getManagerSwaps(), getShifts()]);
            setSwaps(s);
            setWeek(w);
        } catch (err) {
            addToast(getErrorMessage(err, "שגיאה בטעינת הבקשות"), "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        void load();
    }, [load, swapsVersion, shiftsVersion]);

    const visible = useMemo(
        () =>
            swaps.filter((s) =>
                matches(q, s.requesterName, s.reason, s.shiftDetails?.title, s.applicants.map((a) => a.employeeName).join(" ")),
            ),
        [swaps, q],
    );
    const pending = visible.filter((s) => s.status === "pending_manager_publish");
    const board = visible.filter((s) => s.status === "published_to_board");
    const closed = visible.filter((s) => s.status.startsWith("closed")).slice(0, 10);
    const waiting = swaps.filter((s) => s.status === "published_to_board").reduce((n, s) => n + s.applicants.filter((a) => a.status === "pending").length, 0);
    const selected = swaps.find((s) => s._id === selectedId) ?? null;

    const select = (id: string | null) => {
        const next = new URLSearchParams(params);
        if (id) next.set("swap", id);
        else next.delete("swap");
        setParams(next, { replace: true });
    };

    async function act(fn: () => Promise<void>, ok: string, tone: "success" | "warning" = "success") {
        setBusy(true);
        try {
            await fn();
            addToast(ok, tone);
            await load();
        } catch (err) {
            addToast(getErrorMessage(err, "הפעולה נכשלה"), "error");
        } finally {
            setBusy(false);
        }
    }

    async function onReject(swap: SwapRequest) {
        const ok = await confirm({ title: "דחיית הבקשה", message: `בקשת ההחלפה של ${swap.requesterName} תיסגר והעובד יקבל על כך התראה.`, confirmLabel: "דחה בקשה", danger: true });
        if (ok) await act(() => rejectSwap(swap._id), "הבקשה נדחתה", "warning");
    }

    async function onApprove(swap: SwapRequest, code: string, name?: string) {
        const ok = await confirm({ title: "אישור מחליף", message: `${name ?? code} יחליף את ${swap.requesterName} במשמרת, ושאר המועמדים יידחו אוטומטית.`, confirmLabel: "אשר החלפה" });
        if (ok) await act(() => approveApplicant(swap._id, code), "ההחלפה אושרה ועודכנה בלוח");
    }

    const renderCard = (s: SwapRequest) => {
        const p = statusPlate(s);
        const sh = s.shiftDetails;
        const apps = s.applicants.filter((x) => x.status === "pending").map((x) => ({ name: x.employeeName, code: x.employeeCode }));
        return (
            <button key={s._id} type="button" className={`kcard ${personClass(s.requesterEmployeeCode)} ${s.status.startsWith("closed") ? "kcard--done" : ""}`} onClick={() => select(s._id)}>
                <span className="kcard__top">
                    <Avatar name={s.requesterName} code={s.requesterEmployeeCode} />
                    <span><strong>{s.requesterName}</strong><small>{timeAgo(s.createdAt)}</small></span>
                </span>
                <span className="kcard__time">{sh ? fmtTimeRange(sh.startTime, sh.endTime) : "—"}</span>
                {sh && <span className="kcard__date">{fmtWeekday(sh.startTime)} {fmtDayMonth(sh.startTime)}{sh.title ? ` · ${sh.title}` : ""}</span>}
                {s.reason && <span className="kcard__reason">{s.reason}</span>}
                <span className="kcard__foot">
                    <span className={`plate ${p.plate}`}>{p.text}</span>
                    {s.status === "published_to_board" && <AvatarStack people={apps} />}
                </span>
            </button>
        );
    };

    const renderColumn = (title: string, tone: string, list: SwapRequest[], empty: string) => (
        <section key={tone} className={`kcol kcol--${tone}`}>
            <header className="kcol__head"><i className="kcol__dot" />{title}<span className="kcol__count">{list.length}</span></header>
            {list.length === 0 ? <p className="kcol__empty">{empty}</p> : list.map(renderCard)}
        </section>
    );

    const sh = selected?.shiftDetails;

    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <h1 className="page__title">בקשות החלפה</h1>
                    <p className="page__subtitle">
                        {loading ? "טוען…" : <>יש <b>{swaps.filter((s) => s.status === "pending_manager_publish").length}</b> בקשות שממתינות לפרסום ו-<b>{waiting}</b> מועמדים שמחכים להחלטה{week?.weekNumber ? ` · שבוע ${week.weekNumber}` : ""}</>}
                    </p>
                </div>
                <div className="page-actions">
                    <SearchInput label="חיפוש בבקשות" placeholder="חיפוש לפי עובד, סיבה או משמרת" value={q} onChange={setQ} />
                    <span className={`live ${connected ? "is-on" : ""}`}><i />{connected ? "בזמן אמת" : "מתחבר…"}</span>
                </div>
            </header>

            {!loading && swaps.length === 0 ? (
                <div className="detail__empty">
                    <Inbox size={40} strokeWidth={1.25} />
                    <strong>אין עדיין בקשות החלפה</strong>
                    <span>כשעובד יבקש להחליף משמרת, הבקשה תופיע כאן ותקבל על כך התראה.</span>
                </div>
            ) : (
                <div className="kanban">
                    {renderColumn("ממתינות לפרסום", "pending", pending, "הכול טופל. אין בקשות שמחכות לך.")}
                    {renderColumn("בבורסה", "board", board, "אין כרגע משמרות פתוחות בבורסה.")}
                    {renderColumn("הושלמו לאחרונה", "done", closed, "עדיין אין היסטוריה.")}
                </div>
            )}

            <Sheet open={Boolean(selected)} onOpenChange={(o) => !o && select(null)} title="פרטי הבקשה">
                {selected && (
                    <div className="detail">
                        <div className="detail__head">
                            <div className="detail__who">
                                <Avatar name={selected.requesterName} code={selected.requesterEmployeeCode} size="lg" />
                                <div><strong>{selected.requesterName}</strong><small>ביקש/ה להחליף · {timeAgo(selected.createdAt)}</small></div>
                            </div>
                            <span className={`plate ${statusPlate(selected).plate}`}>{statusPlate(selected).text}</span>
                        </div>

                        {sh ? (
                            <div className="routesign">
                                <span className="routesign__time">{fmtTimeRange(sh.startTime, sh.endTime)}</span>
                                <span className="routesign__meta"><b>{fmtDateLong(sh.startTime)}</b>{sh.title || "משמרת"}</span>
                            </div>
                        ) : <p className="muted">פרטי המשמרת אינם זמינים.</p>}

                        {selected.reason && <p className="detail__reason"><small>הסיבה שנמסרה</small>{selected.reason}</p>}

                        {selected.status === "pending_manager_publish" && (
                            <div className="detail__actions">
                                <button type="button" className="btn btn--primary" disabled={busy} onClick={() => act(() => publishSwap(selected._id), "הבקשה פורסמה בבורסה")}><Send size={16} />פרסם לבורסה</button>
                                <button type="button" className="btn btn--danger" disabled={busy} onClick={() => onReject(selected)}><X size={16} />דחה בקשה</button>
                            </div>
                        )}

                        {selected.status === "published_to_board" && (
                            <div className="detail__section">
                                <h3>מועמדים להחלפה</h3>
                                <ApplicantsList
                                    applicants={selected.applicants}
                                    busy={busy}
                                    onApprove={(code) => onApprove(selected, code, selected.applicants.find((a) => a.employeeCode === code)?.employeeName)}
                                    onReject={(code) => act(() => rejectApplicant(selected._id, code), "המועמד נדחה", "warning")}
                                />
                            </div>
                        )}

                        {selected.status.startsWith("closed") && (
                            <p className="detail__reason"><small>תוצאה</small>{selected.status === "closed_approved" ? <><Check size={14} style={{ verticalAlign: -2 }} /> המשמרת עברה ל{selected.replacementName}.</> : selected.status === "closed_rejected" ? "הבקשה נדחתה ולא פורסמה." : "הבקשה בוטלה כי המשמרת עודכנה על ידי המנהל."}</p>
                        )}
                    </div>
                )}
            </Sheet>
            {items.length > 0 && (
                <section className="card" style={{ marginTop: 22, padding: "16px 20px" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)", marginBottom: 6 }}>פעילות אחרונה</h3>
                    <ul className="feed">
                        {items.slice(0, 4).map((n) => (
                            <li key={n.id} className={`feed__item feed__item--${n.level}`}><span className="feed__dot" /><div><p>{n.message}</p><time>{timeAgo(n.createdAt)}</time></div></li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
