// Stable colour per person (calendar-style): same employee, same colour everywhere.
export const personClass = (code: string | undefined | null) => {
    const n = Number(String(code ?? "0").replace(/\D/g, "")) || 0;
    return `pc-${n % 6}`;
};
export const initialsOf = (name?: string | null) => (name ?? "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("");
