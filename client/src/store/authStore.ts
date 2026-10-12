import { create } from "zustand";
import * as authApi from "../api/auth";
import type { User } from "../types";

interface AuthState {
    token: string | null;
    user: User | null;

    login: (employeeCode: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem("token"),
    user: JSON.parse(localStorage.getItem("user") ?? "null"),

    login: async (employeeCode: string, password: string) => {
        const { token, user } = await authApi.login(employeeCode, password);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        set({ token, user });
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        set({ token: null, user: null });
    },

    updateUser: (partial: Partial<User>) => {
        set((state) => {
            if (!state.user) return state;
            const updated = { ...state.user, ...partial };
            localStorage.setItem("user", JSON.stringify(updated));
            return { user: updated };
        });
    },
}));
