import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * E2E (ENG-08): the production build served by `vite preview`, in headless Chromium with WebGL
 * rendered in software by SwiftShader (no GPU in CI). Specs live in `e2e/`; Vitest only picks up
 * `src/**\/*.test.ts`, so the two never cross.
 */
export default defineConfig({
  testDir: 'e2e',
  // SwiftShader renders on the CPU (~12 fps locally) and the game clock caps dt at 50 ms, so game
  // time runs slower than real time: the ~16 s closing takes ~26 s here, more on a CI runner.
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-swiftshader',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
      },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
