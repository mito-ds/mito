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
    // Open the notebook (see beforeAll hook)
    void page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);

    // Check that the page has loaded with the correct cell contents.
    await expect(page.getByText('import mitosheet')).toBeVisible();

    // Run the cell using shift+enter
    await page.locator('.cell').first().click();
    await page.keyboard.press('Shift+Enter');

    // Check that the mitosheet has been rendered
    await expect(page.locator('.mito-toolbar-button', { hasText: 'Insert' })).toBeVisible();

    // Check that clicking the Insert button adds a new column
    expect(await page.locator('.endo-column-header-final-container').count()).toBe(3);
    await page.locator('.mito-toolbar-button', { hasText: 'Insert' }).click();
    await awaitResponse(page);
    expect(await page.locator('.endo-column-header-final-container').count()).toBe(4);
  });
});