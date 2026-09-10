import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',

  outputDir: 'test-results',

  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',

  fullyParallel: false,

  forbidOnly: Boolean(process.env.CI),

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : 2,

  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'playwright-report',

        open: 'never',
      },
    ],
  ],

  expect: {
    timeout: 10_000,

    toHaveScreenshot: {
      animations: 'disabled',

      caret: 'hide',

      maxDiffPixelRatio: 0.01,
    },
  },

  use: {
    baseURL: 'http://127.0.0.1:4173',

    locale: 'pt-BR',

    timezoneId: 'America/Fortaleza',

    colorScheme: 'dark',

    trace: 'retain-on-failure',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-desktop',

      use: {
        ...devices['Desktop Chrome'],

        viewport: {
          width: 1440,
          height: 1000,
        },

        deviceScaleFactor: 1,
      },
    },

    {
      name: 'chromium-mobile',

      use: {
        ...devices['Desktop Chrome'],

        viewport: {
          width: 390,
          height: 844,
        },

        deviceScaleFactor: 1,

        isMobile: true,

        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: 'node scripts/playwright-server.mjs',

    url: 'http://127.0.0.1:4173',

    reuseExistingServer: false,

    timeout: 120_000,
  },
})
