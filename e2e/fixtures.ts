import { readFile } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { TopicIndex } from '@jeopardy/game-core';

/** UI-Tests verwenden die echten Seed-Daten, aber brauchen keinen PostgreSQL-Server. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const directory = new URL('../content/topics/', import.meta.url);
    const index = JSON.parse(
      await readFile(new URL('index.json', directory), 'utf8'),
    ) as TopicIndex;
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/v1/topics/index.json') {
        await route.fulfill({ json: index });
        return;
      }
      const category = index.categories.find((entry) => path === `/api/v1/pools/${entry.id}.json`);
      if (!category) {
        await route.fulfill({ status: 404, json: { error: 'Nicht gefunden' } });
        return;
      }
      await route.fulfill({
        contentType: 'application/json',
        body: await readFile(new URL(category.file, directory), 'utf8'),
      });
    });
    await use(page);
  },
});
export { expect };
