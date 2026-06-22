import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const FRONTEND_PORT = 4200;
const BACKEND_PORT = 3001;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

/**
 * Конфигурация Playwright: поднимает реальный бэкенд (Go) и фронтенд (Angular)
 * и прогоняет пользовательские сценарии в браузере.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      // Go-бэкенд (in-memory). Каждый прогон стартует с чистым состоянием.
      command: 'go run ./cmd/server',
      cwd: resolve(repoRoot, 'backend'),
      env: { PORT: String(BACKEND_PORT) },
      url: `http://localhost:${BACKEND_PORT}/public/event-types`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      // Angular dev-server с проксированием /api -> бэкенд.
      command: `npm start -- --port ${FRONTEND_PORT}`,
      cwd: resolve(repoRoot, 'frontend'),
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
