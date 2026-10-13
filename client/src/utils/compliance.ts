import type { ComplianceResult } from "../types";

export const COMPLIANCE_LABEL = {
    ok: "תקין",
    warning: "חריגה קלה",
    violation: "חריגה",
} as const;

export function complianceText(c: ComplianceResult): string {
    switch (c.reason) {
        case "overlap":
            return "חפיפה עם משמרת קיימת של העובד";
        case "rest":
            return `מנוחה של ${c.minRestHours ?? 0} שעות בלבד בין משמרות (נדרש 8 לפחות)`;
        case "overtime_major":
            return `חריגה של ${c.overtime} שעות מהמגבלה השבועית (${c.totalWeeklyHours}/${c.maxWeeklyHours}) — מעל 4 שעות`;
        case "overtime_minor":
            return `חריגה קלה של ${c.overtime} שעות מהמגבלה השבועית (${c.totalWeeklyHours}/${c.maxWeeklyHours})`;
        default:
            return `מנוחה תקינה, ${c.totalWeeklyHours}/${c.maxWeeklyHours} שעות שבועיות`;
    }
}
