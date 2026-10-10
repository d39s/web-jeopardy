import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatIssues, validateQuestionPool, topicIndexSchema } from '@jeopardy/game-core';
import type { QuestionPool } from '@jeopardy/game-core';
import type { Pool } from 'pg';
import { transaction } from './database';
import { writePool } from './repository';

const defaultDirectory = fileURLToPath(new URL('../../../content/topics', import.meta.url));

export async function readPools(
  directory = process.env.CONTENT_DIR ?? defaultDirectory,
): Promise<QuestionPool[]> {
  const index = topicIndexSchema.parse(
    JSON.parse(await readFile(resolve(directory, 'index.json'), 'utf8')),
  );
  return Promise.all(
    index.categories.map(async (category) => {
      const result = validateQuestionPool(
        JSON.parse(await readFile(resolve(directory, category.file), 'utf8')),
      );
      if (!result.ok) throw new Error(formatIssues(result.issues).join('\n'));
      const pool = result.data;
      if (pool.id !== category.id || pool.title !== category.title) {
        throw new Error(`Index und Pool stimmen nicht überein: ${category.file}`);
      }
      return pool;
    }),
  );
}

/** Alle Pools atomar importieren; seed überspringt bereits initialisierte Datenbanken. */
export async function importContent(db: Pool, seedOnly = false, directory?: string): Promise<void> {
  await transaction(db, async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(391002)');
    if (seedOnly) {
      const marker = await client.query('SELECT name FROM content_imports WHERE name = $1', [
        'initial',
      ]);
      if (marker.rowCount !== 0) return;
      const existing = await client.query('SELECT id FROM topics LIMIT 1');
      if (existing.rowCount !== 0) {
        await client.query("INSERT INTO content_imports(name) VALUES ('initial')");
        return;
      }
    }
    const pools = await readPools(directory);
    for (const pool of pools) await writePool(client, pool);
    await client.query(
      "INSERT INTO content_imports(name) VALUES ('initial') ON CONFLICT DO NOTHING",
    );
  });
}
