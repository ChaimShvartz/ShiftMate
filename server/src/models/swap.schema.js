import { z } from "zod";

export const createSwapRequestSchema = z.object({
    shiftId: z.union([z.string(), z.number()]),
    reason: z.string().trim(),
});

export const approveApplicantSchema = z.object({
    applicantEmployeeCode: z
        .string()
        .regex(/^\d{6}$/, "Employee code must be a 6-digit number"),
});
