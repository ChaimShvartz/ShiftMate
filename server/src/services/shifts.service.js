import crypto from "node:crypto";
import { throwHttpError } from "../utils/errors.js";

export const shiftsService = {
    createWeek(weekData, latestWeekDoc) {
        if (latestWeekDoc?.createdAt) {
            const now = new Date();
            const diffMs =
                now.getTime() - new Date(latestWeekDoc.createdAt).getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            if (diffDays < 7) {
                const daysLeft = Math.ceil(7 - diffDays);
                throwHttpError(
                    400,
                    `A schedule is already active. A new week can only be created 7 days after the last one (${daysLeft} day(s) remaining)`,
                );
            }
        }

        const weekNumber =
            weekData.weekNumber ||
            (typeof latestWeekDoc?.weekNumber === "number"
                ? latestWeekDoc.weekNumber + 1
                : 1);

        const processedShifts = (weekData.shifts || []).map((shift) => {
            const start = new Date(shift.startTime).getTime();
            const end = new Date(shift.endTime).getTime();

            if (end <= start) {
                throwHttpError(400, "Shift end time must be after start time");
            }

            return {
                id: shift.id || crypto.randomUUID(),
                title: shift.title || "",
                role: shift.role || null,
                assignedEmployeeCode: shift.assignedEmployeeCode || null,
                startTime: new Date(shift.startTime),
                endTime: new Date(shift.endTime),
                status: shift.status || "scheduled",
            };
        });

        return {
            unitName: weekData.unitName,
            weekNumber,
            createdAt: new Date(),
            shifts: processedShifts,
        };
    },

    filterUserShifts(weekDoc, user) {
        if (!weekDoc) return null;

        if (user.role === "manager" || user.role === "admin") {
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

    updateShift(existingShift, updates) {
        if (!existingShift) {
            throwHttpError(404, "Shift not found");
        }

        const cleanUpdates = {};

        if (updates.title !== undefined) cleanUpdates.title = updates.title;
        if (updates.role !== undefined) cleanUpdates.role = updates.role;
        if (updates.assignedEmployeeCode !== undefined) {
            cleanUpdates.assignedEmployeeCode = updates.assignedEmployeeCode;
        }

        const startTime = updates.startTime
            ? new Date(updates.startTime)
            : new Date(existingShift.startTime);
        const endTime = updates.endTime
            ? new Date(updates.endTime)
            : new Date(existingShift.endTime);

        if (endTime <= startTime) {
            throwHttpError(400, "End time must be after start time");
        }

        if (updates.startTime !== undefined) cleanUpdates.startTime = startTime;
        if (updates.endTime !== undefined) cleanUpdates.endTime = endTime;

        return cleanUpdates;
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
