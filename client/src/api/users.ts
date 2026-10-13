import type { Role, User } from "../types";
import { addAuthHeaders, apiClient } from "./api";

export async function getAllUsers(params?: {
    unitName?: string;
    role?: string;
}): Promise<User[]> {
    const res = await apiClient.get("/users", {
        params,
        headers: addAuthHeaders(),
    });
    return res.data.data;
}

export async function createUser(body: {
    role: Role;
    fullName: string;
    phone: string;
    email: string;
    password: string;
    unitName?: string;
    maxWeeklyHours?: number | null;
}): Promise<User> {
    const res = await apiClient.post("/users", body, {
        headers: addAuthHeaders(),
    });
    return res.data.data;
}

export async function updateMe(body: {
    fullName?: string;
    phone?: string;
    email?: string;
    password?: string;
}): Promise<User> {
    const res = await apiClient.patch("/users/me", body, {
        headers: addAuthHeaders(),
    });
    return res.data.data;
}

export async function updateUser(
    employeeCode: string,
    body: {
        fullName?: string;
        phone?: string;
        email?: string;
        unitName?: string;
        maxWeeklyHours?: number | null;
        password?: string;
    },
): Promise<User> {
    const res = await apiClient.patch(`/users/${employeeCode}`, body, {
        headers: addAuthHeaders(),
    });
    return res.data.data;
}

export async function deleteUser(
    employeeCode: string,
): Promise<{ employeeCode: string; name: string }> {
    const res = await apiClient.delete(`/users/${employeeCode}`, {
        headers: addAuthHeaders(),
    });
    return res.data.deleted;
}

export async function replaceManager(
    employeeCode: string,
    body: {
        fullName: string;
        phone: string;
        email: string;
        password: string;
    },
): Promise<{
    replacedManager: { employeeCode: string; name: string };
    newManager: User;
}> {
    const res = await apiClient.put(`/users/${employeeCode}/replace`, body, {
        headers: addAuthHeaders(),
    });
    return res.data.data;
}
