import { IJupyterLabPageFixture, expect, test } from '@jupyterlab/galata';
import path from 'path';

test.describe.configure({ mode: 'parallel' });
test.use({ appPath: '', autoGoto: false })

const createNewNotebook = async (page: IJupyterLabPageFixture, tmpPath: string, firstCellCode?: string) => {
    const randomFileName = `$test_file_${Math.random().toString(36).substring(2, 15)}.ipynb`;
    await page.locator('button', { hasText: 'New' }).click();
    await page.locator('li', { hasText: 'Python3' }).click();

    if (firstCellCode) {
        await page.notebook.setCell(0, 'code', firstCellCode);
        await page.notebook.runCell(0);
    }
}

const NOTEBOOK = 'simple.ipynb';

test.describe('Mitosheet Jupyter Notebook integration', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `../notebooks/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
  });
  
  test('renders a mitosheet.sheet()', async ({ page, tmpPath }) => {
    page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
    await expect(page.getByText('import mitosheet')).toBeVisible();
    await page.locator('.cell').first().click();
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('.mito-toolbar-button', { hasText: 'Insert' })).toBeVisible();
  });
});