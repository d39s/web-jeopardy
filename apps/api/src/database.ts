import { readFile } from 'node:fs/promises';
import pg from 'pg';
import type { PoolClient } from 'pg';

export function createDatabase(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL muss gesetzt sein.');
  return new pg.Pool({ connectionString, max: 10, connectionTimeoutMillis: 5000 });
}

export async function transaction<T>(
  db: pg.Pool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function migrate(db: pg.Pool): Promise<void> {
  await transaction(db, async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(391001)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const migrations = ['001-question-library.sql', '002-difficulty-ratings.sql'];
    for (const [index, file] of migrations.entries()) {
      const version = index + 1;
      const applied = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version],
      );
      if (applied.rowCount === 0) {
        const sql = await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [version]);
      }
    }
  });
}
