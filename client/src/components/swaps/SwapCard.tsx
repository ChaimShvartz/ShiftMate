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
        <article className={`swap-card ${isRequester ? "swap-card--mine" : ""}`}>
            <header className="swap-card__header">
                <span className="avatar">{(swap.requesterName ?? "?").slice(0, 1)}</span>
                <div>
                    <strong>{swap.requesterName ?? swap.requesterEmployeeCode}</strong>
                    <small>{timeAgo(swap.createdAt)} · שבוע {swap.weekNumber}</small>
                </div>
                {isRequester && <span className="chip chip--info">הבקשה שלך</span>}
            </header>

            {shift && (
                <div className="swap-card__shift">
                    <div className="swap-card__when">
                        <span>{fmtDateShort(shift.startTime)}</span>
                        <b>{fmtTimeRange(shift.startTime, shift.endTime)}</b>
                    </div>
                    {shift.title && <span className="swap-card__title">{shift.title}</span>}
                </div>
            )}

            {swap.reason && <p className="swap-card__reason">“{swap.reason}”</p>}

            <footer className="swap-card__footer">
                <span className="swap-card__applicants">👥 {swap.applicantsCount} מועמדים</span>
                {onApply && !isRequester && (
                    <button
                        type="button"
                        className="swap-card__apply-btn"
                        onClick={onApply}
                        disabled={busy || Boolean(myApplication)}
                    >
                        {myApplication
                            ? myApplication.status === "rejected"
                                ? "לא התקבלה"
                                : "ממתין לאישור מנהל"
                            : "קבל משמרת"}
                    </button>
                )}
            </footer>
        </article>
    );
}
