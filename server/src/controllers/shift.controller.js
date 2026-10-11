import { shiftsService } from "../services/shifts.service.js";
import { shiftWeeksCol } from "../db/index.js";
import { throwHttpError } from "../utils/errors.js";

export const shiftController = {
  async getShifts(req, res, next) {
    try {
      const unitName = req.user?.unitName;
      if (!unitName && req.user?.role !== "admin") {
        throwHttpError(400, "User is not assigned to a unit");
      }

      const weekNumber = req.query.weekNumber
        ? Number(req.query.weekNumber)
        : undefined;

      const filter = {};
      if (unitName) filter.unitName = unitName;
      if (weekNumber) filter.weekNumber = weekNumber;

      const weekDoc = await shiftWeeksCol().findOne(filter, {
        sort: { weekNumber: -1 },
      });

      const filtered = shiftsService.filterUserShifts(weekDoc, req.user);
      res.json(
        filtered || {
          unitName: unitName || "",
          weekNumber: weekNumber || 1,
          shifts: [],
        },
      );
    } catch (err) {
      next(err);
    }
  },

  async createWeek(req, res, next) {
    try {
      const unitName = req.user?.unitName || req.body?.unitName;
      if (!unitName) {
        throwHttpError(400, "Unit name is required");
      }

      const latestWeekDoc = await shiftWeeksCol().findOne(
        { unitName },
        { sort: { weekNumber: -1 } },
      );

      const weekData = shiftsService.createWeek(
        { ...req.body, unitName },
        latestWeekDoc,
      );

      const result = await shiftWeeksCol().insertOne(weekData);
      res.status(201).json({
        _id: result.insertedId,
        ...weekData,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateShift(req, res, next) {
    try {
      const { weekNumber, shiftId } = req.params;
      const unitName = req.user?.unitName;

      const filter = {
        weekNumber: Number(weekNumber),
      };
      if (unitName) filter.unitName = unitName;

      const weekDoc = await shiftWeeksCol().findOne(filter);
      if (!weekDoc) throwHttpError(404, "Week not found");

      const existingShift = (weekDoc.shifts || []).find(
        (s) => String(s.id) === String(shiftId),
      );
      if (!existingShift) throwHttpError(404, "Shift not found");

      const cleanUpdates = shiftsService.updateShift(existingShift, req.body);

      const updateQuery = {};
      for (const [key, val] of Object.entries(cleanUpdates)) {
        updateQuery[`shifts.$.${key}`] = val;
      }

      await shiftWeeksCol().updateOne(
        {
          _id: weekDoc._id,
          "shifts.id": existingShift.id,
        },
        { $set: updateQuery },
      );

      res.json({
        ...existingShift,
        ...cleanUpdates,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteShift(req, res, next) {
    try {
      const { weekNumber, shiftId } = req.params;
      const unitName = req.user?.unitName;

      const filter = {
        weekNumber: Number(weekNumber),
      };
      if (unitName) filter.unitName = unitName;

      const weekDoc = await shiftWeeksCol().findOne(filter);
      if (!weekDoc) throwHttpError(404, "Week not found");

      await shiftWeeksCol().updateOne(
        { _id: weekDoc._id },
        { $pull: { shifts: { id: shiftId } } },
      );

      res.json({
        success: true,
        deleted: { weekNumber: Number(weekNumber), shiftId },
      });
    } catch (err) {
      next(err);
    }
  },

  async getImportTemplate(_req, res, next) {
    try {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="shifts_template.xlsx"',
      );
      res.send(Buffer.from(""));
    } catch (err) {
      next(err);
    }
  },

  async importShifts(req, res, next) {
    try {
      return shiftController.createWeek(req, res, next);
    } catch (err) {
      next(err);
    }
  },
};
