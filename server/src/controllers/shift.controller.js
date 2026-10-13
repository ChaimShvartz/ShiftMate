import { shiftWeeksRepo, usersRepo } from "../repositories/index.js";
import { excelService } from "../services/excel.service.js";
import { shiftsService } from "../services/shifts.service.js";
import { notify, unitMembers } from "../services/notifications.service.js";
import { closeSwapsForShift } from "../services/swapClosing.service.js";
import { throwHttpError } from "../utils/errors.js";

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
