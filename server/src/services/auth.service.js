import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { comparePassword } from "../utils/auth.js";
import { throwHttpError } from "../utils/errors.js";

export const authService = {
    async authenticateUser(userRecord, plainPassword) {
        if (!userRecord) {
            throwHttpError(404, "User not found");
        }

        if (!(await comparePassword(plainPassword, userRecord.password))) {
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

    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch {
            throwHttpError(401, "Invalid or expired token");
        }
    },
};
