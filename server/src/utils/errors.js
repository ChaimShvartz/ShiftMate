export const throwHttpError = (status, message, details) => {
    throw Object.assign(new Error(), { status, message, details });
};
