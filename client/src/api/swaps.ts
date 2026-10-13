import type { ComplianceResult, SwapRequest } from "../types";
import { addAuthHeaders, apiClient } from "./api";

export async function getBoard(): Promise<SwapRequest[]> {
    const res = await apiClient.get("/swaps/board", {
        headers: addAuthHeaders(),
    });
    return res.data.data;
}

export async function createSwap(shiftId: number, reason: string): Promise<SwapRequest> {
    const res = await apiClient.post(
        "/swaps",
        { shiftId, reason },
        { headers: addAuthHeaders() },
    );
    return res.data.data;
}

export async function publishSwap(id: string): Promise<void> {
    await apiClient.patch(`/swaps/${id}/publish`, {}, { headers: addAuthHeaders() });
}

export async function rejectSwap(id: string): Promise<void> {
    await apiClient.patch(`/swaps/${id}/reject`, {}, { headers: addAuthHeaders() });
}

export async function applySwap(id: string): Promise<void> {
    await apiClient.post(`/swaps/${id}/apply`, {}, { headers: addAuthHeaders() });
}

export async function approveApplicant(swapId: string, employeeCode: string): Promise<void> {
    await apiClient.patch(
        `/swaps/${swapId}/approve/${employeeCode}`,
        {},
        { headers: addAuthHeaders() },
    );
}

export async function rejectApplicant(swapId: string, employeeCode: string): Promise<void> {
    await apiClient.patch(
        `/swaps/${swapId}/reject-applicant/${employeeCode}`,
        {},
        { headers: addAuthHeaders() },
    );
}

export async function getCompliance(
    swapId: string,
    employeeCode: string,
): Promise<ComplianceResult & { employeeCode: string; swapId: string }> {
    const res = await apiClient.get(`/swaps/${swapId}/compliance/${employeeCode}`, {
        headers: addAuthHeaders(),
    });
    return res.data.data;
}
