import type { Shift, ShiftWeek } from "../types";
import { addAuthHeaders, apiClient } from "./api";

export async function getShifts(
    weekNumber?: number,
): Promise<ShiftWeek | null> {
    const params = weekNumber ? { weekNumber } : {};
    const res = await apiClient.get("/shifts", {
        headers: addAuthHeaders(),
        params,
    });
    return res.data.data;
}

export interface CreateShiftBody {
    assignedEmployeeCode: string;
    title?: string;
    startTime: string;
    endTime: string;
    force?: boolean;
}

export async function createShift(weekNumber: number, body: CreateShiftBody): Promise<Shift> {
    const res = await apiClient.post(`/shifts/${weekNumber}`, body);
    return res.data.data;
}

export async function updateShift(
    weekNumber: number,
    shiftId: number,
    body: {
        title?: string;
        startTime?: string;
        endTime?: string;
        assignedEmployeeCode?: string;
    },
): Promise<Shift> {
    const res = await apiClient.patch(
        `/shifts/${weekNumber}/${shiftId}`,
        body,
        {
            headers: addAuthHeaders(),
        },
    );
    return res.data.data;
}

export async function deleteShift(
    weekNumber: number,
    shiftId: number,
): Promise<{ weekNumber: number; shiftId: number }> {
    const res = await apiClient.delete(`/shifts/${weekNumber}/${shiftId}`, {
        headers: addAuthHeaders(),
    });
    return res.data.deleted;
}

export async function downloadTemplate(): Promise<Blob> {
    const res = await apiClient.get("/shifts/import/template", {
        headers: addAuthHeaders(),
        responseType: "blob",
    });
    return res.data;
}

export async function importShifts(file: File): Promise<ShiftWeek> {
    const res = await apiClient.post("/shifts/import", file, {
        headers: {
            ...addAuthHeaders(),
            "Content-Type":
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });
    return res.data.data;
}
