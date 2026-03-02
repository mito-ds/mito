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
    // and that the Streamlit app has actually loaded inside the iframe
    if (hasIframeWidget) {
      const iframe = page.locator('.jp-iframe-widget iframe').first();
      const src = await iframe.getAttribute('src');
      expect(src).toBeTruthy();
      // The src should be a localhost URL for the streamlit app
      expect(src).toMatch(/http:\/\/localhost:\d+/);
      
      // Verify that the Streamlit app has actually loaded by checking for Streamlit-specific elements
      // The app always includes .stMainBlockContainer (from streamlit_system_prompt.py)
      // We can also check for other Streamlit elements like [data-testid="stApp"]
      // Use frameLocator to access content inside the iframe
      const streamlitFrame = page.frameLocator('.jp-iframe-widget iframe');
      
      // Wait for Streamlit app to load - check for the main container that's always present
      // This proves the Streamlit app has rendered, not just that the iframe exists
      const streamlitMainContainer = streamlitFrame.locator('.stMainBlockContainer');
      await streamlitMainContainer.waitFor({ state: 'visible', timeout: 60000 });
      expect(await streamlitMainContainer.count()).toBeGreaterThan(0);
      
      // Also verify we can find the Streamlit app root element
      const streamlitApp = streamlitFrame.locator('[data-testid="stApp"]');
      expect(await streamlitApp.count()).toBeGreaterThan(0);
    }
  });

  test('Open mito-app-*.py in file editor, click App Mode in toolbar, verify preview appears', async ({ page }) => {
    // 1) Create and run a notebook so we get a notebook with an id when App Mode is used
    const notebookCode = 'import pandas as pd\ndf = pd.DataFrame({"x": [1, 2, 3]})\ndf';
    await createAndRunNotebookWithCells(page, [notebookCode]);
    await waitForIdle(page);

    // 2) Click App Mode in the notebook toolbar to create the .py file and open preview
    const appModeButtonInNotebook = page.locator('.jp-ToolbarButtonComponent-label').filter({ hasText: 'App Mode' });
    await appModeButtonInNotebook.waitFor({ state: 'visible', timeout: 10000 });
    await appModeButtonInNotebook.click();

    // Wait for preview to appear and the .py file to be created
    await page.locator('.lm-TabBar-tabLabel').filter({ hasText: /App Preview|Streamlit/i }).waitFor({ state: 'visible', timeout: 30000 }).catch(() => null);
    await waitForIdle(page);

    // 3) Open the File Browser and find the mito-app-*.py file
    await page.getByRole('tab', { name: /File Browser/ }).click();
    await waitForIdle(page);

    const pyFileInBrowser = page.getByLabel('File Browser Section').getByText(/mito-app-.+\.py/);
    await pyFileInBrowser.waitFor({ state: 'visible', timeout: 10000 });

    // 4) Double-click to open the .py file in the file editor
    await pyFileInBrowser.dblclick();
    await waitForIdle(page);

    // 5) The file editor tab should be active; click App Mode in its toolbar
    const appModeInEditor = page.locator('.jp-ToolbarButtonComponent-label').filter({ hasText: 'App Mode' });
    await appModeInEditor.waitFor({ state: 'visible', timeout: 10000 });
    await appModeInEditor.click();

    // 6) Verify the preview appears (tab or iframe)
    const previewTab = page.locator('.lm-TabBar-tabLabel').filter({ hasText: /App Preview|Streamlit/i });
    const placeholderWidget = page.locator('.placeholder-widget, .jp-iframe-widget');
    await Promise.race([
      previewTab.waitFor({ state: 'visible', timeout: 30000 }).catch(() => null),
      placeholderWidget.waitFor({ state: 'visible', timeout: 30000 }).catch(() => null)
    ]);

    const hasPreviewTab = await previewTab.count() > 0;
    const hasIframeWidget = await page.locator('.jp-iframe-widget iframe').count() > 0;
    const hasPlaceholder = await placeholderWidget.count() > 0;
    expect(hasPreviewTab || hasIframeWidget || hasPlaceholder).toBeTruthy();
  });
});
