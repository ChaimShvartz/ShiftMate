import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { throwHttpError } from "../utils/errors.js";

export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    throwHttpError(401, "Authentication required - Missing token");

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    throwHttpError(401, "Authentication required - Invalid or expired token");
  }
}

export function authorizeRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) throwHttpError(401, "Authentication required");

    if (!allowedRoles.includes(req.user.role))
      throwHttpError(403, "Authorization required - Insufficient permissions");
    next();
  };
}
