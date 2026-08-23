/**
 * Neon Serverless Database Client
 *
 * Uses @neondatabase/serverless to connect to Neon PostgreSQL
 * via HTTP-based connections (no TCP required).
 *
 * Connection string is read from the DATABASE_URL environment variable.
 */

import { neon } from "@neondatabase/serverless";

type SqlClient = ReturnType<typeof neon>;

/**
 * Get the Neon SQL query executor.
 *
 * This returns a tagged template literal function that can be used like:
 *   const result = await sql`SELECT * FROM meters`;
 *
 * @throws Error if DATABASE_URL is not configured
 */
function createSqlClient(): SqlClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Please configure it in your .env file or Vercel environment variables."
    );
  }

  return neon(connectionString) as SqlClient;
}

/**
 * Singleton SQL client — created once and reused.
 * Uses lazy initialization so the error only fires when the DB is actually accessed.
 */
let _sql: SqlClient | null = null;

export function getSql(): SqlClient {
  if (!_sql) {
    _sql = createSqlClient();
  }
  return _sql;
}
