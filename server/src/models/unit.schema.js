import { z } from "zod";

export const createUnitSchema = z.object({
    name: z.string().trim().min(1, "Unit name is required"),
});

export const updateUnitSchema = z.object({
    name: z.string().trim().min(1, "Unit name is required"),
});
