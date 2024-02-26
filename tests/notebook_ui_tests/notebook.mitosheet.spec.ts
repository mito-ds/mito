import { IJupyterLabPageFixture, expect, test } from '@jupyterlab/galata';
import { awaitResponse } from '../streamlit_ui_tests/utils';
import path from 'path';

test.describe.configure({ mode: 'parallel' });
test.use({ appPath: '', autoGoto: false })

const NOTEBOOK = 'simple.ipynb';

test.describe('Mitosheet Jupyter Notebook integration', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `../notebooks/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
  });
  
  test('renders a mitosheet.sheet()', async ({ page, tmpPath }) => {
    void page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
    await expect(page.getByText('import mitosheet')).toBeVisible();
    await page.locator('.cell').first().click();
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('.mito-toolbar-button', { hasText: 'Insert' })).toBeVisible();
    expect(await page.locator('.endo-column-header-final-container').count()).toBe(3);
    await page.locator('.mito-toolbar-button', { hasText: 'Insert' }).click();
    await awaitResponse(page);
    expect(await page.locator('.endo-column-header-final-container').count()).toBe(4);
  });
});