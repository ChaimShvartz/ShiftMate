import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { comparePassword } from "../utils/auth.js";
import { throwHttpError } from "../utils/errors.js";

export const authService = {
    async authenticateUser(userRecord, plainPassword) {
        // Same error for unknown user and wrong password (no user enumeration).
        if (
            !userRecord ||
            !(await comparePassword(plainPassword, userRecord.password))
        ) {
            throwHttpError(401, "Invalid credentials");
        }

        const token = jwt.sign(
            {
                employeeCode: userRecord.employee_code,
                role: userRecord.role,
                unitName: userRecord.unit_name || null,
            },
            JWT_SECRET,
            { expiresIn: "30d" },
        );

        return {
            token,
            user: {
                employeeCode: userRecord.employee_code,
                role: userRecord.role,
                fullName: userRecord.full_name,
                phone: userRecord.phone,
                email: userRecord.email,
                unitName: userRecord.unit_name || null,
                maxWeeklyHours: userRecord.max_weekly_hours ?? null,
            },
        };
    },

};
