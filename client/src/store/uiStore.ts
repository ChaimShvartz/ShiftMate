import { toast } from "sonner";
import { create } from "zustand";
import type { NotificationLevel } from "../types";

interface ConfirmRequest {
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
    resolve: (ok: boolean) => void;
}

interface UiState {
    confirmRequest: ConfirmRequest | null;
    paletteOpen: boolean;
    addToast: (message: string, type?: NotificationLevel) => void;
    confirm: (opts: {
        title: string;
        message: string;
        confirmLabel?: string;
        danger?: boolean;
    }) => Promise<boolean>;
    resolveConfirm: (ok: boolean) => void;
    setPaletteOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
    confirmRequest: null,
    paletteOpen: false,

    addToast: (message, type = "info") => {
        if (!message || !message.trim()) return;
        // Same message id => Sonner updates in place instead of stacking duplicates.
        const opts = { id: message, duration: 4500 };
        if (type === "success") toast.success(message, opts);
        else if (type === "error") toast.error(message, opts);
        else if (type === "warning") toast.warning(message, opts);
        else toast.info(message, opts);
    },

    confirm: ({ title, message, confirmLabel = "אישור", danger = false }) =>
        new Promise<boolean>((resolve) =>
            set({ confirmRequest: { title, message, confirmLabel, danger, resolve } }),
        ),

    resolveConfirm: (ok) => {
        get().confirmRequest?.resolve(ok);
        set({ confirmRequest: null });
    },

    setPaletteOpen: (open) => set({ paletteOpen: open }),
}));
