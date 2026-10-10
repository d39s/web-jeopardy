import { setTimeout } from 'node:timers/promises';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL muss gesetzt sein.');
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 2000,
});
const deadline = Date.now() + 60000;
try {
  while (true) {
    try {
      await db.query('SELECT 1');
      break;
    } catch (error) {
      if (Date.now() >= deadline) throw error;
      await setTimeout(1000);
    }
  }
} finally {
  await db.end();
}
