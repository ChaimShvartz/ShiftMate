import {
    notificationsCol,
    shiftWeeksCol,
    swapRequestsCol,
} from "../db/index.js";
import { TABLES } from "../models/schemas.js";
import { createMongoRepo } from "./mongo.repo.js";
import { createSupabaseRepo } from "./supabase.repo.js";

export const unitsRepo = createSupabaseRepo(TABLES.UNITS);
export const usersRepo = createSupabaseRepo(TABLES.USERS);

export const shiftWeeksRepo = createMongoRepo(shiftWeeksCol);
export const swapRequestsRepo = createMongoRepo(swapRequestsCol);
export const notificationsRepo = createMongoRepo(notificationsCol);
