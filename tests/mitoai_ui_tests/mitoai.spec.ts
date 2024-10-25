import { expect, test } from '@jupyterlab/galata';
import { createAndRunNotebookWithCells, getCodeFromCell, waitForIdle } from '../jupyter_utils/jupyterlab_utils';
import { updateCellValue } from '../jupyter_utils/mitosheet_utils';
const placeholderCellText = '# Empty code cell';

test.describe.configure({ mode: 'parallel' });

test.describe('Mito AI Chat', () => {

  test('Apply AI Generated Code', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);

    await page.getByRole('tab', { name: 'AI Chat for your JupyterLab' }).getByRole('img').click();
    expect (page.getByPlaceholder('Ask your personal Python')).toBeVisible();

    await page.getByPlaceholder('Ask your personal Python').fill('Write the code df["C"] = [7, 8, 9]');
    await page.keyboard.press('Enter');
    await waitForIdle(page);

    await page.getByRole('button', { name: 'Apply' }).click();
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 1);
    expect(code).toContain('df["C"] = [7, 8, 9]');
  });

  test('Reject AI Generated Code', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);

    await page.getByRole('tab', { name: 'AI Chat for your JupyterLab' }).getByRole('img').click();
    expect (page.getByPlaceholder('Ask your personal Python')).toBeVisible();

    await page.getByPlaceholder('Ask your personal Python').fill('Write the code df["C"] = [7, 8, 9]');
    await page.keyboard.press('Enter');
    await waitForIdle(page);

    await page.getByRole('button', { name: 'Deny' }).click();
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 1);
    expect(code).not.toContain('df["C"] = [7, 8, 9]');
    expect(code?.trim()).toBe("")
  });
});

