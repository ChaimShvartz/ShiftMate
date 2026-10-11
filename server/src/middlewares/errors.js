import { throwHttpError } from "../utils/errors.js";

export const notFoundMiddleware = () => throwHttpError(404, `Path not found`);

export function errorHandler(err, _req, res, _next) {
    console.error(err);

    if (err.name === "ZodError" || err.issues) {
        const message = err.issues?.[0]?.message || "Validation error";
        return res.status(400).json({ error: message });
    }

    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ error: message });
}
