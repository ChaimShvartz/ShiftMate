import { useMemo } from "react";
import type { Shift } from "../../types";
import { dayKey, fmtDayMonth, fmtTime, fmtWeekday, isToday, nowFloating } from "../../utils/datetime";

const HOUR = 46; // px per hour

interface Props {
    shifts: Shift[];
    startDate?: string;
    onSelect: (shift: Shift) => void;
}

const hoursOf = (iso: string) => {
    const d = new Date(iso);
    return d.getUTCHours() + d.getUTCMinutes() / 60;
};

// Week calendar: 7 day columns, hour rail, shifts as positioned blocks.
export default function TimeGrid({ shifts, startDate, onSelect }: Props) {
    const { days, from, to } = useMemo(() => {
        const first = startDate ? dayKey(startDate) : shifts.length ? shifts.map((s) => dayKey(s.startTime)).sort()[0] : dayKey(new Date().toISOString());
        const anchor = new Date(`${first}T00:00:00Z`);
        // Israeli week: Sunday to Saturday.
        const base = new Date(anchor.getTime() - anchor.getUTCDay() * 864e5);
        const days = Array.from({ length: 7 }, (_, i) => new Date(base.getTime() + i * 864e5).toISOString().slice(0, 10));
        let lo = 24, hi = 0;
        shifts.forEach((s) => {
            lo = Math.min(lo, hoursOf(s.startTime));
            const e = hoursOf(s.endTime);
            hi = Math.max(hi, e <= hoursOf(s.startTime) ? 24 : e);
        });
        if (!shifts.length) { lo = 8; hi = 18; }
        return { days, from: Math.max(0, Math.floor(lo) - 1), to: Math.min(24, Math.ceil(hi) + 1) };
    }, [shifts, startDate]);

    const hours = Array.from({ length: to - from }, (_, i) => from + i);
    const nowF = nowFloating();
    const nowKey = nowF.toISOString().slice(0, 10);
    const nowH = nowF.getUTCHours() + nowF.getUTCMinutes() / 60;

    return (
        <div className="tgrid" role="grid" aria-label="לוח שבועי">
            <div className="tgrid__scroll">
                <div className="tgrid__inner" style={{ gridTemplateColumns: `52px repeat(7, minmax(112px, 1fr))` }}>
                    <div className="tgrid__corner" />
                    {days.map((d) => (
                        <div key={d} className={`tgrid__head ${isToday(`${d}T00:00:00Z`) ? "is-today" : ""}`}>
                            <small>{fmtWeekday(`${d}T00:00:00Z`)}</small>
                            <b>{fmtDayMonth(`${d}T00:00:00Z`)}</b>
                        </div>
                    ))}

                    <div className="tgrid__rail" style={{ height: hours.length * HOUR }}>
                        {hours.map((h) => <span key={h} style={{ top: (h - from) * HOUR }}>{String(h).padStart(2, "0")}:00</span>)}
                    </div>

                    {days.map((d) => (
                        <div key={d} className={`tgrid__col ${isToday(`${d}T00:00:00Z`) ? "is-today" : ""}`} style={{ height: hours.length * HOUR }}>
                            {hours.map((h) => <i key={h} className="tgrid__line" style={{ top: (h - from) * HOUR }} />)}
                            {d === nowKey && nowH >= from && nowH <= to && <i className="tgrid__now" style={{ top: (nowH - from) * HOUR }} />}
                            {shifts.filter((s) => dayKey(s.startTime) === d).map((s) => {
                                const st = hoursOf(s.startTime);
                                const en = hoursOf(s.endTime) <= st ? 24 : hoursOf(s.endTime);
                                const past = new Date(s.endTime).getTime() <= nowF.getTime();
                                const swap = s.status === "swap_pending";
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className={`tblock ${swap ? "tblock--swap" : past ? "tblock--past" : ""}`}
                                        style={{ top: (st - from) * HOUR + 2, height: Math.max(30, (en - st) * HOUR - 4) }}
                                        onClick={() => onSelect(s)}
                                    >
                                        <b>{fmtTime(s.startTime)}–{fmtTime(s.endTime)}</b>
                                        <span>{s.title || "משמרת"}</span>
                                        {swap && <em>בהחלפה</em>}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
