import { shiftWeeksRepo, swapRequestsRepo, usersRepo } from "../repositories/index.js";
import { excelService } from "../services/excel.service.js";
import { shiftsService } from "../services/shifts.service.js";
import { notify, unitMembers } from "../services/notifications.service.js";
import { closeSwapsForShift } from "../services/swapClosing.service.js";
import { complianceService } from "../services/compliance.service.js";
import { throwHttpError } from "../utils/errors.js";
import { israelNow } from "../utils/time.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export const shiftController = {
    async getShifts(req, res) {
        const { unitName } = req.user;
        const { weekNumber } = req.query;
        const filter = { unitName };
        if (weekNumber) filter.weekNumber = Number(weekNumber);

        const weekDoc = await shiftWeeksRepo.findOne(filter, {
            sort: { weekNumber: -1 },
        });

        const weeks = (
            await shiftWeeksRepo.getAllDocs(
                { unitName },
                {
                    sort: { weekNumber: 1 },
                    projection: { weekNumber: 1, weekStartDate: 1 },
                },
            )
        ).map(({ weekNumber, weekStartDate }) => ({ weekNumber, weekStartDate }));

        const filtered = shiftsService.filterUserShifts(weekDoc, req.user);
        res.json({
            success: true,
            data: {
                ...(filtered || { unitName, weekNumber: null, shifts: [] }),
                weeks,
            },
        });
    },

    async updateShift(req, res) {
        const { weekNumber, shiftId } = req.params;
        const { unitName } = req.user;

        const weekDoc = await shiftWeeksRepo.findOne({
            weekNumber: Number(weekNumber),
            unitName,
        });
        const shift = shiftsService.updateShift(weekDoc, shiftId, req.body);

        const newCode = req.body.assignedEmployeeCode;
        const reassigned =
            newCode !== undefined && newCode !== shift.assignedEmployeeCode;

        if (newCode) {
            const employee = await usersRepo.getDocByField("employee_code", newCode);
            shiftsService.assignShift(
                { ...shift, ...req.body },
                employee,
                unitName,
                weekDoc.shifts.filter((s) => s.assignedEmployeeCode === newCode),
            );
        }

        const updateQuery = {};
        for (const [key, val] of Object.entries(req.body)) {
            updateQuery[`shifts.$.${key}`] = val;
        }
        if (reassigned) updateQuery["shifts.$.status"] = "scheduled";

        await shiftWeeksRepo.updateOne(
            { _id: weekDoc._id, "shifts.id": shift.id },
            { $set: updateQuery },
        );

        if (reassigned || req.body.startTime || req.body.endTime) {
            await closeSwapsForShift({ unitName, weekNumber: Number(weekNumber), shiftId });
        }

        await notify({
            recipients: [shift.assignedEmployeeCode, newCode],
            unitName,
            type: "shift_updated",
            level: "info",
            title: "משמרת עודכנה",
            message: reassigned
                ? `משמרת "${shift.title || "ללא שם"}" שובצה מחדש על ידי המנהל`
                : `משמרת "${shift.title || "ללא שם"}" עודכנה על ידי המנהל`,
            data: { weekNumber: Number(weekNumber), shiftId: Number(shiftId) },
        });

        res.json({
            success: true,
            data: { ...shift, ...req.body },
        });
    },

    // Manual add of a single shift to an existing week (Sunday-Saturday window).
    async createShift(req, res) {
        const { weekNumber } = req.params;
        const { unitName } = req.user;
        const { assignedEmployeeCode, title, startTime, endTime, force } = req.body;

        const weekDoc = await shiftWeeksRepo.findOne({ weekNumber: Number(weekNumber), unitName });
        if (!weekDoc) throwHttpError(404, "Week not found");

        if (endTime <= startTime) throwHttpError(400, "End time must be after start time");

        const anchor = new Date(weekDoc.weekStartDate);
        const weekStart = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate()) - anchor.getUTCDay() * DAY_MS);
        const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);
        if (startTime < weekStart || startTime >= weekEnd) {
            throwHttpError(400, "Shift must be within the week of the schedule");
        }
        if (startTime <= israelNow().floating) {
            throwHttpError(400, "Cannot add a shift in the past");
        }

        const employee = await usersRepo.getDocByField("employee_code", assignedEmployeeCode);
        if (employee && employee.role !== "employee") throwHttpError(400, "Employee does not belong to this unit");
        const existing = weekDoc.shifts.filter((s) => s.assignedEmployeeCode === assignedEmployeeCode);
        const draft = { id: 0, title, assignedEmployeeCode, startTime, endTime };
        shiftsService.assignShift(draft, employee, unitName, existing); // unit + overlap checks

        const compliance = complianceService.checkLaborRules({
            targetShift: draft,
            employeeExistingShifts: existing,
            maxWeeklyHours: employee.max_weekly_hours,
        });
        if (compliance.status !== "ok" && !force) {
            throwHttpError(409, "Labor rules warning", { code: "labor_warning", compliance });
        }

        // Ids only ever grow: never reuse an id a closed swap may still reference.
        const swaps = await swapRequestsRepo.getAllDocs({ unitName, weekNumber: Number(weekNumber) });
        const id = Math.max(
            weekDoc.nextShiftId ?? 0,
            ...weekDoc.shifts.map((s) => s.id + 1),
            ...swaps.map((s) => s.shiftId + 1),
            1,
        );
        const shift = { id, title, assignedEmployeeCode, startTime, endTime, status: "scheduled" };

        await shiftWeeksRepo.updateOne(
            { _id: weekDoc._id },
            { $push: { shifts: shift }, $set: { nextShiftId: id + 1 } },
        );

        await notify({
            recipients: [assignedEmployeeCode],
            unitName,
            type: "shift_added",
            level: "info",
            title: "נוספה לך משמרת",
            message: `המנהל הוסיף לך משמרת${title ? ` "${title}"` : ""} בלוח השבועי`,
            data: { weekNumber: Number(weekNumber), shiftId: id },
        });

        res.status(201).json({ success: true, data: shift, compliance });
    },

    async deleteShift(req, res) {
        const { weekNumber, shiftId } = req.params;
        const { unitName } = req.user;

        const weekDoc = await shiftWeeksRepo.findOne({
            weekNumber: Number(weekNumber),
            unitName,
        });
        if (!weekDoc) throwHttpError(404, "Week not found");
        const shift = weekDoc.shifts.find((s) => s.id === Number(shiftId));
        if (!shift) throwHttpError(404, "Shift not found");

        await shiftWeeksRepo.updateOne(
            { _id: weekDoc._id },
            { $pull: { shifts: { id: Number(shiftId) } } },
        );
        await closeSwapsForShift({ unitName, weekNumber: Number(weekNumber), shiftId });

        await notify({
            recipients: [shift.assignedEmployeeCode],
            unitName,
            type: "shift_deleted",
            level: "warning",
            title: "משמרת הוסרה",
            message: `משמרת "${shift.title || "ללא שם"}" הוסרה מהלוח שלך על ידי המנהל`,
            data: { weekNumber: Number(weekNumber), shiftId: Number(shiftId) },
        });

        res.json({ success: true, deleted: { weekNumber, shiftId } });
    },

    async getImportTemplate(req, res) {
        const unitName = req.user?.unitName;

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

        await notify({
            recipients: await unitMembers(unitName),
            unitName,
            type: "import_completed",
            level: "success",
            title: "לוח משמרות חדש",
            message: `פורסם לוח משמרות חדש לשבוע ${weekData.weekNumber} (${parsedShifts.length} משמרות)`,
            data: { weekNumber: weekData.weekNumber },
        });

        res.status(201).json({
            success: true,
            data: {
                id: insertedId,
                ...weekData,
            },
        });
    },
};
