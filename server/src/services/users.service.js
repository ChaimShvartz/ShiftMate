import { generateEmployeeCode, hashPassword } from "../utils/auth.js";
import { throwHttpError } from "../utils/errors.js";

export const usersService = {
    async createUser(
        userData,
        { existingManagerInUnit, existingEmailUser, existingAdmin } = {},
    ) {
        if (userData.role === "admin" && existingAdmin) {
            throwHttpError(403, "System is already initialized");
        }

        if (userData.role === "manager" && existingManagerInUnit) {
            throwHttpError(
                409,
                `Unit '${userData.unitName}' already has an active manager`,
            );
        }

        if (existingEmailUser) {
            throwHttpError(409, "Email address is already in use");
        }

        const employee_code = generateEmployeeCode(6);
        const password_hash = await hashPassword(userData.password);

        return {
            employee_code,
            role: userData.role,
            full_name: userData.fullName,
            phone: userData.phone,
            email: userData.email.toLowerCase(),
            password: password_hash,
            unit_name: userData.unitName,
            max_weekly_hours:
                userData.role === "employee"
                    ? userData.maxWeeklyHours || 40
                    : null,
        };
    },

    async updateUser(existingUser, updates) {
        if (!existingUser) {
            throwHttpError(404, "User not found");
        }

        const cleanUpdates = {};

        if (updates.fullName !== undefined)
            cleanUpdates.full_name = updates.fullName;
        if (updates.phone !== undefined) cleanUpdates.phone = updates.phone;
        if (updates.email !== undefined)
            cleanUpdates.email = updates.email.toLowerCase();
        if (updates.unitName !== undefined)
            cleanUpdates.unit_name = updates.unitName;
        if (updates.maxWeeklyHours !== undefined)
            cleanUpdates.max_weekly_hours = updates.maxWeeklyHours;

        if (updates.password) {
            cleanUpdates.password = await hashPassword(updates.password);
        }

        return cleanUpdates;
    },

    async updateSelf(currentUser, updates) {
        if (!currentUser) {
            throwHttpError(401, "Unauthorized");
        }

        const cleanUpdates = {};

        if (updates.fullName !== undefined)
            cleanUpdates.full_name = updates.fullName;
        if (updates.phone !== undefined) cleanUpdates.phone = updates.phone;
        if (updates.email !== undefined)
            cleanUpdates.email = updates.email.toLowerCase();

        if (updates.password) {
            cleanUpdates.password = await hashPassword(updates.password);
        }

        return cleanUpdates;
    },

    deleteUser(userRecord, { hasActiveShifts, hasActiveSwaps } = {}) {
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

    async replaceManager(currentManager, newManagerData) {
        if (!currentManager) {
            throwHttpError(404, "Current manager not found");
        }

        if (currentManager.role !== "manager") {
            throwHttpError(
                400,
                "The specified user to replace is not a manager",
            );
        }

        const newEmployeeCode = generateEmployeeCode(6);
        const password_hash = await hashPassword(newManagerData.password);

        return {
            oldEmployeeCode: currentManager.employee_code,
            newManagerDoc: {
                employee_code: newEmployeeCode,
                role: "manager",
                full_name: newManagerData.fullName,
                phone: newManagerData.phone,
                email: newManagerData.email.toLowerCase(),
                password: password_hash,
                unit_name: currentManager.unit_name,
                max_weekly_hours: null,
            },
        };
    },
};
