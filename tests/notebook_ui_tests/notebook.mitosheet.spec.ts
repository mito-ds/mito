import { expect, test } from '@playwright/test';
import { awaitResponse } from '../streamlit_ui_tests/utils';

test.describe('Mitosheet Jupyter Notebook integration', () => {
  test('renders a mitosheet.sheet() and generates code', async ({ page }) => {
    await page.goto('http://localhost:8888/notebooks/');
    await page.locator('button', { hasText: 'New' }).click();
    const popupPromise = page.waitForEvent('popup');
    await page.locator('li', { hasText: 'Python' }).click();
    const popup = await popupPromise;
    await popup.locator('pre').pressSequentially(`
import pandas as pd
df = pd.DataFrame({ 'a': [1, 2, 3], 'b': [4, 5, 6], 'c': [7, 8, 9] })
import mitosheet
mitosheet.sheet(df)`)
    await popup.locator('.CodeMirror-code').press('Shift+Enter');
    // Check that clicking the Insert button adds a new column
    await expect(popup.locator('.endo-column-header-final-container')).toHaveCount(3);
    await popup.locator('.mito-toolbar-button', { hasText: 'Insert' }).click();
    await expect(popup.locator('.endo-column-header-final-container')).toHaveCount(4);

    // Check that the code generated by the mitosheet is correct
    await expect(popup.locator('.CodeMirror-code').nth(1)).toContainText(/from mitosheet.public.v3 import \*; # Analysis Name:/);
    await expect(popup.locator('.CodeMirror-code').nth(1)).toContainText(/# Added column new-column-/);
  });
});