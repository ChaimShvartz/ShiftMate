import {
    shiftWeeksRepo,
    swapRequestsRepo,
    usersRepo,
} from "../repositories/index.js";
import { complianceService } from "../services/compliance.service.js";
import { notify, unitMembers } from "../services/notifications.service.js";
import { swapsService } from "../services/swaps.service.js";
import { throwHttpError } from "../utils/errors.js";

const fmtDay = (iso) =>
    new Date(iso).toLocaleDateString("he-IL", {
        timeZone: "UTC",
        weekday: "long",
        day: "numeric",
        month: "numeric",
    });
const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString("he-IL", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
    });
const describeShift = (shift) =>
    shift
        ? `${fmtDay(shift.startTime)}, \u202A${fmtTime(shift.startTime)}–${fmtTime(shift.endTime)}\u202C`
        : "משמרת";

async function loadContext(unitName) {
    const [users, weeks] = await Promise.all([
        usersRepo.getAllDocs({ unit_name: unitName }),
        shiftWeeksRepo.getAllDocs({ unitName }),
    ]);
    return {
        users,
        usersMap: Object.fromEntries(users.map((u) => [u.employee_code, u])),
        weeksMap: Object.fromEntries(weeks.map((w) => [w.weekNumber, w])),
    };
}

async function loadSwapContext(swapDoc) {
    if (!swapDoc) throwHttpError(404, "Swap request not found");
    const weekDoc = await shiftWeeksRepo.findOne({
        unitName: swapDoc.unitName,
        weekNumber: swapDoc.weekNumber,
    });
    const shift = weekDoc?.shifts.find((s) => s.id === swapDoc.shiftId);
    return { weekDoc, shift };
}

export const swapController = {
    async createSwap(req, res) {
        const { shiftId, reason, weekNumber } = req.body;
        const { unitName, employeeCode } = req.user;

        // Shift ids repeat in every week, so always pin the week (default: latest).
        const shiftWeekDoc = await shiftWeeksRepo.findOne(
            weekNumber ? { unitName, weekNumber: Number(weekNumber) } : { unitName },
            { sort: { weekNumber: -1 } },
        );

        const swapData = swapsService.createSwapRequest({
            user: req.user,
            shiftWeekDoc,
            shiftId,
            reason,
        });

        const insertedId = await swapRequestsRepo.createDoc(swapData);
        await shiftWeeksRepo.updateOne(
            { _id: shiftWeekDoc._id, "shifts.id": Number(shiftId) },
            { $set: { "shifts.$.status": "swap_pending" } },
        );

        const requester = await usersRepo.getDocByField("employee_code", employeeCode);
        const shift = shiftWeekDoc.shifts.find((s) => s.id === Number(shiftId));
        await notify({
            recipients: await unitMembers(unitName, "manager"),
            unitName,
            type: "new_request_pending",
            level: "info",
            title: "בקשת החלפה חדשה",
            message: `${requester.full_name} ביקש/ה להחליף משמרת (${describeShift(shift)}) — ממתין לאישור פרסום`,
            data: { swapId: insertedId },
        });

        res.status(201).json({ success: true, data: { id: insertedId, ...swapData } });
    },

    async publishSwap(req, res) {
        const { id } = req.params;
        const swapDoc = await swapRequestsRepo.getDocById(id);
        const updates = swapsService.publishSwap(swapDoc, req.user.unitName);
        await swapRequestsRepo.updateDoc(id, updates);

        const { usersMap } = await loadContext(swapDoc.unitName);
        const { shift } = await loadSwapContext(swapDoc);
        const requesterName = usersMap[swapDoc.requesterEmployeeCode]?.full_name;

        const everyone = await unitMembers(swapDoc.unitName, "employee");
        await notify({
            recipients: everyone.filter((c) => c !== swapDoc.requesterEmployeeCode),
            unitName: swapDoc.unitName,
            type: "request_published_to_board",
            title: "משמרת חדשה בבורסה",
            message: `${requesterName} מחפש/ת מחליף/ה: ${describeShift(shift)}`,
            data: { swapId: id },
        });
        await notify({
            recipients: [swapDoc.requesterEmployeeCode],
            unitName: swapDoc.unitName,
            type: "request_published_to_board",
            level: "success",
            title: "הבקשה שלך פורסמה",
            message: "בקשת ההחלפה שלך אושרה ופורסמה בבורסת המשמרות",
            data: { swapId: id },
        });

        res.json({ success: true, data: { id, ...updates } });
    },

    async rejectSwap(req, res) {
        const { id } = req.params;
        const swapDoc = await swapRequestsRepo.getDocById(id);
        const updates = swapsService.rejectSwap(swapDoc, req.user.unitName);
        await swapRequestsRepo.updateDoc(id, updates);

        await shiftWeeksRepo.updateOne(
            {
                unitName: swapDoc.unitName,
                weekNumber: swapDoc.weekNumber,
                "shifts.id": swapDoc.shiftId,
            },
            { $set: { "shifts.$.status": "scheduled" } },
        );

        await notify({
            recipients: [swapDoc.requesterEmployeeCode],
            unitName: swapDoc.unitName,
            type: "request_rejected",
            level: "warning",
            title: "הבקשה נדחתה",
            message: "בקשת ההחלפה שלך נדחתה על ידי מנהל היחידה",
            data: { swapId: id },
        });

        res.json({ success: true, data: { id, ...updates } });
    },

    async applySwap(req, res) {
        const { id } = req.params;
        const swapDoc = await swapRequestsRepo.getDocById(id);
        const { newApplicant, updatedApplicants } = swapsService.applyForSwap(
            swapDoc,
            req.user,
        );
        await swapRequestsRepo.updateDoc(id, { applicants: updatedApplicants });

        const applicant = await usersRepo.getDocByField(
            "employee_code",
            req.user.employeeCode,
        );
        const requester = await usersRepo.getDocByField(
            "employee_code",
            swapDoc.requesterEmployeeCode,
        );
        await notify({
            recipients: await unitMembers(swapDoc.unitName, "manager"),
            unitName: swapDoc.unitName,
            type: "new_applicant_added",
            title: "מועמד/ת חדש/ה",
            message: `${applicant.full_name} הגיש/ה מועמדות להחלפה של ${requester?.full_name ?? ""}`,
            data: { swapId: id },
        });

        res.json({ success: true, data: { id, applicant: newApplicant } });
    },

    async approveApplicant(req, res) {
        const { id, employeeCode: applicantCode } = req.params;
        const swapDoc = await swapRequestsRepo.getDocById(id);
        const result = swapsService.approveSwap(
            swapDoc,
            applicantCode,
            req.user.unitName,
        );

        const { weekDoc, shift } = await loadSwapContext(swapDoc);
        if (!shift || shift.assignedEmployeeCode !== swapDoc.requesterEmployeeCode) {
            throwHttpError(409, "Shift is no longer assigned to the requester");
        }

        const applicantUser = await usersRepo.getDocByField(
            "employee_code",
            applicantCode,
        );
        const compliance = swapsService.complianceFor(
            swapDoc,
            weekDoc,
            applicantCode,
            applicantUser?.max_weekly_hours,
        );
        if (compliance.status === "violation") {
            throwHttpError(
                422,
                "Cannot approve applicant - labor rules violation",
                compliance,
            );
        }

        await swapRequestsRepo.updateDoc(id, {
            status: result.status,
            applicants: result.updatedApplicants,
        });
        await shiftWeeksRepo.updateOne(
            {
                _id: weekDoc._id,
                "shifts.id": swapDoc.shiftId,
            },
            {
                $set: {
                    "shifts.$.assignedEmployeeCode": applicantCode,
                    "shifts.$.status": "scheduled",
                },
            },
        );

        const { usersMap } = await loadContext(swapDoc.unitName);
        const requesterName = usersMap[swapDoc.requesterEmployeeCode]?.full_name;
        const details = describeShift(shift);
        const involved = [
            swapDoc.requesterEmployeeCode,
            applicantCode,
            ...result.rejectedCodes,
        ];

        await notify({
            recipients: [applicantCode],
            unitName: swapDoc.unitName,
            type: "shift_awarded",
            level: "success",
            title: "קיבלת משמרת!",
            message: `המשמרת (${details}) נוספה ללוח שלך`,
            data: { swapId: id },
        });
        await notify({
            recipients: [swapDoc.requesterEmployeeCode],
            unitName: swapDoc.unitName,
            type: "shift_removed",
            level: "success",
            title: "ההחלפה אושרה",
            message: `ההחלפה אושרה — המשמרת (${details}) הוסרה ממך ועברה ל${usersMap[applicantCode]?.full_name}`,
            data: { swapId: id },
        });
        await notify({
            recipients: result.rejectedCodes,
            unitName: swapDoc.unitName,
            type: "application_rejected",
            level: "warning",
            title: "המועמדות לא התקבלה",
            message: "מועמד אחר נבחר למשמרת",
            data: { swapId: id },
        });
        await notify({
            recipients: (await unitMembers(swapDoc.unitName)).filter(
                (c) => !involved.includes(c),
            ),
            unitName: swapDoc.unitName,
            type: "board_request_closed",
            title: "ההחלפה הושלמה",
            message: `${requesterName} → ${usersMap[applicantCode]?.full_name}: ההחלפה אושרה והבקשה ירדה מהבורסה`,
            data: { swapId: id },
        });

        res.json({
            success: true,
            data: { id, status: result.status, approvedEmployeeCode: applicantCode },
        });
    },

    async rejectApplicant(req, res) {
        const { id, employeeCode: applicantCode } = req.params;
        const swapDoc = await swapRequestsRepo.getDocById(id);
        const result = swapsService.rejectApplicant(
            swapDoc,
            applicantCode,
            req.user.unitName,
        );
        await swapRequestsRepo.updateDoc(id, {
            applicants: result.updatedApplicants,
        });

        await notify({
            recipients: [applicantCode],
            unitName: swapDoc.unitName,
            type: "application_rejected",
            level: "warning",
            title: "המועמדות לא התקבלה",
            message: "הבקשה שלך לא התקבלה",
            data: { swapId: id },
        });

        res.json({
            success: true,
            data: { id, rejectedEmployeeCode: applicantCode, status: "rejected" },
        });
    },

    // Open board for the unit (employees and managers).
    async getBoard(req, res) {
        const { unitName } = req.user;
        const swaps = await swapRequestsRepo.getAllDocs(
            { unitName, status: "published_to_board" },
            { sort: { createdAt: -1 } },
        );
        const { usersMap, weeksMap } = await loadContext(unitName);
        res.json({
            success: true,
            data: swapsService.enrichSwaps(swaps, usersMap, weeksMap, {
                viewer: req.user,
            }),
        });
    },

    // Manager dashboard: every request of the unit, any status, with live
    // compliance for each pending applicant.
    async getManagerSwaps(req, res) {
        const { unitName } = req.user;
        const swaps = await swapRequestsRepo.getAllDocs(
            { unitName },
            { sort: { createdAt: -1 } },
        );
        const { usersMap, weeksMap } = await loadContext(unitName);
        res.json({
            success: true,
            data: swapsService.enrichSwaps(swaps, usersMap, weeksMap, {
                viewer: req.user,
                withCompliance: true,
            }),
        });
    },

    // Employee: my own requests and the requests I applied to.
    async getMySwaps(req, res) {
        const { unitName, employeeCode } = req.user;
        const swaps = await swapRequestsRepo.getAllDocs(
            {
                unitName,
                $or: [
                    { requesterEmployeeCode: employeeCode },
                    { "applicants.employeeCode": employeeCode },
                ],
            },
            { sort: { createdAt: -1 } },
        );
        const { usersMap, weeksMap } = await loadContext(unitName);
        res.json({
            success: true,
            data: swapsService.enrichSwaps(swaps, usersMap, weeksMap, {
                viewer: req.user,
            }),
        });
    },

    async getCompliance(req, res) {
        const { id, employeeCode } = req.params;
        const swapDoc = await swapRequestsRepo.getDocById(id);
        if (!swapDoc) throwHttpError(404, "Swap request not found");
        if (swapDoc.unitName !== req.user.unitName) {
            throwHttpError(403, "Not authorized to view another unit");
        }

        const { weekDoc } = await loadSwapContext(swapDoc);
        const employee = await usersRepo.getDocByField("employee_code", employeeCode);
        if (!employee || employee.unit_name !== swapDoc.unitName) {
            throwHttpError(404, "Employee not found");
        }

        const compliance = complianceService.checkLaborRules({
            targetShift: weekDoc?.shifts.find((s) => s.id === swapDoc.shiftId),
            employeeExistingShifts: (weekDoc?.shifts ?? []).filter(
                (s) => s.assignedEmployeeCode === employeeCode,
            ),
            maxWeeklyHours: employee.max_weekly_hours,
        });

        res.json({
            success: true,
            data: { ...compliance, employeeCode, swapId: id },
        });
    },
};
