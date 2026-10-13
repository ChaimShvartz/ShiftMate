import type { SetupStatusResponse, User } from "../types";
import { apiClient } from "./api";

export async function getSetupStatus(): Promise<SetupStatusResponse> {
    const res = await apiClient.get("/setup/status");
    return res.data.data;
}

export async function initAdmin(body: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
}): Promise<User> {
    const res = await apiClient.post("/setup/init", body);
    return res.data.data;
}
