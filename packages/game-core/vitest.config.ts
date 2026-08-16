import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'game-core',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
