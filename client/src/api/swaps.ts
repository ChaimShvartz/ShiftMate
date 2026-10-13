import type { SwapRequest } from "../types";
import { apiClient } from "./api";

export async function getBoard(): Promise<SwapRequest[]> {
    return (await apiClient.get("/swaps/board")).data.data;
}

export async function getManagerSwaps(): Promise<SwapRequest[]> {
    return (await apiClient.get("/swaps/manager")).data.data;
}

export async function getMySwaps(): Promise<SwapRequest[]> {
    return (await apiClient.get("/swaps/mine")).data.data;
}

export async function createSwap(
    shiftId: number,
    reason: string,
    weekNumber?: number,
): Promise<void> {
    await apiClient.post("/swaps", { shiftId, reason, weekNumber });
}

export async function publishSwap(id: string): Promise<void> {
    await apiClient.patch(`/swaps/${id}/publish`);
}

export async function rejectSwap(id: string): Promise<void> {
    await apiClient.patch(`/swaps/${id}/reject`);
}

export async function applySwap(id: string): Promise<void> {
    await apiClient.post(`/swaps/${id}/apply`);
}

export async function approveApplicant(
    swapId: string,
    employeeCode: string,
): Promise<void> {
    await apiClient.patch(`/swaps/${swapId}/applicants/${employeeCode}/approve`);
}

export async function rejectApplicant(
    swapId: string,
    employeeCode: string,
): Promise<void> {
    await apiClient.patch(`/swaps/${swapId}/applicants/${employeeCode}/reject`);
}

