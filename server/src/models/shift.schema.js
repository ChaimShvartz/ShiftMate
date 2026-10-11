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

export const shiftImportRowSchema = (codes) =>
    z
        .object({
            employee: z
                .string()
                .regex(/\d{6}\s*$/, "Employee is missing or invalid")
                .transform((v) => /(\d{6})\s*$/.exec(v)[1])
                .refine((code) => codes.has(code), {
                    error: (issue) =>
                        `Employee ${issue.input} does not exist in this unit`,
                }),
            date: z.iso.date(
                "Date is missing or invalid (expected yyyy-mm-dd)",
            ),
            start: z.iso.time({
                precision: -1,
                error: "Start time is missing or invalid (expected HH:mm)",
            }),
            end: z.iso.time({
                precision: -1,
                error: "End time is missing or invalid (expected HH:mm)",
            }),
            title: z.string().default(""),
        })
        .refine((r) => r.end > r.start, {
            path: ["end"],
            message: "End time must be after start time",
            when: (payload) => payload.issues.length === 0,
        });
