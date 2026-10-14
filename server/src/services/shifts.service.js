import { throwHttpError } from "../utils/errors.js";
import { israelNow } from "../utils/time.js";

export const shiftsService = {
    createWeek(weekData, latestWeekDoc) {
        const now = new Date();
        // Temporary for the demo: Wednesday is allowed as well as Thursday (luxon weekday 3 / 4).
        const isThursday = [3, 4].includes(israelNow(now).weekday);

        if (!isThursday) {
            throwHttpError(
                400,
                "Excel schedules can only be uploaded on Thursdays",
            );
        }

        if (latestWeekDoc?.createdAt) {
            const diffMs =
                now.getTime() - new Date(latestWeekDoc.createdAt).getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            if (diffDays < 6) {
                throwHttpError(
                    409,
                    "A schedule has already been uploaded for this week. Only one upload per Thursday is allowed.",
                );
            }
        }

        const weekNumber =
            typeof latestWeekDoc?.weekNumber === "number"
                ? latestWeekDoc.weekNumber + 1
                : 1;

        const processedShifts = (weekData.shifts || []).map((shift, index) => {
            const startTime = new Date(shift.startTime);
            const endTime = new Date(shift.endTime);

            if (endTime <= startTime) {
                throwHttpError(400, "Shift end time must be after start time");
            }

            return {
                id: index + 1,
                title: shift.title,
                assignedEmployeeCode: shift.assignedEmployeeCode,
                startTime,
                endTime,
                status: "scheduled",
            };
        });

        const weekStartDate = new Date(
            Math.min(...processedShifts.map((s) => s.startTime.getTime())),
        );
        const expiresAt = new Date(
            weekStartDate.getTime() + 30 * 24 * 60 * 60 * 1000,
        );

        return {
            unitName: weekData.unitName,
            weekNumber,
            weekStartDate,
            expiresAt,
            createdAt: new Date(),
            shifts: processedShifts,
        };
    },

    filterUserShifts(weekDoc, user) {
        if (!weekDoc) return null;

        if (user.role === "manager") {
            return weekDoc;
        }

        const userShifts = (weekDoc.shifts || []).filter(
            (shift) => shift.assignedEmployeeCode === user.employeeCode,
        );

        return {
            ...weekDoc,
            shifts: userShifts,
        };
    },

    updateShift(weekDoc, shiftId, updates) {
        if (!weekDoc) throwHttpError(404, "Week not found");

        const existingShift = weekDoc.shifts.find(
            (s) => s.id === Number(shiftId),
        );
        if (!existingShift) throwHttpError(404, "Shift not found");

        const startTime = updates.startTime
            ? updates.startTime
            : existingShift.startTime;
        const endTime = updates.endTime
            ? updates.endTime
            : existingShift.endTime;

        if (endTime <= startTime) {
            throwHttpError(400, "End time must be after start time");
        }
        return existingShift;
    },

    assignShift(shift, employee, unitName, employeeExistingShifts = []) {
        if (!shift) {
            throwHttpError(404, "Shift not found");
        }

        if (!employee) {
            throwHttpError(404, "Employee not found");
        }

        if (employee.unit_name !== unitName) {
            throwHttpError(400, "Employee does not belong to this unit");
        }

        const targetStart = new Date(shift.startTime).getTime();
        const targetEnd = new Date(shift.endTime).getTime();

        for (const existing of employeeExistingShifts) {
            if (String(existing.id) === String(shift.id)) continue;
            const exStart = new Date(existing.startTime).getTime();
            const exEnd = new Date(existing.endTime).getTime();
            if (targetStart < exEnd && targetEnd > exStart) {
                throwHttpError(
                    409,
                    "Shift overlap: Employee already has an assigned shift during these hours",
                );
            }
        }

        return {
            ...shift,
            assignedEmployeeCode: employee.employee_code,
        };
    },
};
