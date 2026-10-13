import { motion } from "framer-motion";
import { Users, Clock, ArrowLeftRight, Check, Briefcase, Building2 } from "lucide-react";
import type { SwapRequest } from "../../types";
import { fmtDateShort, fmtTimeRange, timeAgo } from "../../utils/datetime";

interface Props {
    swap: SwapRequest;
    currentEmployeeCode: string;
    busy?: boolean;
    onApply?: () => void;
}

export default function SwapCard({ swap, currentEmployeeCode, busy, onApply }: Props) {
    const myApplication = swap.applicants.find((a) => a.employeeCode === currentEmployeeCode);
    const isRequester = swap.requesterEmployeeCode === currentEmployeeCode;
    const shift = swap.shiftDetails;

    return (
        <motion.article
            className={`swap-card ${isRequester ? "swap-card--mine" : ""}`}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 350, damping: 25 } }}
            layout
        >
            <header className="swap-card__header">
                <span className="avatar">{(swap.requesterName ?? "?").slice(0, 1)}</span>
                <div>
                    <strong>{swap.requesterName ?? swap.requesterEmployeeCode}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                        <small>{timeAgo(swap.createdAt)} · שבוע {swap.weekNumber}</small>
                        {swap.unitName && (
                            <span className="chip chip--unit" style={{ fontSize: "11px", padding: "1px 7px" }}>
                                <Building2 size={11} style={{ opacity: 0.7 }} />
                                <span>{swap.unitName}</span>
                            </span>
                        )}
                    </div>
                </div>
                {isRequester && <span className="chip chip--info">הבקשה שלך</span>}
            </header>

            {shift && (
                <div className="swap-card__shift">
                    <div className="swap-card__when">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Clock size={13} style={{ opacity: 0.6 }} />
                            <span>{fmtDateShort(shift.startTime)}</span>
                        </span>
                        <b>{fmtTimeRange(shift.startTime, shift.endTime)}</b>
                    </div>
                    {shift.title && (
                        <div className="swap-card__title" style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--brand)" }}>
                            <Briefcase size={12} style={{ opacity: 0.8 }} />
                            <span>תפקיד: <strong>{shift.title}</strong></span>
                        </div>
                    )}
                </div>
            )}

            {isRequester && swap.reason && (
                <div className="swap-card__private-reason">
                    <span className="swap-card__private-tag">סיבת הבקשה שלך (פרטי, לא מוצג בבורסה):</span>
                    <p className="swap-card__reason">“{swap.reason}”</p>
                </div>
            )}

            <footer className="swap-card__footer">
                <span className="swap-card__applicants" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Users size={14} style={{ opacity: 0.6 }} />
                    <span>{swap.applicantsCount} מועמדים</span>
                </span>
                {onApply && !isRequester && (
                    <motion.button
                        type="button"
                        className="swap-card__apply-btn"
                        onClick={onApply}
                        disabled={busy || Boolean(myApplication)}
                        whileTap={{ scale: 0.96 }}
                    >
                        {myApplication ? (
                            myApplication.status === "rejected" ? (
                                "לא התקבלה"
                            ) : (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                    <Check size={14} />
                                    <span>ממתין לאישור מנהל</span>
                                </span>
                            )
                        ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <ArrowLeftRight size={14} />
                                <span>קבל משמרת</span>
                            </span>
                        )}
                    </motion.button>
                )}
            </footer>
        </motion.article>
    );
}
