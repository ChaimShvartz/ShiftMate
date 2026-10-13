import type { AppNotification } from "../types";
import { apiClient } from "./api";

export async function getNotifications(): Promise<{
    items: AppNotification[];
    unread: number;
}> {
    return (await apiClient.get("/notifications")).data.data;
}

export async function markAllRead(): Promise<void> {
    await apiClient.patch("/notifications/read");
}

export async function clearNotifications(): Promise<void> {
    await apiClient.delete("/notifications");
}
