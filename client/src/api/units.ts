import type { Unit } from "../types";
import { addAuthHeaders, apiClient } from "./api";

export async function getAllUnits(): Promise<Unit[]> {
    const res = await apiClient.get("/units", {
        headers: addAuthHeaders(),
    });
    return res.data.data;
}

export async function createUnit(name: string): Promise<Unit> {
    const res = await apiClient.post(
        "/units",
        { name },
        { headers: addAuthHeaders() },
    );
    return res.data.data.unit;
}

export async function updateUnit(name: string, newName: string): Promise<Unit> {
    const res = await apiClient.patch(
        `/units/${encodeURIComponent(name)}`,
        { name: newName },
        { headers: addAuthHeaders() },
    );
    return res.data.data.unit;
}

export async function deleteUnit(name: string): Promise<string> {
    const res = await apiClient.delete(`/units/${encodeURIComponent(name)}`, {
        headers: addAuthHeaders(),
    });
    return res.data.deleted;
}
