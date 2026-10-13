import { z } from "zod";

// Everyone signs in with their 6-digit employee code and a password.
export const loginSchema = z.object({
    employeeCode: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "Employee code must be a 6-digit number"),
    password: z.string().min(1, "Password is required"),
});

export const createUserSchema = z
    .object({
        role: z.enum(["admin", "manager", "employee"]),
        fullName: z
            .string()
            .trim()
            .min(2, "Full name must be at least 2 characters"),
        phone: z.string().trim().min(6, "Phone must be at least 6 characters"),
        email: z.email("Invalid email format").toLowerCase(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        unitName: z.string().trim().min(1).optional().nullable(),
        maxWeeklyHours: z
            .number()
            .int()
            .positive("Max weekly hours must be positive")
            .max(100, "Max weekly hours cannot exceed 100")
            .optional()
            .nullable(),
    })
    .superRefine((data, ctx) => {
        if (data.role === "admin") {
            if (data.unitName) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Admin cannot be assigned to a unit",
                    path: ["unitName"],
                });
            }
            if (data.maxWeeklyHours) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Admin cannot have max weekly hours",
                    path: ["maxWeeklyHours"],
                });
            }
        }
        if (data.role === "manager") {
            if (!data.unitName) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Unit name is required for manager",
                    path: ["unitName"],
                });
            }
            if (data.maxWeeklyHours) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Manager cannot have max weekly hours",
                    path: ["maxWeeklyHours"],
                });
            }
        }
        if (data.role === "employee") {
            if (!data.unitName) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Unit name is required for employee",
                    path: ["unitName"],
                });
            }
        }
    });

export const updateUserSchema = z.object({
    fullName: z.string().trim().min(2).optional(),
    phone: z.string().trim().min(6).optional(),
    email: z.email("Invalid email format").toLowerCase().optional(),
    unitName: z.string().trim().min(1).optional(),
    maxWeeklyHours: z.number().int().positive().optional().nullable(),
    password: z.string().min(6).optional(),
});

export const updateMeSchema = z.object({
    fullName: z.string().trim().min(2).optional(),
    phone: z.string().trim().min(6).optional(),
    email: z.email("Invalid email format").toLowerCase().optional(),
    password: z.string().min(6).optional(),
});

export const initAdminSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, "Full name must be at least 2 characters"),
    phone: z.string().trim().min(6, "Phone must be at least 6 characters"),
    email: z.email("Invalid email format").toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
