import type { LoginResponse, User } from "../types";
import { addAuthHeaders, apiClient } from "./api";

export async function login(
    employeeCode: string,
    password: string,
): Promise<LoginResponse> {
    const res = await apiClient.post("/auth/login", { employeeCode, password });
    return res.data.data;
}

export async function getMe(): Promise<User> {
    const res = await apiClient.get("/users/me", {
        headers: addAuthHeaders(),
    });
    return res.data.data;
}
