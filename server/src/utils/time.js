// Shift times are stored as "floating" wall-clock times (Excel "08:00" -> 08:00Z),
// so "now" must be expressed the same way (Israel wall-clock) before comparing.
const TZ = "Asia/Jerusalem";

export function israelNow(date = new Date()) {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-US", {
            timeZone: TZ,
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            weekday: "short",
        })
            .formatToParts(date)
            .map((p) => [p.type, p.value]),
    );
    const floating = new Date(
        Date.UTC(
            +parts.year,
            +parts.month - 1,
            +parts.day,
            +parts.hour % 24,
            +parts.minute,
            +parts.second,
        ),
    );
    return { floating, weekday: floating.getUTCDay() };
}
