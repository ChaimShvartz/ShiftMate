import axios from "axios";
import { translateServerError } from "./errorTranslations";

export function getErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        // No response at all = server down / offline.
        if (!err.response) return translateServerError("Network Error");

        const raw = err.response.data?.error || err.response.data?.message;
        const translated = translateServerError(
            typeof raw === "string" ? raw : "",
            err.response.status,
        );
        return translated || fallback;
    }

    if (err instanceof Error && err.message) {
        return translateServerError(err.message) || fallback;
    }

    return fallback;
}

// Per-row errors returned by the Excel import (details: [{row, message}]).
export function getErrorDetails(
    err: unknown,
): { row?: number; message: string }[] {
    if (!axios.isAxiosError(err)) return [];
    const details = err.response?.data?.details;
    if (!Array.isArray(details)) return [];
    return details.map((d: { row?: number; field?: string; message?: string }) => ({
        row: d.row,
        message: translateServerError(d.message ?? "", 400),
    }));
}
