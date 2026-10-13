import { create } from "zustand";
import * as swapsApi from "../api/swaps";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";
import type { ComplianceResult, SwapRequest } from "../types";

interface ToastMessage {
    id: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
}

interface SwapState {
    board: SwapRequest[];
    loadingBoard: boolean;
    toasts: ToastMessage[];
    compliance: Record<string, ComplianceResult>;

    // actions
    connectRealtime: (token: string, unitName: string) => void;
    disconnectRealtime: () => void;
    fetchBoard: () => Promise<void>;
    createSwap: (shiftId: number, reason: string) => Promise<void>;
    publishSwap: (id: string) => Promise<void>;
    rejectSwap: (id: string) => Promise<void>;
    applySwap: (id: string) => Promise<void>;
    approveApplicant: (swapId: string, employeeCode: string) => Promise<void>;
    rejectApplicant: (swapId: string, employeeCode: string) => Promise<void>;
    fetchCompliance: (
        swapId: string,
        employeeCode: string,
    ) => Promise<ComplianceResult>;
    addToast: (message: string, type?: ToastMessage["type"]) => void;
    removeToast: (id: string) => void;
}

export const useSwapStore = create<SwapState>((set, get) => ({
    board: [],
    loadingBoard: false,
    toasts: [],
    compliance: {},

    connectRealtime: (token, unitName) => {
        const socket = connectSocket(token);

        socket.emit("join_unit", unitName);

        // swap events
        socket.on("swap:created", () => {
            get().addToast("נוצרה בקשת החלפה חדשה", "info");
        });
        socket.on("swap:published", () => {
            get().addToast("בקשת החלפה פורסמה לבורסה", "info");
            get().fetchBoard();
        });
        socket.on("swap:rejected", () => {
            get().addToast("בקשת ההחלפה שלך נדחתה", "warning");
        });
        socket.on("swap:applied", () => {
            get().addToast("הוגשה מועמדות חדשה להחלפה", "info");
        });
        socket.on("swap:approved", (data: { approvedEmployeeCode: string }) => {
            get().addToast(
                `ההחלפה אושרה עבור עובד ${data.approvedEmployeeCode}`,
                "success",
            );
            get().fetchBoard();
        });
        socket.on("swap:applicant_rejected", () => {
            get().addToast("מועמדות להחלפה נדחתה", "warning");
        });

        // shift events
        socket.on("shift:updated", () => {
            get().addToast("משמרת עודכנה", "info");
        });
        socket.on("shift:deleted", () => {
            get().addToast("משמרת נמחקה", "warning");
        });
        socket.on("shift:created", () => {
            get().addToast("לוח משמרות חדש פורסם!", "success");
        });
    },

    disconnectRealtime: () => {
        const socket = getSocket();
        if (socket) {
            socket.off("swap:created");
            socket.off("swap:published");
            socket.off("swap:rejected");
            socket.off("swap:applied");
            socket.off("swap:approved");
            socket.off("swap:applicant_rejected");
            socket.off("shift:updated");
            socket.off("shift:deleted");
            socket.off("shift:created");
        }
        disconnectSocket();
    },

    fetchBoard: async () => {
        set({ loadingBoard: true });
        try {
            const board = await swapsApi.getBoard();
            set({ board });
        } finally {
            set({ loadingBoard: false });
        }
    },

    createSwap: async (shiftId, reason) => {
        await swapsApi.createSwap(shiftId, reason);
    },

    publishSwap: async (id) => {
        await swapsApi.publishSwap(id);
        await get().fetchBoard();
    },

    rejectSwap: async (id) => {
        await swapsApi.rejectSwap(id);
        await get().fetchBoard();
    },

    applySwap: async (id) => {
        await swapsApi.applySwap(id);
        await get().fetchBoard();
    },

    approveApplicant: async (swapId, employeeCode) => {
        await swapsApi.approveApplicant(swapId, employeeCode);
        await get().fetchBoard();
    },

    rejectApplicant: async (swapId, employeeCode) => {
        await swapsApi.rejectApplicant(swapId, employeeCode);
        await get().fetchBoard();
    },

    fetchCompliance: async (swapId, employeeCode) => {
        const result = await swapsApi.getCompliance(swapId, employeeCode);
        set((state) => ({
            compliance: {
                ...state.compliance,
                [`${swapId}:${employeeCode}`]: result,
            },
        }));
        return result;
    },

    addToast: (message, type = "info") => {
        const id = `${Date.now()}-${Math.random()}`;
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 4000);
    },

    removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
}));
