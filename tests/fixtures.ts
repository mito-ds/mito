/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Custom test fixtures for Mito tests.
 * 
 * This module provides a custom test fixture that overrides the default Galata
 * `waitForApplication` to skip the Simple mode check. We removed the Simple toggle
 * from our theme, so the default Galata check would timeout waiting for it.
 * 
 * Usage: Import `test` and `expect` from this file instead of '@jupyterlab/galata':
 * 
 *   import { test, expect } from '../fixtures';
 */

import { test as base, expect as baseExpect, IJupyterLabPage, galata } from '@jupyterlab/galata';
import { Page } from '@playwright/test';

/**
 * Custom test fixture that skips the Simple mode toggle check.
 * 
 * The default Galata waitForApplication checks for a Simple mode toggle switch,
 * but we've removed that from our theme. This custom fixture provides the same
 * functionality without that check.
 * 
 * We use direct DOM checks instead of Galata's helper functions because
 * those helpers internally call isInSimpleMode which looks for the Simple toggle.
 */
export const test = base.extend({
  waitForApplication: async ({ baseURL }, use) => {
    const waitIsReady = async (
      page: Page,
      helpers: IJupyterLabPage
    ): Promise<void> => {
      // Wait for the splash screen to disappear
      await page.locator('#jupyterlab-splash').waitFor({ state: 'detached' });
      
      // Wait for the Launcher tab to be visible and active using direct DOM check
      // We avoid using helpers.activity.isTabActive() because it internally
      // calls isInSimpleMode which looks for the Simple toggle we removed
      await page.locator('.jp-Launcher').waitFor({ state: 'visible' });
      
      // Click the Launcher tab to ensure it's properly focused
      const launcherTab = page.locator('.lm-TabBar-tab[data-id="launcher"]');
      if (await launcherTab.count() > 0) {
        await launcherTab.click();
      }
    };
    await use(waitIsReady);
  },
});

// Re-export expect and galata for convenience
export { baseExpect as expect, galata };

