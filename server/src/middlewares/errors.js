import { throwHttpError } from "../utils/errors.js";

export const notFoundMiddleware = () => throwHttpError(404, `Path not found`);

export function errorHandler(err, _req, res, _next) {
    console.error(err);
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ success: false, message });
}
