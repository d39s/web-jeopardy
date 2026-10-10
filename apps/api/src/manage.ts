import { createDatabase, migrate } from './database';
import { importContent } from './import';

const command = process.argv[2];
if (!['migrate', 'import', 'seed'].includes(command ?? '')) {
  throw new Error('Erwartet: migrate, import oder seed.');
}
const db = createDatabase();
try {
  await migrate(db);
  if (command !== 'migrate') await importContent(db, command === 'seed');
} finally {
  await db.end();
}
