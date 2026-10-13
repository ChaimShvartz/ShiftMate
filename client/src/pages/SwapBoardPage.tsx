import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeftRight,
    Inbox,
    Clock,
    Sparkles,
    Calendar,
    Search,
    ArrowUpDown,
    Briefcase,
    Building2,
    RotateCcw,
} from "lucide-react";
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

type SortKey =
    | "time_asc"
    | "time_desc"
    | "role_asc"
    | "role_desc"
    | "unit_asc"
    | "unit_desc"
    | "applicants_desc";

export default function SwapBoardPage() {
    const user = useAuthStore((s) => s.user);
    const addToast = useUiStore((s) => s.addToast);
    const swapsVersion = useNotificationStore((s) => s.swapsVersion);
    const { board, loadingBoard, fetchBoard } = useSwapStore();

    const [tab, setTab] = useState<"board" | "mine">("board");
    const [mine, setMine] = useState<SwapRequest[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);

    // Filtering & Sorting State
    const [sortBy, setSortBy] = useState<SortKey>("time_asc");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [unitFilter, setUnitFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");

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

    // Unique roles and units in available swaps
    const uniqueRoles = useMemo(() => {
        const set = new Set<string>();
        available.forEach((s) => {
            if (s.shiftDetails?.title) set.add(s.shiftDetails.title);
        });
        return Array.from(set).sort();
    }, [available]);

    const uniqueUnits = useMemo(() => {
        const set = new Set<string>();
        available.forEach((s) => {
            if (s.unitName) set.add(s.unitName);
        });
        return Array.from(set).sort();
    }, [available]);

    // Filtered & Sorted available list
    const filteredSwaps = useMemo(() => {
        const result = available.filter((s) => {
            if (roleFilter !== "all" && (s.shiftDetails?.title ?? "") !== roleFilter) {
                return false;
            }
            if (unitFilter !== "all" && s.unitName !== unitFilter) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const title = (s.shiftDetails?.title ?? "").toLowerCase();
                const unit = (s.unitName ?? "").toLowerCase();
                const requester = (s.requesterName ?? "").toLowerCase();
                if (!title.includes(q) && !unit.includes(q) && !requester.includes(q)) {
                    return false;
                }
            }
            return true;
        });

        return result.sort((a, b) => {
            switch (sortBy) {
                case "role_asc": {
                    const rA = a.shiftDetails?.title ?? "";
                    const rB = b.shiftDetails?.title ?? "";
                    return rA.localeCompare(rB, "he");
                }
                case "role_desc": {
                    const rA = a.shiftDetails?.title ?? "";
                    const rB = b.shiftDetails?.title ?? "";
                    return rB.localeCompare(rA, "he");
                }
                case "unit_asc": {
                    return (a.unitName ?? "").localeCompare(b.unitName ?? "", "he");
                }
                case "unit_desc": {
                    return (b.unitName ?? "").localeCompare(a.unitName ?? "", "he");
                }
                case "applicants_desc": {
                    return (b.applicantsCount ?? 0) - (a.applicantsCount ?? 0);
                }
                case "time_desc": {
                    const tA = a.shiftDetails?.startTime ? new Date(a.shiftDetails.startTime).getTime() : 0;
                    const tB = b.shiftDetails?.startTime ? new Date(b.shiftDetails.startTime).getTime() : 0;
                    return tB - tA;
                }
                case "time_asc":
                default: {
                    const tA = a.shiftDetails?.startTime ? new Date(a.shiftDetails.startTime).getTime() : 0;
                    const tB = b.shiftDetails?.startTime ? new Date(b.shiftDetails.startTime).getTime() : 0;
                    return tA - tB;
                }
            }
        });
    }, [available, roleFilter, unitFilter, searchQuery, sortBy]);

    const hasActiveFilters = roleFilter !== "all" || unitFilter !== "all" || Boolean(searchQuery.trim());

    const resetFilters = () => {
        setRoleFilter("all");
        setUnitFilter("all");
        setSearchQuery("");
        setSortBy("time_asc");
    };

    return (
        <motion.div
            className="page"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            <header className="page-head">
                <div>
                    <h1 className="page__title">בורסת משמרות</h1>
                    <p className="page__subtitle">
                        בקשות החלפה פעילות ביחידה שלך — מתעדכן בזמן אמת
                    </p>
                </div>
                <div className="segmented" role="tablist">
                    <button
                        role="tab"
                        aria-selected={tab === "board"}
                        className={tab === "board" ? "is-active" : ""}
                        onClick={() => setTab("board")}
                    >
                        {tab === "board" && (
                            <motion.span
                                layoutId="swap-tab-pill"
                                className="tab-active-indicator"
                                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                            />
                        )}
                        <span className="tab-label">בבורסה ({available.length})</span>
                    </button>
                    <button
                        role="tab"
                        aria-selected={tab === "mine"}
                        className={tab === "mine" ? "is-active" : ""}
                        onClick={() => setTab("mine")}
                    >
                        {tab === "mine" && (
                            <motion.span
                                layoutId="swap-tab-pill"
                                className="tab-active-indicator"
                                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                            />
                        )}
                        <span className="tab-label">הבקשות שלי ({mine.length})</span>
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {tab === "board" ? (
                    <motion.div
                        key="board-tab"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                    >
                        {/* Linear-Style Sorting & Filtering Toolbar */}
                        {available.length > 0 && (
                            <div className="swaps-toolbar">
                                <div className="swaps-toolbar__search">
                                    <Search size={15} className="swaps-toolbar__search-icon" />
                                    <input
                                        type="text"
                                        placeholder="חיפוש לפי תפקיד, עובד או יחידה..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        aria-label="חיפוש בבורסה"
                                    />
                                </div>

                                <div className="swaps-toolbar__filters">
                                    {/* Sort By Role or Unit or Time */}
                                    <div className="swaps-filter-control" title="מיון משמרות">
                                        <ArrowUpDown size={14} style={{ opacity: 0.7 }} />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as SortKey)}
                                            aria-label="מיון משמרות"
                                        >
                                            <option value="time_asc">מועד משמרת (הקרוב ביותר)</option>
                                            <option value="time_desc">מועד משמרת (הרחוק ביותר)</option>
                                            <option value="role_asc">תפקיד (א׳ עד ת׳)</option>
                                            <option value="role_desc">תפקיד (ת׳ עד א׳)</option>
                                            <option value="unit_asc">יחידה (א׳ עד ת׳)</option>
                                            <option value="unit_desc">יחידה (ת׳ עד א׳)</option>
                                            <option value="applicants_desc">הכי מבוקש (לפי מועמדים)</option>
                                        </select>
                                    </div>

                                    {/* Filter by Role */}
                                    {uniqueRoles.length > 0 && (
                                        <div className="swaps-filter-control" title="סינון לפי תפקיד">
                                            <Briefcase size={14} style={{ opacity: 0.7 }} />
                                            <select
                                                value={roleFilter}
                                                onChange={(e) => setRoleFilter(e.target.value)}
                                                aria-label="סינון לפי תפקיד"
                                            >
                                                <option value="all">כל התפקידים ({uniqueRoles.length})</option>
                                                {uniqueRoles.map((r) => (
                                                    <option key={r} value={r}>
                                                        {r}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Filter by Unit */}
                                    {uniqueUnits.length > 0 && (
                                        <div className="swaps-filter-control" title="סינון לפי יחידה">
                                            <Building2 size={14} style={{ opacity: 0.7 }} />
                                            <select
                                                value={unitFilter}
                                                onChange={(e) => setUnitFilter(e.target.value)}
                                                aria-label="סינון לפי יחידה"
                                            >
                                                <option value="all">כל היחידות ({uniqueUnits.length})</option>
                                                {uniqueUnits.map((u) => (
                                                    <option key={u} value={u}>
                                                        {u}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Reset Filters Button */}
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            className="swaps-clear-btn"
                                            onClick={resetFilters}
                                            title="נקה את כל הסינונים"
                                        >
                                            <RotateCcw size={12} />
                                            <span>איפוס</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {loadingBoard && board.length === 0 && (
                            <div className="loading-state">טוען בורסת משמרות...</div>
                        )}

                        {!loadingBoard && available.length === 0 && (
                            <div className="empty-card">
                                <span className="empty-icon">
                                    <Sparkles size={36} style={{ color: "var(--brand)" }} />
                                </span>
                                <h3>אין בקשות פתוחות כרגע</h3>
                                <p>
                                    כשעמית יפרסם משמרת להחלפה — תקבל התראה ותוכל להגיש מועמדות.
                                </p>
                            </div>
                        )}

                        {!loadingBoard && available.length > 0 && filteredSwaps.length === 0 && (
                            <div className="empty-card">
                                <span className="empty-icon">
                                    <Inbox size={36} style={{ color: "var(--text-3)" }} />
                                </span>
                                <h3>לא נמצאו משמרות תואמות לסינון</h3>
                                <p>נסה לשנות את התפקיד, היחידה או את החיפוש החופשי.</p>
                                <button
                                    type="button"
                                    className="swaps-clear-btn"
                                    onClick={resetFilters}
                                    style={{ marginTop: "12px" }}
                                >
                                    <RotateCcw size={13} />
                                    <span>איפוס כל הסינונים</span>
                                </button>
                            </div>
                        )}

                        <div className="swaps-grid">
                            {filteredSwaps.map((swap) => (
                                <SwapCard
                                    key={swap._id}
                                    swap={swap}
                                    currentEmployeeCode={user?.employeeCode ?? ""}
                                    busy={busyId === swap._id}
                                    onApply={() => handleApply(swap._id)}
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="mine-tab"
                        className="timeline"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                    >
                        {mine.length === 0 && (
                            <div className="empty-card">
                                <span className="empty-icon">
                                    <Inbox size={36} style={{ color: "var(--text-3)" }} />
                                </span>
                                <h3>עוד לא הגשת בקשות או מועמדויות</h3>
                                <p>בקשות החלפה שתגיש או מועמדויות שתיקח יופיעו כאן.</p>
                            </div>
                        )}
                        {mine.map((s) => {
                            const label = STATUS_LABEL[s.status] || { text: s.status, tone: "muted" };
                            const iAmRequester = s.requesterEmployeeCode === user?.employeeCode;
                            const myApp = s.applicants.find((a) => a.employeeCode === user?.employeeCode);
                            return (
                                <motion.article
                                    key={s._id}
                                    className="timeline-item"
                                    whileHover={{ y: -2 }}
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    layout
                                >
                                    <div className="timeline-item__main">
                                        <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                            <ArrowLeftRight size={14} style={{ opacity: 0.7 }} />
                                            <span>
                                                {iAmRequester
                                                    ? "בקשת ההחלפה שלי"
                                                    : `מועמדות להחלפה של ${s.requesterName}`}
                                            </span>
                                        </strong>
                                        {s.shiftDetails && (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-2)" }}>
                                                <Calendar size={13} style={{ opacity: 0.6 }} />
                                                <span>
                                                    {fmtDateShort(s.shiftDetails.startTime)} · {fmtTimeRange(s.shiftDetails.startTime, s.shiftDetails.endTime)}
                                                </span>
                                            </span>
                                        )}
                                        <small style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                            <Clock size={11} style={{ opacity: 0.5 }} />
                                            <span>{timeAgo(s.createdAt)}</span>
                                            {s.replacementName && iAmRequester && (
                                                <span> · עבר ל{s.replacementName}</span>
                                            )}
                                        </small>
                                    </div>
                                    <span className={`chip chip--${label.tone}`}>
                                        {!iAmRequester && myApp
                                            ? myApp.status === "approved"
                                                ? "התקבלת"
                                                : myApp.status === "rejected"
                                                  ? "לא התקבלת"
                                                  : "ממתין להחלטה"
                                            : label.text}
                                    </span>
                                </motion.article>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
