import { throwHttpError } from "../utils/errors.js";
import { israelNow } from "../utils/time.js";
import { complianceService } from "./compliance.service.js";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function assertSameUnit(swapDoc, unitName, message) {
    if (!swapDoc) throwHttpError(404, "Swap request not found");
    if (swapDoc.unitName !== unitName) throwHttpError(403, message);
}

export const swapsService = {
    createSwapRequest({ user, shiftWeekDoc, shiftId, reason }) {
        if (!shiftWeekDoc) throwHttpError(404, "Shift week not found");

        const shift = shiftWeekDoc.shifts.find((s) => s.id === Number(shiftId));
        if (!shift) throwHttpError(404, "Shift not found");

        if (shift.assignedEmployeeCode !== user.employeeCode) {
            throwHttpError(
                403,
                "You can only request a swap for your own assigned shift",
            );
        }

        if (shift.status !== "scheduled") {
            throwHttpError(400, "Shift is already in a swap process");
        }

        if (new Date(shift.startTime) <= israelNow().floating) {
            throwHttpError(400, "Shift has already started");
        }

        const now = new Date();
        return {
            unitName: user.unitName,
            weekNumber: shiftWeekDoc.weekNumber,
            shiftId: shift.id,
            requesterEmployeeCode: user.employeeCode,
            reason,
            status: "pending_manager_publish",
            applicants: [],
            expiresAt: new Date(now.getTime() + THIRTY_DAYS),
            createdAt: now,
        };
    },

    publishSwap(swapDoc, managerUnitName) {
        assertSameUnit(
            swapDoc,
            managerUnitName,
            "Not authorized to manage swap requests for another unit",
        );
        if (swapDoc.status !== "pending_manager_publish") {
            throwHttpError(
                400,
                "Only pending requests can be published to the board",
            );
        }
        return { status: "published_to_board" };
    },

    rejectSwap(swapDoc, managerUnitName) {
        assertSameUnit(
            swapDoc,
            managerUnitName,
            "Not authorized to manage swap requests for another unit",
        );
        if (swapDoc.status !== "pending_manager_publish") {
            throwHttpError(400, "Only pending requests can be rejected");
        }
        return { status: "closed_rejected" };
    },

    applyForSwap(swapDoc, user) {
        assertSameUnit(
            swapDoc,
            user.unitName,
            "You can only apply for swaps within your unit",
        );
        if (swapDoc.status !== "published_to_board") {
            throwHttpError(
                400,
                "This swap request is not open for applications",
            );
        }
        if (swapDoc.requesterEmployeeCode === user.employeeCode) {
            throwHttpError(400, "Cannot apply for your own swap request");
        }
        if (swapDoc.applicants.some((a) => a.employeeCode === user.employeeCode)) {
            throwHttpError(
                400,
                "You have already applied for this swap request",
            );
        }

        const newApplicant = {
            employeeCode: user.employeeCode,
            status: "pending",
            appliedAt: new Date(),
        };
        return {
            newApplicant,
            updatedApplicants: [...swapDoc.applicants, newApplicant],
        };
    },

    approveSwap(swapDoc, applicantCode, managerUnitName) {
        assertSameUnit(
            swapDoc,
            managerUnitName,
            "Not authorized to approve swaps for another unit",
        );
        if (swapDoc.status !== "published_to_board") {
            throwHttpError(400, "Only published swap requests can be approved");
        }

        const applicant = swapDoc.applicants.find(
            (a) => a.employeeCode === applicantCode && a.status === "pending",
        );
        if (!applicant) {
            throwHttpError(404, "Applicant not found or already processed");
        }

        const rejectedCodes = [];
        const updatedApplicants = swapDoc.applicants.map((a) => {
            if (a === applicant) return { ...a, status: "approved" };
            if (a.status !== "pending") return a;
            rejectedCodes.push(a.employeeCode);
            return { ...a, status: "rejected" };
        });

        return { status: "closed_approved", updatedApplicants, rejectedCodes };
    },

    rejectApplicant(swapDoc, applicantCode, managerUnitName) {
        assertSameUnit(
            swapDoc,
            managerUnitName,
            "Not authorized to reject applicants for another unit",
        );
        if (swapDoc.status !== "published_to_board") {
            throwHttpError(
                400,
                "Only published swap requests can have applicants rejected",
            );
        }
        if (
            !swapDoc.applicants.some(
                (a) => a.employeeCode === applicantCode && a.status === "pending",
            )
        ) {
            throwHttpError(404, "Applicant not found or already processed");
        }

        return {
            updatedApplicants: swapDoc.applicants.map((a) =>
                a.employeeCode === applicantCode
                    ? { ...a, status: "rejected" }
                    : a,
            ),
        };
    },

    // Compliance of `employeeCode` taking the swap's shift, inside the swap's week.
    complianceFor(swapDoc, weekDoc, employeeCode, maxWeeklyHours) {
        const shifts = weekDoc?.shifts ?? [];
        return complianceService.checkLaborRules({
            targetShift: shifts.find((s) => s.id === swapDoc.shiftId),
            employeeExistingShifts: shifts.filter(
                (s) => s.assignedEmployeeCode === employeeCode,
            ),
            maxWeeklyHours,
        });
    },

    // viewer: { employeeCode, role } - employees only see their own application.
    enrichSwaps(swaps, usersMap, weeksMap, { viewer, withCompliance = false } = {}) {
        const nameOf = (code) => usersMap[code]?.full_name || code;
        const isManager = viewer?.role === "manager";

        return swaps.map((swap) => {
            const weekDoc = weeksMap[swap.weekNumber];
            const shiftDetails =
                weekDoc?.shifts.find((s) => s.id === swap.shiftId) ?? null;

            const applicants = swap.applicants
                .filter((a) => isManager || a.employeeCode === viewer?.employeeCode)
                .map((a) => ({
                    ...a,
                    employeeName: nameOf(a.employeeCode),
                    ...(withCompliance && a.status === "pending"
                        ? {
                              compliance: this.complianceFor(
                                  swap,
                                  weekDoc,
                                  a.employeeCode,
                                  usersMap[a.employeeCode]?.max_weekly_hours,
                              ),
                          }
                        : {}),
                }));

            const approved = swap.applicants.find((a) => a.status === "approved");

            return {
                ...swap,
                requesterName: nameOf(swap.requesterEmployeeCode),
                replacementName: approved ? nameOf(approved.employeeCode) : null,
                shiftDetails,
                applicants,
                applicantsCount: swap.applicants.length,
            };
        });
    },
};
