export const plain = (value) => {
    if (value == null) return "";
    if (value instanceof Date) return value;
    if (typeof value === "object") {
        if (value.richText)
            return value.richText
                .map((t) => t.text)
                .join("")
                .trim();
        if ("result" in value) return plain(value.result);
        return "";
    }
    return typeof value === "string" ? value.trim() : value;
};

const pad = (n) => String(n).padStart(2, "0");

export const cellDate = (value) =>
    value instanceof Date
        ? `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`
        : value;

export const cellTime = (value) => {
    if (value instanceof Date)
        return `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`;
    return typeof value === "string" ? value.replace(/^(\d):/, "0$1:") : value;
};
