/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

exports = require('@jupyterlab/galata/lib/playwright-config');
import { devices } from '@playwright/test';


// extend the default configuration, specifically setting
// use: permissions: ["clipboard-read"]

module.exports = {
    ...exports,
    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: !!process.env.CI,
    // Set timeout to 90 seconds (90000 ms)
    timeout: 90000,
    projects: [
        /* Test against desktop browsers */
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        /* Test against branded browsers. */
        {
            name: 'Google Chrome',
            use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        },
        {
            name: 'Microsoft Edge',
            use: { ...devices['Desktop Edge'], channel: 'msedge' },
        },
    ],
};