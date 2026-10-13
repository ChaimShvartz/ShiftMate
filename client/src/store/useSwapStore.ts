import { create } from "zustand";
import * as swapsApi from "../api/swaps";
import type { SwapRequest } from "../types";

// Employee-side board (published requests of the unit) + the mutations.
interface SwapState {
    board: SwapRequest[];
    loadingBoard: boolean;
    fetchBoard: () => Promise<void>;
}

export const useSwapStore = create<SwapState>((set) => ({
    board: [],
    loadingBoard: false,

    fetchBoard: async () => {
        set({ loadingBoard: true });
        try {
            set({ board: await swapsApi.getBoard() });
        } finally {
            set({ loadingBoard: false });
        }
    },
}));
