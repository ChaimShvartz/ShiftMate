import type { ShiftWeek } from "../types";
import { addAuthHeaders, apiClient } from "./api";

export async function getShifts(weekNumber?: number): Promise<ShiftWeek | null> {
    const params = weekNumber ? { weekNumber } : {};
    const res = await apiClient.get("/shifts", {
        headers: addAuthHeaders(),
        params,
    });
    return res.data.data;
}
