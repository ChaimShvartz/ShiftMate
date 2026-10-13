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
            email: userData.email,
            password: password_hash,
            unit_name:
                userData.role === "admin" ? null : userData.unitName || null,
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

        const dbUpdates = {};
        if (updates.fullName !== undefined)
            dbUpdates.full_name = updates.fullName;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.password) {
            dbUpdates.password = await hashPassword(updates.password);
        }

        if (existingUser.role === "admin") {
            dbUpdates.unit_name = null;
            dbUpdates.max_weekly_hours = null;
        } else if (existingUser.role === "manager") {
            if (updates.unitName !== undefined)
                dbUpdates.unit_name = updates.unitName;
            dbUpdates.max_weekly_hours = null;
        } else if (existingUser.role === "employee") {
            if (updates.unitName !== undefined)
                dbUpdates.unit_name = updates.unitName;
            if (updates.maxWeeklyHours !== undefined) {
                dbUpdates.max_weekly_hours = updates.maxWeeklyHours || 40;
            }
        }

        return dbUpdates;
    },

    deleteUser(userRecord, { hasActiveShifts } = {}) {
        if (!userRecord) {
            throwHttpError(404, "User not found");
        }

        if (hasActiveShifts) {
            throwHttpError(400, "Cannot delete employee with active shifts");
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
                email: newManagerData.email,
                password: password_hash,
                unit_name: currentManager.unit_name,
                max_weekly_hours: null,
            },
        };
    },
};
