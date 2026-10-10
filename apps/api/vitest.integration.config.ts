import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'postgres-integration',
    environment: 'node',
    include: ['apps/api/src/**/*.integration.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
