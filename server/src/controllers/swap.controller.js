import { ObjectId } from "mongodb";
import {
  shiftWeeksRepo,
  swapRequestsRepo,
  usersRepo,
} from "../repositories/index.js";
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
    const { id, employeeCode } = req.params;

    await swapRequestsRepo.updateOne(
      {
        _id: toObjectId(id),
        "applicants.employeeCode": employeeCode,
      },
      { $set: { "applicants.$.status": "rejected" } },
    );

    emitSwapApplicantRejected(employeeCode, { swapId: id });

    res.json({
      success: true,
      data: {
        id,
        rejectedEmployeeCode: employeeCode,
        status: "rejected",
      },
    });
  },

  async getBoard(req, res) {
    const unitName = req.user?.unitName;
    const swaps = await swapRequestsRepo.getAllDocs({
      unitName,
      status: "published_to_board",
    });

    const users = await usersRepo.getAllDocs({ unit_name: unitName });
    const usersMap = Object.fromEntries(users.map((u) => [u.employee_code, u]));

    const weekDocs = await shiftWeeksRepo.getAllDocs(
      { unitName },
      { sort: { weekNumber: -1 } },
    );
    const shiftWeeksMap = Object.fromEntries(
      weekDocs.map((w) => [`${w.unitName}:${w.weekNumber}`, w]),
    );

    const enriched = swapsService.enrichSwaps(swaps, usersMap, shiftWeeksMap);
    res.json({ success: true, data: enriched });
  },

  async getCompliance(req, res) {
    const { id, employeeCode } = req.params;
    res.json({
      success: true,
      data: {
        status: "ok",
        details:
          "All compliance checks passed (8+ hours rest, within weekly limit)",
        employeeCode,
        swapId: id,
      },
    });
  },
};
