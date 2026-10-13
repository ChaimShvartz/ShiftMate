import type { SwapRequest } from "../../types";

interface Props {
    swap: SwapRequest;
    currentEmployeeCode: string;
    onApply?: () => void;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("he-IL", {
        day: "numeric",
        month: "short",
        weekday: "short",
    });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function SwapCard({ swap, currentEmployeeCode, onApply }: Props) {
    const alreadyApplied = swap.applicants.some(
        (a) => a.employeeCode === currentEmployeeCode,
    );
    const isRequester = swap.requesterEmployeeCode === currentEmployeeCode;

    return (
        <div className="swap-card">
            <div className="swap-card__header">
                <span className="swap-card__requester">
                    🔄 {swap.requesterName ?? swap.requesterEmployeeCode}
                </span>
                <span className="swap-card__week">שבוע {swap.weekNumber}</span>
            </div>

            {swap.shiftDetails && (
                <div className="swap-card__shift">
                    <span>{swap.shiftDetails.title || "משמרת"}</span>
                    <span>
                        {formatDate(swap.shiftDetails.startTime)} ·{" "}
                        {formatTime(swap.shiftDetails.startTime)}–
                        {formatTime(swap.shiftDetails.endTime)}
                    </span>
                </div>
            )}

            {swap.reason && (
                <p className="swap-card__reason">"{swap.reason}"</p>
            )}

            <div className="swap-card__footer">
                <span className="swap-card__applicants">
                    👥 {swap.applicants.length} מועמדים
                </span>

                {onApply && !isRequester && (
                    <button
                        className="swap-card__apply-btn"
                        onClick={onApply}
                        disabled={alreadyApplied}
                    >
                        {alreadyApplied ? "✓ הוגשה מועמדות" : "הגש מועמדות"}
                    </button>
                )}
            </div>
        </div>
    );
}
