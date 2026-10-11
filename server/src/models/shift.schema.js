import { z } from "zod";

export const shiftItemSchema = z.object({
    title: z.string().trim().default(""),
    assignedEmployeeCode: z
        .string()
        .regex(/^\d{6}$/, "Employee code must be a 6-digit number")
        .nullable(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    status: z
        .enum(["scheduled", "swap_pending"])
        .optional()
        .default("scheduled"),
});

export const updateShiftSchema = z.object({
    title: z.string().trim().optional(),
    assignedEmployeeCode: z
        .string()
        .regex(/^\d{6}$/, "Employee code must be a 6-digit number")
        .optional()
        .nullable(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
});

export const createShiftWeekSchema = z.object({
    unitName: z.string().trim().min(1, "Unit name is required"),
    weekNumber: z.number().int().positive(),
    weekStartDate: z.coerce.date(),
    shifts: z.array(shiftItemSchema),
});
