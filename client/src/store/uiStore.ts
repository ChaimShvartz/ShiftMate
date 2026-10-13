import { create } from "zustand";
import type { NotificationLevel } from "../types";

export interface Toast {
    id: string;
    message: string;
    type: NotificationLevel;
}

interface ConfirmRequest {
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
    resolve: (ok: boolean) => void;
}

interface UiState {
    toasts: Toast[];
    confirmRequest: ConfirmRequest | null;
    addToast: (message: string, type?: NotificationLevel) => void;
    removeToast: (id: string) => void;
    confirm: (opts: {
        title: string;
        message: string;
        confirmLabel?: string;
        danger?: boolean;
    }) => Promise<boolean>;
    resolveConfirm: (ok: boolean) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
    toasts: [],
    confirmRequest: null,

    addToast: (message, type = "info") => {
        const id = `${Date.now()}-${Math.random()}`;
        set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 5000);
    },

    removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    confirm: ({ title, message, confirmLabel = "אישור", danger = false }) =>
        new Promise<boolean>((resolve) =>
            set({
                confirmRequest: { title, message, confirmLabel, danger, resolve },
            }),
        ),

    resolveConfirm: (ok) => {
        get().confirmRequest?.resolve(ok);
        set({ confirmRequest: null });
    },
}));
