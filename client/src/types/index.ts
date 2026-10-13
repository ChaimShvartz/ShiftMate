export type Role = "admin" | "manager" | "employee";

export interface User {
    employeeCode: string;
    role: Role;
    fullName: string;
    phone: string;
    email: string;
    unitName?: string | null;
    maxWeeklyHours?: number | null;
}

export interface Unit {
    name: string;
    created_at?: string;
}

export type ShiftStatus = "scheduled" | "swap_pending";

export interface Shift {
    id: number;
    title?: string;
    assignedEmployeeCode: string;
    startTime: string;
    endTime: string;
    status: ShiftStatus;
}

export interface WeekSummary {
    weekNumber: number;
    weekStartDate: string;
}

export interface ShiftWeek {
    _id?: string;
    unitName: string;
    weekNumber: number;
    weekStartDate: string;
    expiresAt: string;
    shifts: Shift[];
    weeks?: WeekSummary[];
}

export type ApplicantStatus = "pending" | "approved" | "rejected";

export interface SwapApplicant {
    employeeCode: string;
    employeeName?: string;
    status: ApplicantStatus;
    appliedAt: string;
    compliance?: ComplianceResult;
}

export type SwapRequestStatus =
    | "pending_manager_publish"
    | "published_to_board"
    | "closed_approved"
    | "closed_rejected"
    | "closed_employee_removed";

export interface SwapRequest {
    _id: string;
    unitName: string;
    weekNumber: number;
    shiftId: number;
    requesterEmployeeCode: string;
    reason: string;
    status: SwapRequestStatus;
    applicants: SwapApplicant[];
    expiresAt: string;
    createdAt: string;
    shiftDetails?: Shift | null;
    requesterName?: string;
    replacementName?: string | null;
    applicantsCount: number;
}

export type ComplianceReason =
    | "ok"
    | "overtime_minor"
    | "overlap"
    | "rest"
    | "overtime_major";

export interface ComplianceResult {
    status: "ok" | "warning" | "violation";
    reason: ComplianceReason;
    minRestHours: number | null;
    totalWeeklyHours: number;
    overtime: number;
    maxWeeklyHours: number;
}

export type NotificationLevel = "info" | "success" | "warning" | "error";

export interface AppNotification {
    id: string;
    type: string;
    level: NotificationLevel;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    data?: { swapId?: string; weekNumber?: number; shiftId?: number };
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface SetupStatusResponse {
    initialized: boolean;
}
