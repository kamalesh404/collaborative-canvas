import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

/**
 * Lazy database handle.
 *
 * The app must boot (and typecheck/build) even when DATABASE_URL is not set,
 * so we defer connecting until the first query. Callers should check
 * `isDbConfigured()` first and degrade gracefully when persistence is off.
 */
export function isDbConfigured(): boolean {
  return Boolean(connectionString);
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Persistence is disabled — set it in .env to enable saving boards.",
    );
  }
  if (!_db) {
    const client = postgres(connectionString);
    _db = drizzle(client, { schema });
  }
  return _db;
}

export type Db = ReturnType<typeof getDb>;
