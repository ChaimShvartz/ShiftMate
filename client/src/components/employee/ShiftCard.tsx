import type { Shift } from "../../types";

interface Props {
    shift: Shift;
    onRequestSwap?: (shift: Shift) => void;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("he-IL", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

export default function ShiftCard({ shift, onRequestSwap }: Props) {
    const isSwapPending = shift.status === "swap_pending";

    return (
        <div className={`shift-card ${isSwapPending ? "shift-card--pending" : ""}`}>
            <div className="shift-card__header">
                <span className="shift-card__title">{shift.title || "משמרת"}</span>
                <span className={`shift-card__badge shift-card__badge--${shift.status}`}>
                    {isSwapPending ? "ממתין להחלפה" : "משובץ"}
                </span>
            </div>
            <div className="shift-card__time">
                <span className="shift-card__date">{formatDate(shift.startTime)}</span>
                <span className="shift-card__range">
                    {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                </span>
            </div>
            {onRequestSwap && !isSwapPending && (
                <button
                    className="shift-card__swap-btn"
                    onClick={() => onRequestSwap(shift)}
                >
                    🔄 בקש החלפה
                </button>
            )}
            {isSwapPending && (
                <p className="shift-card__swap-notice">הוגשה בקשת החלפה</p>
            )}
        </div>
    );
}
