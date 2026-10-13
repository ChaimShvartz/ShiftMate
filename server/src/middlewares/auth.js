import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { usersRepo } from "../repositories/index.js";
import { throwHttpError } from "../utils/errors.js";

// Resolve the identity from the DB on every request so that deleted/replaced
// users lose access immediately and role/unit changes take effect without relogin.
export async function resolveUser(token) {
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch {
        throwHttpError(401, "Authentication required - Invalid or expired token");
    }
    const record = await usersRepo.getDocByField(
        "employee_code",
        decoded.employeeCode,
    );
    if (!record) {
        throwHttpError(401, "Authentication required - Invalid or expired token");
    }
    return {
        employeeCode: record.employee_code,
        role: record.role,
        unitName: record.unit_name || null,
    };
}

export async function authenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
        throwHttpError(401, "Authentication required - Missing token");

    req.user = await resolveUser(authHeader.split(" ")[1]);
    next();
}

export function authorizeRole(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) throwHttpError(401, "Authentication required");

        if (!allowedRoles.includes(req.user.role))
            throwHttpError(
                403,
                "Authorization required - Insufficient permissions",
            );
        next();
    };
}

export async function socketAuth(socket, next) {
    const token = socket.handshake.auth?.token;

    if (!token) {
        const err = new Error("Authentication required - Missing token");
        err.data = {
            status: 401,
            details: "Token is required for socket connection",
        };
        return next(err);
    }

    try {
        socket.user = await resolveUser(token);
        next();
    } catch {
        const err = new Error(
            "Authentication required - Invalid or expired token",
        );
        err.data = { status: 401, details: "Token verification failed" };
        next(err);
    }
}
