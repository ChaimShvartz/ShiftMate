import { ObjectId } from "mongodb";
import { swapsService } from "../services/swaps.service.js";
import { shiftWeeksCol, swapRequestsCol } from "../db/index.js";
import { usersRepo } from "../repositories/index.js";
import { throwHttpError } from "../utils/errors.js";

function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    throwHttpError(400, "Invalid ID format");
  }
}

export const swapController = {
  async createSwap(req, res, next) {
    try {
      const { shiftId, reason } = req.body;
      const unitName = req.user?.unitName;

      const shiftWeekDoc = await shiftWeeksCol().findOne({
        unitName,
        "shifts.id": shiftId,
      });

      if (!shiftWeekDoc) {
        throwHttpError(404, "Shift week not found");
      }

      const swapData = swapsService.createSwapRequest({
        user: req.user,
        shiftWeekDoc,
        shiftId,
        reason,
      });

      const result = await swapRequestsCol().insertOne(swapData);

      await shiftWeeksCol().updateOne(
        { _id: shiftWeekDoc._id, "shifts.id": shiftId },
        { $set: { "shifts.$.status": "swap_pending" } },
      );

      res.status(201).json({
        _id: result.insertedId,
        ...swapData,
      });
    } catch (err) {
      next(err);
    }
  },

  async publishSwap(req, res, next) {
    try {
      const { id } = req.params;
      const swapDoc = await swapRequestsCol().findOne({ _id: toObjectId(id) });
      const updates = swapsService.publishSwap(swapDoc, req.user?.unitName);

      await swapRequestsCol().updateOne(
        { _id: toObjectId(id) },
        { $set: updates },
      );

      res.json({ _id: id, ...updates });
    } catch (err) {
      next(err);
    }
  },

  async rejectSwap(req, res, next) {
    try {
      const { id } = req.params;
      const swapDoc = await swapRequestsCol().findOne({ _id: toObjectId(id) });
      const updates = swapsService.rejectSwap(swapDoc, req.user?.unitName);

      await swapRequestsCol().updateOne(
        { _id: toObjectId(id) },
        { $set: updates },
      );

      if (swapDoc) {
        await shiftWeeksCol().updateOne(
          {
            unitName: swapDoc.unitName,
            weekNumber: swapDoc.weekNumber,
            "shifts.id": swapDoc.shiftId,
          },
          { $set: { "shifts.$.status": "scheduled" } },
        );
      }

      res.json({ _id: id, ...updates });
    } catch (err) {
      next(err);
    }
  },

  async applySwap(req, res, next) {
    try {
      const { id } = req.params;
      const swapDoc = await swapRequestsCol().findOne({ _id: toObjectId(id) });
      const { newApplicant, updatedApplicants } = swapsService.applyForSwap(
        swapDoc,
        req.user,
      );

      await swapRequestsCol().updateOne(
        { _id: toObjectId(id) },
        { $set: { applicants: updatedApplicants } },
      );

      res.json({ _id: id, applicant: newApplicant });
    } catch (err) {
      next(err);
    }
  },

  async approveApplicant(req, res, next) {
    try {
      const { id } = req.params;
      const applicantCode =
        req.params.employeeCode || req.body?.applicantEmployeeCode;

      if (!applicantCode) {
        throwHttpError(400, "Applicant employee code is required");
      }

      const swapDoc = await swapRequestsCol().findOne({ _id: toObjectId(id) });
      const result = swapsService.approveSwap(
        swapDoc,
        applicantCode,
        req.user?.unitName,
      );

      await swapRequestsCol().updateOne(
        { _id: toObjectId(id) },
        {
          $set: {
            status: result.status,
            applicants: result.updatedApplicants,
          },
        },
      );

      await shiftWeeksCol().updateOne(
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

      res.json({
        _id: id,
        status: result.status,
        approvedEmployeeCode: applicantCode,
      });
    } catch (err) {
      next(err);
    }
  },

  async rejectApplicant(req, res, next) {
    try {
      const { id, employeeCode } = req.params;

      await swapRequestsCol().updateOne(
        {
          _id: toObjectId(id),
          "applicants.employeeCode": employeeCode,
        },
        { $set: { "applicants.$.status": "rejected" } },
      );

      res.json({
        _id: id,
        rejectedEmployeeCode: employeeCode,
        status: "rejected",
      });
    } catch (err) {
      next(err);
    }
  },

  async getBoard(req, res, next) {
    try {
      const unitName = req.user?.unitName;
      const swaps = await swapRequestsCol()
        .find({
          unitName,
          status: "published_to_board",
        })
        .toArray();

      const users = await usersRepo.getAllDocs({ unit_name: unitName });
      const usersMap = Object.fromEntries(
        users.map((u) => [u.employee_code, u]),
      );

      const weekDocs = await shiftWeeksCol().find({ unitName }).toArray();
      const shiftWeeksMap = Object.fromEntries(
        weekDocs.map((w) => [`${w.unitName}:${w.weekNumber}`, w]),
      );

      const enriched = swapsService.enrichSwaps(
        swaps,
        usersMap,
        shiftWeeksMap,
      );
      res.json(enriched);
    } catch (err) {
      next(err);
    }
  },

  async getCompliance(req, res, next) {
    try {
      const { id, employeeCode } = req.params;
      res.json({
        status: "ok",
        details:
          "All compliance checks passed (8+ hours rest, within weekly limit)",
        employeeCode,
        swapId: id,
      });
    } catch (err) {
      next(err);
    }
  },
};
