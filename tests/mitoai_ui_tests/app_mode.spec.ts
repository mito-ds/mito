/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { test, expect } from '../fixtures';
import { 
  createAndRunNotebookWithCells, 
  waitForIdle,
} from '../jupyter_utils/jupyterlab_utils';

test.describe('App Mode Button Integration Test', () => {
  test('Click App Mode button and verify Streamlit app is returned', async ({ page }) => {
    // Create a notebook with some simple code
    const notebookCode = 'import pandas as pd\ndf = pd.DataFrame({"x": [1, 2, 3]})\ndf'
    await createAndRunNotebookWithCells(page, [notebookCode]);
    await waitForIdle(page);

    // Click the App Mode button in the toolbar
    // The button has label "App Mode" and is in the cell toolbar
    const appModeButton = page.locator('.jp-ToolbarButtonComponent-label').filter({ hasText: 'App Mode' });
    await appModeButton.waitFor({ state: 'visible', timeout: 10000 });
    await appModeButton.click();
    
    // Wait for the Streamlit app preview to appear
    // The preview should open in a new tab with the app preview
    // We wait for either:
    // 1. A tab with "App Preview" or similar text
    // 2. An iframe widget that contains the streamlit app
    // 3. A placeholder widget that shows while the app is loading
    
    // First, wait for either the preview tab or the placeholder
    const previewTab = page.locator('.lm-TabBar-tabLabel').filter({ hasText: /App Preview|Streamlit/i });
    const placeholderWidget = page.locator('.placeholder-widget, .jp-iframe-widget');
    
    // Wait for either the tab or the widget to appear (with a reasonable timeout)
    await Promise.race([
      previewTab.waitFor({ state: 'visible', timeout: 30000 }).catch(() => null),
      placeholderWidget.waitFor({ state: 'visible', timeout: 30000 }).catch(() => null)
    ]);

    // Verify that we got a response - either a preview tab or an iframe widget
    const hasPreviewTab = await previewTab.count() > 0;
    const hasIframeWidget = await page.locator('.jp-iframe-widget iframe').count() > 0;
    const hasPlaceholder = await placeholderWidget.count() > 0;
    
    // At least one of these should be true if the app preview was successfully created
    expect(hasPreviewTab || hasIframeWidget || hasPlaceholder).toBeTruthy();
    
    // If we have an iframe, verify it has a src attribute (the streamlit app URL)
    if (hasIframeWidget) {
      const iframe = page.locator('.jp-iframe-widget iframe').first();
      const src = await iframe.getAttribute('src');
      expect(src).toBeTruthy();
      // The src should be a localhost URL for the streamlit app
      expect(src).toMatch(/http:\/\/localhost:\d+/);
    }
  });
});
