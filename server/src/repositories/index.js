import { TABLES } from "../models/schemas.js";
import { createSupabaseRepo } from "./supabase.repo.js";
import { createMongoRepo } from "./mongo.repo.js";
import { shiftWeeksCol, swapRequestsCol } from "../db/index.js";

export const unitsRepo = createSupabaseRepo(TABLES.UNITS);
export const usersRepo = createSupabaseRepo(TABLES.USERS);

export const shiftWeeksRepo = createMongoRepo(shiftWeeksCol);
export const swapRequestsRepo = createMongoRepo(swapRequestsCol);
