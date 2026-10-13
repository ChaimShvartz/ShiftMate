import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

const KEY = "theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");

function read(): ThemeMode {
    try {
        const v = localStorage.getItem(KEY);
        if (v === "light" || v === "dark" || v === "system") return v;
    } catch {
        /* storage unavailable */
    }
    return "system";
}

export function applyTheme(mode: ThemeMode) {
    const resolved = mode === "system" ? (media.matches ? "dark" : "light") : mode;
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
}

interface ThemeState {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    mode: read(),
    setMode: (mode) => {
        try {
            localStorage.setItem(KEY, mode);
        } catch {
            /* ignore */
        }
        applyTheme(mode);
        set({ mode });
    },
}));

// Follow OS changes while in "system" mode.
media.addEventListener("change", () => {
    if (useThemeStore.getState().mode === "system") applyTheme("system");
});
