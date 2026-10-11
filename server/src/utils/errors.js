export const throwHttpError = (status, message) => {
  throw Object.assign(new Error(), { status, message });
};
