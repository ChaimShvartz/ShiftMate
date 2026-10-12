import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 10;

export function generateEmployeeCode(length = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length);
    return crypto.randomInt(min, max).toString();
}

export async function hashPassword(plainPassword) {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function comparePassword(plainPassword, hash) {
    return await bcrypt.compare(plainPassword, hash);
}

export const publishUser = (userObj) => {
    if (!userObj) return null;
    const user = userObj.user || userObj;
    const { password, ...rest } = user;
    return rest;
};
