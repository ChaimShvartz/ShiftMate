// Every whitespace-separated token must appear somewhere in the haystack.
export function matches(query: string, ...fields: (string | number | null | undefined)[]): boolean {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;
    const hay = fields.filter((f) => f !== null && f !== undefined).join(" ").toLowerCase();
    return tokens.every((t) => hay.includes(t));
}
