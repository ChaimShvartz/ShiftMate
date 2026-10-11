import {
    createUserSchema,
    updateMeSchema,
    updateUserSchema,
} from "../models/user.schema.js";
import { generateEmployeeCode, hashPassword } from "../utils/auth.js";
import { throwHttpError } from "../utils/errors.js";

export const usersService = {
    async prepareCreate(
        inputData,
        { existingManagerInUnit, existingEmailUser } = {},
    ) {
        const parsed = createUserSchema.parse(inputData);

        if (parsed.role === "manager" && existingManagerInUnit) {
            throwHttpError(
                409,
                `Unit '${parsed.unitName}' already has an active manager`,
            );
        }

        if (existingEmailUser) {
            throwHttpError(409, "Email address is already in use");
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
            throwHttpError(404, "User not found");
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
            throwHttpError(401, "Unauthorized");
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
            throwHttpError(404, "User not found");
        }

        if (userRecord.role === "manager") {
            throwHttpError(
                400,
                "Managers cannot be deleted directly. Use manager replacement instead.",
            );
        }

        if (hasActiveShifts || hasActiveSwaps) {
            throwHttpError(
                409,
                "Cannot delete employee with active shifts or pending swap requests",
            );
        }

        return true;
    },

    async prepareReplaceManager(currentManager, newManagerData) {
        if (!currentManager) {
            throwHttpError(404, "Current manager not found");
        }

        if (currentManager.role !== "manager") {
            throwHttpError(
                400,
                "The specified user to replace is not a manager",
            );
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
