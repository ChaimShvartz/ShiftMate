import { throwHttpError } from "../utils/errors.js";

export const validate = (schema, source = "body") => {
    return (req, _res, next) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const issues = result.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
            }));
            throwHttpError(
                400,
                issues[0]?.message || "Validation failed",
                issues,
            );
        }

        req[source] = result.data;
        next();
    };
};
