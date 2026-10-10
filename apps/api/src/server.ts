import { buildApp } from './app';
import { createDatabase, migrate } from './database';
import { importContent } from './import';
import { postgresRepository } from './repository';
import { postgresReviewRepository } from './review-repository';

const db = createDatabase();
db.on('error', (error) => console.error('PostgreSQL-Verbindungsfehler', error));
const app = buildApp(postgresRepository(db), {
  logger: true,
  reviews: postgresReviewRepository(db),
  writeToken: process.env.CONTENT_WRITE_TOKEN,
  corsOrigins: process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
});
app.addHook('onClose', async () => db.end());
try {
  await migrate(db);
  if (process.env.SEED_CONTENT !== 'false') await importContent(db, true);
  await app.listen({
    host: process.env.HOST ?? '127.0.0.1',
    port: Number(process.env.PORT ?? 3001),
  });
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close();
  });
}
