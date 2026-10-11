import { shiftWeeksRepo, usersRepo } from "../repositories/index.js";
import { excelService } from "../services/excel.service.js";
import { shiftsService } from "../services/shifts.service.js";
import {
    emitShiftCreated,
    emitShiftDeleted,
    emitShiftUpdated,
} from "../sockets/shifts.socket.js";
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

        emitShiftCreated(unitName, {
            weekNumber: weekData.weekNumber,
            unitName,
        });

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

        emitShiftUpdated(unitName, {
            weekNumber: Number(weekNumber),
            shiftId,
        });

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

        emitShiftDeleted(unitName, {
            weekNumber: Number(weekNumber),
            shiftId,
        });

        res.json({
            success: true,
            deleted: { weekNumber: Number(weekNumber), shiftId },
        });
    },

    async getImportTemplate(req, res) {
        const unitName = req.user?.unitName;
        if (!unitName) {
            throwHttpError(400, "User is not assigned to a unit");
        }

        const employees = await usersRepo.getAllDocs({
            unit_name: unitName,
            role: "employee",
        });

        const buffer = await excelService.buildTemplate(employees);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="shifts_template.xlsx"',
        );
        res.send(buffer);
    },

    async importShifts(req, res) {
        const unitName = req.user?.unitName;
        if (!unitName) {
            throwHttpError(400, "User is not assigned to a unit");
        }

        if (!req.body || (Buffer.isBuffer(req.body) && req.body.length === 0)) {
            throwHttpError(400, "Please upload a valid Excel file");
        }

        const buffer = Buffer.isBuffer(req.body)
            ? req.body
            : Buffer.from(req.body);

        const employees = await usersRepo.getAllDocs({
            unit_name: unitName,
            role: "employee",
        });

        const rows = await excelService.parseShiftsFile(buffer);
        const parsedShifts = excelService.validateShiftRows(rows, employees);

        const latestWeekDoc = await shiftWeeksRepo.findOne(
            { unitName },
            { sort: { weekNumber: -1 } },
        );

        const weekData = shiftsService.createWeek(
            { unitName, shifts: parsedShifts },
            latestWeekDoc,
        );

        const insertedId = await shiftWeeksRepo.createDoc(weekData);

        emitShiftCreated(unitName, {
            weekNumber: weekData.weekNumber,
            unitName,
        });

        res.status(201).json({
            success: true,
            data: {
                _id: insertedId,
                ...weekData,
            },
        });
    },
};
