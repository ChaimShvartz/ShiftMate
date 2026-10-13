import { z } from "zod";

export const createSwapRequestSchema = z.object({
    shiftId: z.union([z.string(), z.number()]),
    weekNumber: z.union([z.string(), z.number()]).optional(),
    reason: z.string().trim().min(1, "Reason is required").max(300),
});
