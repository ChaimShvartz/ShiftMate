import pg from "pg";
import { DATABASE_URL } from "../config.js";

const { Client } = pg;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS units (
    name TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    employee_code VARCHAR(6) PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    unit_name TEXT REFERENCES units(name) ON UPDATE CASCADE ON DELETE SET NULL,
    max_weekly_hours INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_user_role_attributes CHECK (
        (role = 'admin' AND unit_name IS NULL AND max_weekly_hours IS NULL) OR
        (role = 'manager' AND unit_name IS NOT NULL AND max_weekly_hours IS NULL) OR
        (role = 'employee' AND unit_name IS NOT NULL AND (max_weekly_hours IS NULL OR max_weekly_hours > 0))
    )
);

CREATE INDEX IF NOT EXISTS idx_users_unit_name ON users(unit_name);

-- Align existing rows if initialized previously
UPDATE users SET unit_name = NULL, max_weekly_hours = NULL WHERE role = 'admin';
UPDATE users SET max_weekly_hours = NULL WHERE role = 'manager';

-- Ensure constraint is present on existing tables
DO $$
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role_attributes;
    ALTER TABLE users ADD CONSTRAINT check_user_role_attributes CHECK (
        (role = 'admin' AND unit_name IS NULL AND max_weekly_hours IS NULL) OR
        (role = 'manager' AND unit_name IS NOT NULL AND max_weekly_hours IS NULL) OR
        (role = 'employee' AND unit_name IS NOT NULL AND (max_weekly_hours IS NULL OR max_weekly_hours > 0))
    );
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
`;

export async function initSupabaseSchema() {
    if (!DATABASE_URL) {
        console.warn(
            "[initSupabaseSchema] DATABASE_URL is not set. Skipping automatic schema initialization.",
        );
        return;
    }

    const isLocal =
        DATABASE_URL.includes("localhost") ||
        DATABASE_URL.includes("127.0.0.1");

    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: isLocal ? false : { rejectUnauthorized: false },
    });

    try {
        await client.connect();
        await client.query(SCHEMA_SQL);
        console.log("Connected to PostgreSQL and verified Supabase schema");
    } catch (err) {
        console.error("Failed to initialize Supabase schema:", err.message);
        throw err;
    } finally {
        await client.end().catch(() => {});
    }
}
