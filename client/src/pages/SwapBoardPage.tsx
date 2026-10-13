import { useCallback, useEffect, useState } from "react";
import { applySwap, getMySwaps } from "../api/swaps";
import SwapCard from "../components/swaps/SwapCard";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { useSwapStore } from "../store/useSwapStore";
import { useUiStore } from "../store/uiStore";
import type { SwapRequest } from "../types";
import { fmtDateShort, fmtTimeRange, timeAgo } from "../utils/datetime";
import { getErrorMessage } from "../utils/getErrorMessage";

const STATUS_LABEL: Record<string, { text: string; tone: string }> = {
    pending_manager_publish: { text: "ממתין לאישור פרסום", tone: "warning" },
    published_to_board: { text: "פורסם בבורסה", tone: "info" },
    closed_approved: { text: "אושר", tone: "success" },
    closed_rejected: { text: "נדחה", tone: "danger" },
    closed_employee_removed: { text: "בוטל", tone: "muted" },
};

export default function SwapBoardPage() {
    const user = useAuthStore((s) => s.user);
    const addToast = useUiStore((s) => s.addToast);
    const swapsVersion = useNotificationStore((s) => s.swapsVersion);
    const { board, loadingBoard, fetchBoard } = useSwapStore();

    const [tab, setTab] = useState<"board" | "mine">("board");
    const [mine, setMine] = useState<SwapRequest[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const [, my] = await Promise.all([fetchBoard(), getMySwaps()]);
            setMine(my);
        } catch (err) {
            addToast(getErrorMessage(err, "שגיאה בטעינת בורסת המשמרות"), "error");
        }
    }, [fetchBoard, addToast]);

    useEffect(() => {
        void refresh();
    }, [refresh, swapsVersion]);

    async function handleApply(swapId: string) {
        setBusyId(swapId);
        try {
            await applySwap(swapId);
            addToast("המועמדות הוגשה — ממתין לאישור המנהל", "success");
            await refresh();
        } catch (err) {
            addToast(getErrorMessage(err, "שגיאה בהגשת מועמדות"), "error");
        } finally {
            setBusyId(null);
        }
    }

    const available = board.filter((s) => s.requesterEmployeeCode !== user?.employeeCode);

    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <h1 className="page__title">בורסת משמרות</h1>
                    <p className="page__subtitle">בקשות החלפה פתוחות ביחידה שלך — מתעדכן בזמן אמת</p>
                </div>
                <div className="segmented" role="tablist">
                    <button role="tab" aria-selected={tab === "board"} className={tab === "board" ? "is-active" : ""} onClick={() => setTab("board")}>
                        בבורסה ({available.length})
                    </button>
                    <button role="tab" aria-selected={tab === "mine"} className={tab === "mine" ? "is-active" : ""} onClick={() => setTab("mine")}>
                        הבקשות שלי ({mine.length})
                    </button>
                </div>
            </header>

            {tab === "board" ? (
                <>
                    {loadingBoard && board.length === 0 && <div className="loading-state">טוען בורסת משמרות...</div>}
                    {!loadingBoard && available.length === 0 && (
                        <div className="empty-card">
                            <span className="empty-icon">🔄</span>
                            <h3>אין בקשות פתוחות כרגע</h3>
                            <p>כשעמית יפרסם משמרת להחלפה — תקבל התראה ותוכל להגיש מועמדות.</p>
                        </div>
                    )}
                    <div className="swaps-grid">
                        {available.map((swap) => (
                            <SwapCard
                                key={swap._id}
                                swap={swap}
                                currentEmployeeCode={user?.employeeCode ?? ""}
                                busy={busyId === swap._id}
                                onApply={() => handleApply(swap._id)}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="timeline">
                    {mine.length === 0 && (
                        <div className="empty-card">
                            <span className="empty-icon">📭</span>
                            <h3>עוד לא הגשת בקשות או מועמדויות</h3>
                        </div>
                    )}
                    {mine.map((s) => {
                        const label = STATUS_LABEL[s.status];
                        const iAmRequester = s.requesterEmployeeCode === user?.employeeCode;
                        const myApp = s.applicants.find((a) => a.employeeCode === user?.employeeCode);
                        return (
                            <article key={s._id} className="timeline-item">
                                <div className="timeline-item__main">
                                    <strong>
                                        {iAmRequester ? "בקשת ההחלפה שלי" : `מועמדות להחלפה של ${s.requesterName}`}
                                    </strong>
                                    {s.shiftDetails && (
                                        <span>{fmtDateShort(s.shiftDetails.startTime)} · {fmtTimeRange(s.shiftDetails.startTime, s.shiftDetails.endTime)}</span>
                                    )}
                                    <small>{timeAgo(s.createdAt)}{s.replacementName && iAmRequester ? ` · עבר ל${s.replacementName}` : ""}</small>
                                </div>
                                <span className={`chip chip--${label.tone}`}>
                                    {!iAmRequester && myApp
                                        ? myApp.status === "approved" ? "התקבלת" : myApp.status === "rejected" ? "לא התקבלת" : "ממתין להחלטה"
                                        : label.text}
                                </span>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
