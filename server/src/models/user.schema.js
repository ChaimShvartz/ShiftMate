import { z } from "zod";

export const ROLE_VALUES = ["admin", "manager", "employee"];

export const loginSchema = z.object({
    employeeCode: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "Employee code must be a 6-digit number"),
    password: z.string().min(6, "Password is required"),
});

export const createUserSchema = z.object({
    role: z.enum(["admin", "manager", "employee"]),
    fullName: z
        .string()
        .trim()
        .min(2, "Full name must be at least 2 characters"),
    phone: z.string().trim().min(6, "Phone must be at least 6 characters"),
    email: z.email("Invalid email format").toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    unitName: z.string().trim().min(1).optional(),
    maxWeeklyHours: z
        .number()
        .int()
        .positive()
        .optional()
});

export const updateUserSchema = z.object({
    fullName: z.string().trim().min(2).optional(),
    phone: z.string().trim().min(6).optional(),
    email: z.email("Invalid email format").optional(),
    unitName: z.string().trim().min(1).optional(),
    maxWeeklyHours: z.number().int().positive().optional().nullable(),
    password: z.string().min(6).optional(),
});

export const updateMeSchema = z.object({
    fullName: z.string().trim().min(2).optional(),
    phone: z.string().trim().min(6).optional(),
    email: z.email("Invalid email format").optional(),
    password: z.string().min(6).optional(),
});

export const initAdminSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, "Full name must be at least 2 characters"),
    phone: z.string().trim().min(6, "Phone must be at least 6 characters"),
    email: z.email("Invalid email format"),
    unitName: z.string().trim().min(1, "Unit name is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
