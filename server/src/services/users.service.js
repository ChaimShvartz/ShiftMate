import {
    createUserSchema,
    updateMeSchema,
    updateUserSchema,
} from "../models/user.schema.js";
import { generateEmployeeCode, hashPassword } from "../utils/auth.js";

export const usersService = {
    async prepareCreate(
        inputData,
        { existingManagerInUnit, existingEmailUser } = {},
    ) {
        const parsed = createUserSchema.parse(inputData);

        if (parsed.role === "manager" && existingManagerInUnit) {
            const err = new Error(
                `Unit '${parsed.unitName}' already has an active manager`,
            );
            err.status = 409;
            throw err;
        }

        if (existingEmailUser) {
            const err = new Error("Email address is already in use");
            err.status = 409;
            throw err;
        }

        const employee_code = generateEmployeeCode(6);
        const password_hash = await hashPassword(parsed.password);

        return {
            employee_code,
            role: parsed.role,
            full_name: parsed.fullName,
            phone: parsed.phone,
            email: parsed.email.toLowerCase(),
            password: password_hash,
            unit_name: parsed.unitName,
            max_weekly_hours:
                parsed.role === "employee" ? parsed.maxWeeklyHours || 40 : null,
        };
    },

    async prepareUpdate(existingUser, inputData) {
        if (!existingUser) {
            const err = new Error("User not found");
            err.status = 404;
            throw err;
        }

        const parsed = updateUserSchema.parse(inputData);
        const updates = {};

        if (parsed.fullName !== undefined) updates.full_name = parsed.fullName;
        if (parsed.phone !== undefined) updates.phone = parsed.phone;
        if (parsed.email !== undefined)
            updates.email = parsed.email.toLowerCase();
        if (parsed.unitName !== undefined) updates.unit_name = parsed.unitName;
        if (parsed.maxWeeklyHours !== undefined)
            updates.max_weekly_hours = parsed.maxWeeklyHours;

        if (parsed.password) {
            updates.password = await hashPassword(parsed.password);
        }

        return updates;
    },

    async prepareSelfUpdate(currentUser, inputData) {
        if (!currentUser) {
            const err = new Error("Unauthorized");
            err.status = 401;
            throw err;
        }

        const parsed = updateMeSchema.parse(inputData);
        const updates = {};

        if (parsed.fullName !== undefined) updates.full_name = parsed.fullName;
        if (parsed.phone !== undefined) updates.phone = parsed.phone;
        if (parsed.email !== undefined)
            updates.email = parsed.email.toLowerCase();

        if (parsed.password) {
            updates.password = await hashPassword(parsed.password);
        }

        return updates;
    },

    validateDelete(userRecord, { hasActiveShifts, hasActiveSwaps } = {}) {
        if (!userRecord) {
            const err = new Error("User not found");
            err.status = 404;
            throw err;
        }

        if (userRecord.role === "manager") {
            const err = new Error(
                "Managers cannot be deleted directly. Use manager replacement instead.",
            );
            err.status = 400;
            throw err;
        }

        if (hasActiveShifts || hasActiveSwaps) {
            const err = new Error(
                "Cannot delete employee with active shifts or pending swap requests",
            );
            err.status = 409;
            throw err;
        }

        return true;
    },

    async prepareReplaceManager(currentManager, newManagerData) {
        if (!currentManager) {
            const err = new Error("Current manager not found");
            err.status = 404;
            throw err;
        }

        if (currentManager.role !== "manager") {
            const err = new Error(
                "The specified user to replace is not a manager",
            );
            err.status = 400;
            throw err;
        }

        const parsed = createUserSchema.parse({
            ...newManagerData,
            role: "manager",
            unitName: currentManager.unit_name,
        });

        const newEmployeeCode = generateEmployeeCode(6);
        const password_hash = await hashPassword(parsed.password);

        return {
            oldEmployeeCode: currentManager.employee_code,
            newManagerRecord: {
                employee_code: newEmployeeCode,
                role: "manager",
                full_name: parsed.fullName,
                phone: parsed.phone,
                email: parsed.email.toLowerCase(),
                password: password_hash,
                unit_name: currentManager.unit_name,
                max_weekly_hours: null,
            },
        };
    },
};
