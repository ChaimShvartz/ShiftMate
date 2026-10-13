// Shift times are floating wall-clock values stored as UTC ("08:00" -> 08:00Z),
// so they must always be displayed in UTC, never converted to the browser zone.
const UTC = { timeZone: "UTC" } as const;

export const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("he-IL", {
        ...UTC,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

// Wrapped in an LTR embedding so "08:00–16:00" is not reordered inside RTL text.
export const fmtTimeRange = (start: string, end: string) =>
    `\u202A${fmtTime(start)}–${fmtTime(end)}\u202C`;

export const fmtDateShort = (iso: string) =>
    new Date(iso).toLocaleDateString("he-IL", {
        ...UTC,
        weekday: "short",
        day: "numeric",
        month: "numeric",
    });

export const fmtDateLong = (iso: string) =>
    new Date(iso).toLocaleDateString("he-IL", {
        ...UTC,
        weekday: "long",
        day: "numeric",
        month: "long",
    });

export const dayKey = (iso: string) => iso.slice(0, 10);

export const durationHours = (start: string, end: string) =>
    (new Date(end).getTime() - new Date(start).getTime()) / 36e5;

// "now" in the same floating representation as shift times (Israel wall-clock).
export function nowFloating(): Date {
    const p = Object.fromEntries(
        new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Jerusalem",
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
            .formatToParts(new Date())
            .map((x) => [x.type, x.value]),
    );
    return new Date(
        Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute),
    );
}

export function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "ממש עכשיו";
    if (min < 60) return `לפני ${min} דק׳`;
    const h = Math.floor(min / 60);
    if (h < 24) return `לפני ${h} שע׳`;
    return `לפני ${Math.floor(h / 24)} ימים`;
}

export const isToday = (iso: string) => dayKey(iso) === nowFloating().toISOString().slice(0, 10);
export const fmtWeekday = (iso: string) => new Date(iso).toLocaleDateString("he-IL", { timeZone: "UTC", weekday: "long" });
export const fmtDayMonth = (iso: string) => new Date(iso).toLocaleDateString("he-IL", { timeZone: "UTC", day: "numeric", month: "numeric" });
