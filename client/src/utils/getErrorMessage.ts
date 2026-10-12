import axios from "axios";
import { translateServerError } from "./errorTranslations";

export function getErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        const rawMessage =
            err.response?.data?.error || err.response?.data?.message;

        if (typeof rawMessage === "string" && rawMessage.trim()) {
            return translateServerError(rawMessage);
        }
    }

    if (err instanceof Error && err.message) {
        return translateServerError(err.message);
    }

    return fallback;
}
