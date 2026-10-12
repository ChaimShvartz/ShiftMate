import { throwHttpError } from "../utils/errors.js";

export const swapsService = {
    createSwapRequest({ user, shiftWeekDoc, shiftId, reason }) {
        if (!shiftWeekDoc) {
            throwHttpError(404, "Shift week not found");
        }

        const shift = shiftWeekDoc.shifts.find((s) => s.id === Number(shiftId));

        if (shift.assignedEmployeeCode !== user.employeeCode) {
            throwHttpError(
                403,
                "You can only request a swap for your own assigned shift",
            );
        }

        if (shift.status !== "scheduled") {
            throwHttpError(400, "Shift is already in a swap process");
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        return {
            unitName: user.unitName,
            weekNumber: shiftWeekDoc.weekNumber,
            shiftId: shift.id,
            requesterEmployeeCode: user.employeeCode,
            reason,
            status: "pending_manager_publish",
            applicants: [],
            expiresAt,
            createdAt: now,
        };
    },

    publishSwap(swapDoc, managerUnitName) {
        if (!swapDoc) {
            throwHttpError(404, "Swap request not found");
        }

        if (swapDoc.unitName !== managerUnitName) {
            throwHttpError(
                403,
                "Not authorized to manage swap requests for another unit",
            );
        }

        if (swapDoc.status !== "pending_manager_publish") {
            throwHttpError(
                400,
                "Only pending requests can be published to the board",
            );
        }

        return { status: "published_to_board" };
    },

    rejectSwap(swapDoc, managerUnitName) {
        if (!swapDoc) {
            throwHttpError(404, "Swap request not found");
        }

        if (swapDoc.unitName !== managerUnitName) {
            throwHttpError(
                403,
                "Not authorized to manage swap requests for another unit",
            );
        }
        if (swapDoc.status !== "pending_manager_publish") {
            throwHttpError(
                400,
                "Only pending requests can be published to the board",
            );
        }

        return { status: "closed_rejected" };
    },

    applyForSwap(swapDoc, user) {
        if (!swapDoc) {
            throwHttpError(404, "Swap request not found");
        }

        if (swapDoc.unitName !== user.unitName) {
            throwHttpError(
                403,
                "You can only apply for swaps within your unit",
            );
        }

        if (swapDoc.status !== "published_to_board") {
            throwHttpError(
                400,
                "This swap request is not open for applications",
            );
        }

        if (swapDoc.requesterEmployeeCode === user.employeeCode) {
            throwHttpError(400, "Cannot apply for your own swap request");
        }

        const alreadyApplied = swapDoc.applicants.some(
            (app) => app.employeeCode === user.employeeCode,
        );

        if (alreadyApplied) {
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
        if (!swapDoc) {
            throwHttpError(404, "Swap request not found");
        }

        if (swapDoc.unitName !== managerUnitName) {
            throwHttpError(
                403,
                "Not authorized to approve swaps for another unit",
            );
        }

        if (swapDoc.status !== "published_to_board") {
            throwHttpError(400, "Only published swap requests can be approved");
        }

        const applicant = swapDoc.applicants.find(
            (app) =>
                app.employeeCode === applicantCode && app.status === "pending",
        );

        if (!applicant) {
            throwHttpError(404, "Applicant not found or already processed");
        }
        applicant.status = "approved";

        swapDoc.applicants.forEach(
            (app) =>
                (app.status =
                    app.status === "pending" ? "rejected" : app.status),
        );

        return {
            status: "closed_approved",
            approvedEmployeeCode: applicantCode,
            updatedApplicants: swapDoc.applicants,
        };
    },

    rejectApplicant(swapDoc, applicantCode, managerUnitName) {
        if (!swapDoc) {
            throwHttpError(404, "Swap request not found");
        }

        if (swapDoc.unitName !== managerUnitName) {
            throwHttpError(
                403,
                "Not authorized to reject applicants for another unit",
            );
        }

        if (swapDoc.status !== "published_to_board") {
            throwHttpError(
                400,
                "Only published swap requests can have applicants rejected",
            );
        }

        const applicant = swapDoc.applicants.find(
            (app) =>
                app.employeeCode === applicantCode && app.status === "pending",
        );

        if (!applicant) {
            throwHttpError(404, "Applicant not found or already processed");
        }
        applicant.status = "rejected";

        return {
            status: swapDoc.status,
            rejectedEmployeeCode: applicantCode,
            updatedApplicants: swapDoc.applicants,
        };
    },

    enrichSwaps(swapsList = [], usersMap = {}, shiftWeeksMap = {}) {
        return swapsList.map((swap) => {
            const requester = usersMap[swap.requesterEmployeeCode] || null;
            const weekDoc =
                shiftWeeksMap[`${swap.unitName}:${swap.weekNumber}`] || null;
            const shift = weekDoc
                ? (weekDoc.shifts || []).find(
                      (s) => String(s.id) === String(swap.shiftId),
                  )
                : null;

            const enrichedApplicants = (swap.applicants || []).map((app) => ({
                ...app,
                employeeName:
                    usersMap[app.employeeCode]?.full_name || app.employeeCode,
            }));

            return {
                ...swap,
                requesterName: requester
                    ? requester.full_name
                    : swap.requesterEmployeeCode,
                shiftDetails: shift || null,
                applicants: enrichedApplicants,
            };
        });
    },
};
