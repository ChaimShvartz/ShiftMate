import { create } from "zustand";
import * as api from "../api/notifications";
import { connectSocket, disconnectSocket } from "../services/socket";
import type { AppNotification } from "../types";
import { useUiStore } from "./uiStore";

interface NotificationState {
    items: AppNotification[];
    unread: number;
    connected: boolean;
    // Bumped whenever a live event means list data is stale; pages depend on it.
    swapsVersion: number;
    shiftsVersion: number;

    connect: (token: string) => void;
    disconnect: () => void;
    load: () => Promise<void>;
    markAllRead: () => Promise<void>;
    clearAll: () => Promise<void>;
}

const SHIFT_TYPES = new Set(["import_completed", "shift_updated", "shift_deleted"]);

export const useNotificationStore = create<NotificationState>((set, get) => ({
    items: [],
    unread: 0,
    connected: false,
    swapsVersion: 0,
    shiftsVersion: 0,

    connect: (token) => {
        const socket = connectSocket(token);
        socket.off("notification");
        socket.off("connect");
        socket.off("disconnect");

        socket.on("connect", () => {
            set({ connected: true });
            // Catch up on anything missed while offline / reconnecting.
            void get().load();
            set((s) => ({
                swapsVersion: s.swapsVersion + 1,
                shiftsVersion: s.shiftsVersion + 1,
            }));
        });
        socket.on("disconnect", () => set({ connected: false }));

        socket.on("notification", (n: AppNotification) => {
            set((s) => ({
                items: [n, ...s.items].slice(0, 60),
                unread: s.unread + 1,
                ...(SHIFT_TYPES.has(n.type)
                    ? { shiftsVersion: s.shiftsVersion + 1 }
                    : { swapsVersion: s.swapsVersion + 1 }),
                // A swap affecting a shift status also changes the shift list.
                ...(n.type === "shift_awarded" || n.type === "shift_removed"
                    ? { shiftsVersion: s.shiftsVersion + 1 }
                    : {}),
            }));
            useUiStore.getState().addToast(`${n.title} — ${n.message}`, n.level);
        });
    },

    disconnect: () => {
        disconnectSocket();
        set({ connected: false, items: [], unread: 0 });
    },

    load: async () => {
        try {
            const { items, unread } = await api.getNotifications();
            set({ items, unread });
        } catch {
            /* the bell simply stays as-is; live events keep working */
        }
    },

    markAllRead: async () => {
        set((s) => ({
            unread: 0,
            items: s.items.map((n) => ({ ...n, read: true })),
        }));
        try {
            await api.markAllRead();
        } catch {
            /* optimistic - next load reconciles */
        }
    },

    clearAll: async () => {
        set({ items: [], unread: 0 });
        try {
            await api.clearNotifications();
        } catch {
            /* ignore */
        }
    },
}));
