import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/game-core', 'apps/web', 'apps/api'],
    coverage: {
      provider: 'v8',
      include: ['packages/game-core/src/**/*.ts'],
      exclude: ['**/fixtures.ts', '**/index.ts', '**/types.ts'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
