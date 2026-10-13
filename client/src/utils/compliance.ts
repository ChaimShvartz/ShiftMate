import type { ComplianceResult } from "../types";

export const COMPLIANCE_LABEL = {
    ok: "תקין",
    warning: "חריגה קלה",
    violation: "חריגה",
} as const;

export function complianceText(c: ComplianceResult): string {
    switch (c.reason) {
        case "overlap":
            return "חפיפה עם משמרת קיימת";
        case "rest":
            return `מנוחה קצרה: ${c.minRestHours ?? 0} שע' (נדרש 8)`;
        case "overtime_major":
            return `חריגה גדולה (+${c.overtime} שע' מעל המגבלה)`;
        case "overtime_minor":
            return `חריגה קלה (+${c.overtime} שע' מעל המגבלה)`;
        default:
            return `${c.totalWeeklyHours}/${c.maxWeeklyHours} שעות שבועיות`;
    }
}
