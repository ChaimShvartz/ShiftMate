import crypto from "crypto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 characters, excluding ambiguous 0/O, 1/I

export function generateEmployeeCode(length = 6) {
    const bytes = crypto.randomBytes(length);
    let code = "";
    for (let i = 0; i < length; i++) {
        code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
    return code;
}

export async function hashPassword(plainPassword) {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function comparePassword(plainPassword, hash) {
    return await bcrypt.compare(plainPassword, hash);
}
