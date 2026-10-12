import { ObjectId } from "mongodb";
import {
    shiftWeeksRepo,
    swapRequestsRepo,
    usersRepo,
} from "../repositories/index.js";
import { complianceService } from "../services/compliance.service.js";
import { swapsService } from "../services/swaps.service.js";
import {
    emitSwapApplicantRejected,
    emitSwapApplied,
    emitSwapApproved,
    emitSwapCreated,
    emitSwapPublished,
    emitSwapRejected,
} from "../sockets/swaps.socket.js";
import { throwHttpError } from "../utils/errors.js";

function toObjectId(id) {
    try {
        return new ObjectId(id);
    } catch {
        throwHttpError(400, "Invalid ID format");
    }
}

export const swapController = {
    async createSwap(req, res) {
        const { shiftId, reason } = req.body;
        const unitName = req.user?.unitName;

        const shiftWeekDoc = await shiftWeeksRepo.findOne({
            unitName,
            "shifts.id": Number(shiftId),
        });

        const swapData = swapsService.createSwapRequest({
            user: req.user,
            shiftWeekDoc,
            shiftId,
            reason,
        });

        const insertedId = await swapRequestsRepo.createDoc(swapData);
        await shiftWeeksRepo.updateOne(
            {
                _id: toObjectId(shiftWeekDoc._id),
                "shifts.id": Number(shiftId),
            },
            { $set: { "shifts.$.status": "swap_pending" } },
        );

        emitSwapCreated(unitName, {
            swapId: insertedId,
            shiftId,
            requesterEmployeeCode: req.user.employeeCode,
        });

        res.status(201).json({
            success: true,
            data: {
                id: insertedId,
                ...swapData,
            },
        });
    },

    async publishSwap(req, res) {
        const { id } = req.params;
        const swapDoc = await swapRequestsRepo.getDocById(id);
        const updates = swapsService.publishSwap(swapDoc, req.user?.unitName);

        await swapRequestsRepo.updateDoc(id, updates);

        emitSwapPublished(swapDoc.unitName, {
            swapId: id,
            shiftId: swapDoc.shiftId,
        });

        res.json({
            success: true,
            data: { id, ...updates },
        });
    },

    async rejectSwap(req, res) {
        const { id } = req.params;
        const swapDoc = await swapRequestsRepo.getDocById(id);
        const updates = swapsService.rejectSwap(swapDoc, req.user?.unitName);

        await swapRequestsRepo.updateDoc(id, updates);

        await shiftWeeksRepo.updateOne(
            {
                unitName: swapDoc.unitName,
                weekNumber: swapDoc.weekNumber,
                "shifts.id": swapDoc.shiftId,
            },
            { $set: { "shifts.$.status": "scheduled" } },
        );

        emitSwapRejected(swapDoc.unitName, swapDoc.requesterEmployeeCode, {
            swapId: id,
        });

        res.json({
            success: true,
            data: { id, ...updates },
        });
    },

    async applySwap(req, res) {
        const { id } = req.params;
        const swapDoc = await swapRequestsRepo.getDocById(id);
        const { newApplicant, updatedApplicants } = swapsService.applyForSwap(
            swapDoc,
            req.user,
        );

        await swapRequestsRepo.updateDoc(id, {
            applicants: updatedApplicants,
        });

        emitSwapApplied(swapDoc.unitName, {
            swapId: id,
            applicantEmployeeCode: req.user.employeeCode,
        });

        res.json({
            success: true,
            data: { id, applicant: newApplicant },
        });
    },

    async approveApplicant(req, res) {
        const { id } = req.params;
        const applicantCode = req.params.employeeCode;

        if (!applicantCode) {
            throwHttpError(400, "Applicant employee code is required");
        }

        const swapDoc = await swapRequestsRepo.getDocById(id);
        const result = swapsService.approveSwap(
            swapDoc,
            applicantCode,
            req.user?.unitName,
        );

        await swapRequestsRepo.updateDoc(id, {
            status: result.status,
            applicants: result.updatedApplicants,
        });

        await shiftWeeksRepo.updateOne(
            {
                unitName: swapDoc.unitName,
                weekNumber: swapDoc.weekNumber,
                "shifts.id": swapDoc.shiftId,
            },
            {
                $set: {
                    "shifts.$.assignedEmployeeCode": applicantCode,
                    "shifts.$.status": "scheduled",
                },
            },
        );

        emitSwapApproved({
            unitName: swapDoc.unitName,
            approvedEmployeeCode: applicantCode,
            requesterEmployeeCode: swapDoc.requesterEmployeeCode,
            swapId: id,
        });

        res.json({
            success: true,
            data: {
                id,
                status: result.status,
                approvedEmployeeCode: applicantCode,
            },
        });
    },

    async rejectApplicant(req, res) {
        const { id } = req.params;
        const applicantCode = req.params.employeeCode;

        if (!applicantCode) {
            throwHttpError(400, "Applicant employee code is required");
        }

        const swapDoc = await swapRequestsRepo.getDocById(id);
        const result = swapsService.rejectApplicant(
            swapDoc,
            applicantCode,
            req.user?.unitName,
        );

        await swapRequestsRepo.updateDoc(id, {
            applicants: result.updatedApplicants,
        });

        emitSwapApplicantRejected(applicantCode, { swapId: id });

        res.json({
            success: true,
            data: {
                id,
                rejectedEmployeeCode: applicantCode,
                status: "rejected",
            },
        });
    },

    async getBoard(req, res) {
        const unitName = req.user?.unitName;

        const currentWeekDoc = await shiftWeeksRepo.findOne(
            { unitName },
            { sort: { weekNumber: -1 } },
        );

        if (!currentWeekDoc) {
            return res.json({ success: true, data: [] });
        }

        const swaps = await swapRequestsRepo.getAllDocs({
            unitName,
            weekNumber: currentWeekDoc.weekNumber,
            status: "published_to_board",
        });

        const users = await usersRepo.getAllDocs({ unit_name: unitName });
        const usersMap = Object.fromEntries(
            users.map((u) => [u.employee_code, u]),
        );

        const enriched = swapsService.enrichSwaps(
            swaps,
            usersMap,
            currentWeekDoc,
        );
        res.json({ success: true, data: enriched });
    },

    async getCompliance(req, res) {
        const { id, employeeCode } = req.params;
        const swapDoc = await swapRequestsRepo.getDocById(id);
        if (!swapDoc) throwHttpError(404, "Swap request not found");

        const shiftWeek = await shiftWeeksRepo.findOne({
            unitName: swapDoc.unitName,
            weekNumber: swapDoc.weekNumber,
        });
        const targetShift = (shiftWeek?.shifts || []).find(
            (s) => String(s.id) === String(swapDoc.shiftId),
        );

        const employeeShifts = (shiftWeek?.shifts || []).filter(
            (s) => s.assignedEmployeeCode === employeeCode,
        );

        const employeeUser = await usersRepo.getDocByField(
            "employee_code",
            employeeCode,
        );

        const compliance = complianceService.checkLaborRules({
            targetShift,
            employeeExistingShifts: employeeShifts,
            maxWeeklyHours: employeeUser?.max_weekly_hours || 40,
        });

        res.json({
            success: true,
            data: {
                ...compliance,
                employeeCode,
                swapId: id,
            },
        });
    },
};
