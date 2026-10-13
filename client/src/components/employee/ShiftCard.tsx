import { motion } from "framer-motion";
import { Clock, ArrowDown, ArrowLeftRight } from "lucide-react";
import type { Shift, SwapRequest } from "../../types";
import { fmtDateShort, fmtTime, rulerSpan } from "../../utils/datetime";

interface Props {
    shift: Shift;
    swap?: SwapRequest;
    past?: boolean;
    onRequestSwap?: (shift: Shift) => void;
}

function swapLabel(swap?: SwapRequest): string {
    if (!swap) return "הוגשה בקשת החלפה";
    if (swap.status === "pending_manager_publish") return "ממתין לאישור פרסום מהמנהל";
    return `פורסם בבורסה · ${swap.applicantsCount} מועמדים`;
}

export default function ShiftCard({ shift, swap, past, onRequestSwap }: Props) {
    const inSwap = shift.status === "swap_pending";
    const span = rulerSpan(shift.startTime, shift.endTime);
    const state = past ? "past" : inSwap ? "pending" : "scheduled";
    const chip = past
        ? ["neutral", "הסתיימה"]
        : inSwap
          ? ["warning", "בהחלפה"]
          : ["success", "משובץ"];

    return (
        <motion.article
            className={`ticket ticket--${state}`}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 350, damping: 25 } }}
            layout
        >
            <div className="ticket__main">
                <div className="ticket__head">
                    <span className="ticket__title">{shift.title || "משמרת"}</span>
                    <span className={`chip chip--${chip[0]}`}>{chip[1]}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="ticket__date">
                    <Clock size={13} style={{ opacity: 0.7 }} />
                    <span>{fmtDateShort(shift.startTime)}</span>
                </div>
                <div className="ruler" aria-hidden>
                    <span
                        className="ruler__seg"
                        style={{ left: `${span.left}%`, width: `${span.width}%` }}
                    />
                </div>
                {onRequestSwap && !inSwap && !past && (
                    <motion.button
                        type="button"
                        className="ticket__swap-btn"
                        onClick={() => onRequestSwap(shift)}
                        whileTap={{ scale: 0.97 }}
                    >
                        <ArrowLeftRight size={14} />
                        <span>בקש החלפה</span>
                    </motion.button>
                )}
                {inSwap && <p className="ticket__note">{swapLabel(swap)}</p>}
            </div>
            <div className="ticket__stub">
                <b>{fmtTime(shift.startTime)}</b>
                <ArrowDown size={14} style={{ opacity: 0.6 }} />
                <b>{fmtTime(shift.endTime)}</b>
                <span className="ticket__stub-edge" />
            </div>
        </motion.article>
    );
}
