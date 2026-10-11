import { throwHttpError } from "../utils/errors.js";

export const validate = (schema, source = "body") => {
    return (req, _res, next) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const message =
                result.error.issues?.[0]?.message || "Validation failed";
            throwHttpError(400, message);
        }

        req[source] = result.data;
        next();
    };
};
