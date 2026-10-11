import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { loginSchema } from "../models/user.schema.js";
import { comparePassword } from "../utils/auth.js";

export const authService = {
    validateLoginInput(credentials) {
        return loginSchema.parse(credentials);
    },

    async validateCredentials(userRecord, plainPassword) {
        if (!userRecord || !userRecord.password_hash) {
            const err = new Error("Invalid credentials");
            err.status = 401;
            throw err;
        }

        const isValid = await comparePassword(
            plainPassword,
            userRecord.password_hash,
        );
        if (!isValid) {
            const err = new Error("Invalid credentials");
            err.status = 401;
            throw err;
        }

        return {
            employeeCode: userRecord.employee_code,
            role: userRecord.role,
            fullName: userRecord.full_name,
            unitName: userRecord.unit_name || null,
        };
    },

    generateToken(userPayload, expiresIn = "30d") {
        return jwt.sign(
            {
                employeeCode: userPayload.employeeCode,
                role: userPayload.role,
                unitName: userPayload.unitName,
            },
            JWT_SECRET,
            { expiresIn },
        );
    },

    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch {
            const error = new Error("Invalid or expired token");
            error.status = 401;
            throw error;
        }
    },
};
