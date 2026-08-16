import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        // Jenkins liest den Bericht über junit ein; den Dateinamen gibt die
        // Pipeline über PLAYWRIGHT_JUNIT_OUTPUT_NAME vor.
        ['junit', { outputFile: process.env.PLAYWRIGHT_JUNIT_OUTPUT_NAME ?? 'reports/e2e.xml' }],
      ]
    : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    locale: 'de-DE',
  },
  projects: [
    {
      name: 'chromium',
      // Beamer-typische Auflösung: das Spielfeld muss ohne Scrollen passen.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: {
    // Das preview-Skript des Workspaces bindet den Port bereits.
    command: 'npm run build && npm run preview',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
