import { throwHttpError } from "../utils/errors.js";

export const notFoundMiddleware = () => throwHttpError(404, `Path not found`);

export function errorHandler(err, _req, res, _next) {
    console.error(err);
    // Unexpected (non-HTTP) errors never leak internals to the client.
    const status = err.status || (err.code === "23505" ? 409 : 500);
    const message = err.status
        ? err.message
        : err.code === "23505"
          ? "Record already exists"
          : "Internal Server Error";
    const details = err.status ? err.details : undefined;
    res.status(status).json({
        success: false,
        message,
        ...(details && { details }),
    });
}
