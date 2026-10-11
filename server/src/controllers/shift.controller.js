import { shiftWeeksRepo } from "../repositories/index.js";
import { shiftsService } from "../services/shifts.service.js";
import { throwHttpError } from "../utils/errors.js";

export const shiftController = {
    async getShifts(req, res) {
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

        const weekDoc = await shiftWeeksRepo.findOne(filter, {
            sort: { weekNumber: -1 },
        });

        const filtered = shiftsService.filterUserShifts(weekDoc, req.user);
        res.json({
            success: true,
            data: filtered || {
                unitName: unitName || "",
                weekNumber: weekNumber || 1,
                shifts: [],
            },
        });
    },

    async createWeek(req, res) {
        const unitName = req.user?.unitName || req.body?.unitName;
        if (!unitName) {
            throwHttpError(400, "Unit name is required");
        }

        const latestWeekDoc = await shiftWeeksRepo.findOne(
            { unitName },
            { sort: { weekNumber: -1 } },
        );

        const weekData = shiftsService.createWeek(
            { ...req.body, unitName },
            latestWeekDoc,
        );

        const insertedId = await shiftWeeksRepo.createDoc(weekData);
        res.status(201).json({
            success: true,
            data: {
                _id: insertedId,
                ...weekData,
            },
        });
    },

    async updateShift(req, res) {
        const { weekNumber, shiftId } = req.params;
        const unitName = req.user?.unitName;

        const filter = {
            weekNumber: Number(weekNumber),
        };
        if (unitName) filter.unitName = unitName;

        const weekDoc = await shiftWeeksRepo.findOne(filter);
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

        await shiftWeeksRepo.updateOne(
            {
                _id: weekDoc._id,
                "shifts.id": existingShift.id,
            },
            { $set: updateQuery },
        );

        res.json({
            success: true,
            data: {
                ...existingShift,
                ...cleanUpdates,
            },
        });
    },

    async deleteShift(req, res) {
        const { weekNumber, shiftId } = req.params;
        const unitName = req.user?.unitName;

        const filter = {
            weekNumber: Number(weekNumber),
        };
        if (unitName) filter.unitName = unitName;

        const weekDoc = await shiftWeeksRepo.findOne(filter);
        if (!weekDoc) throwHttpError(404, "Week not found");

        await shiftWeeksRepo.updateOne(
            { _id: weekDoc._id },
            { $pull: { shifts: { id: Number(shiftId) || shiftId } } },
        );

        res.json({
            success: true,
            deleted: { weekNumber: Number(weekNumber), shiftId },
        });
    },

    async getImportTemplate(_req, res) {
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="shifts_template.xlsx"',
        );
        res.send(Buffer.from(""));
    },

    async importShifts(req, res) {
        return shiftController.createWeek(req, res);
    },
};
