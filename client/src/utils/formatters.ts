import type { Role } from "../types";

export const getRoleLabel = (role?: Role | string): string => {
    switch (role) {
        case "admin":
            return "מנהל ראשי";
        case "manager":
            return "מנהל יחידה";
        case "employee":
            return "עובד";
        default:
            return role || "";
    }
};
