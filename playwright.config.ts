import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

export default defineConfig({
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    timeout: 30_000,

    reporter: [
        ['list'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
    ],

    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        testIdAttribute: 'data-test',
    },

    projects: [
        {
            name: 'api',
            testDir: './tests/api',
            use: { baseURL: env.apiUrl },
        },
        {
            name: 'chromium',
            testDir: './tests/ui',
            use: { ...devices['Desktop Chrome'], baseURL: env.baseUrl },
        },
        {
            name: 'webkit',
            testDir: './tests/ui',
            use: { ...devices['Desktop Safari'], baseURL: env.baseUrl },
        },
    ],
});