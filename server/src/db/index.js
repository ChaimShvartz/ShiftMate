import { createClient } from "@supabase/supabase-js";
import { MongoClient } from "mongodb";
import { DB_NAME, MONGO_URI, SUPABASE_KEY, SUPABASE_URL } from "../config.js";
import { COLLECTIONS } from "../models/schemas.js";

let db = null;

export async function connectDB() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);

    console.log("Connected to MongoDB");
}

export const shiftWeeksCol = () => db.collection(COLLECTIONS.SHIFT_WEEKS);
export const swapRequestsCol = () => db.collection(COLLECTIONS.SWAP_REQUESTS);

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
