import type { LoginResponse } from "../types";
import { apiClient } from "./api";

export async function login(
    employeeCode: string,
    password: string,
): Promise<LoginResponse> {
    const res = await apiClient.post("/auth/login", { employeeCode, password });
    return res.data.data;
}

