import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Lazy database connection - only created when first accessed
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const dbUrl = process.env.DATABASE_URL?.trim();
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const client = postgres(dbUrl, { prepare: false });
    _db = drizzle(client, { schema });
  }
  return _db;
}

// For backward compatibility - but this will throw if called before env vars are set
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  }
});
