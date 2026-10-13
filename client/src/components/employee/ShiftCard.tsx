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
    const chip = past ? ["neutral", "הסתיימה"] : inSwap ? ["warning", "בהחלפה"] : ["success", "משובץ"];

    return (
        <article className={`ticket ticket--${state}`}>
            <div className="ticket__main">
                <div className="ticket__head">
                    <span className="ticket__title">{shift.title || "משמרת"}</span>
                    <span className={`chip chip--${chip[0]}`}>{chip[1]}</span>
                </div>
                <span className="ticket__date">{fmtDateShort(shift.startTime)}</span>
                <div className="ruler" aria-hidden>
                    <span className="ruler__seg" style={{ left: `${span.left}%`, width: `${span.width}%` }} />
                </div>
                {onRequestSwap && !inSwap && !past && (
                    <button type="button" className="ticket__swap-btn" onClick={() => onRequestSwap(shift)}>
                        🔄 בקש החלפה
                    </button>
                )}
                {inSwap && <p className="ticket__note">{swapLabel(swap)}</p>}
            </div>
            <div className="ticket__stub">
                <b>{fmtTime(shift.startTime)}</b>
                <i>↓</i>
                <b>{fmtTime(shift.endTime)}</b>
                <span className="ticket__stub-edge" />
            </div>
        </article>
    );
}
