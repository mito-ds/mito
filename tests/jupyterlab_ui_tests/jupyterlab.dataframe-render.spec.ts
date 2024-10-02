import { IJupyterLabPageFixture, expect, test } from '@jupyterlab/galata';
import { Page } from '@playwright/test';
import { createNewNotebookWithCellContents, updateCellValue, waitForIdle } from './utils';
import { createNewColumn } from '../streamlit_ui_tests/utils';

test.describe.configure({ mode: 'parallel' });

test.describe('Dataframe renders as mitosheet', () => {
  test('renders a mitosheet when hanging dataframe', async ({ page, tmpPath }) => {

    await createNewNotebookWithCellContents(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})\ndf']);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('Insert');
  });

  test('Do not create a new code cell until code is generated', async ({ page, tmpPath }) => {
    const placeholderCellText = '# Empty code cell';
    await createNewNotebookWithCellContents(page, [
        'import pandas as pd\ndf=pd.DataFrame({"A": ["Aaron", "Jake", "Shay"], "B": [4, 5, 6]})\ndf', 
        placeholderCellText
    ]);

    // Check that the second cell contains the placeholder text and therefore a new code cell was not inserted
    const secondCell = await page.locator('.jp-Cell-inputArea').nth(1);
    expect(await secondCell.textContent()).toContain(placeholderCellText);

    // Edit the Mitosheet
    await updateCellValue(page, 'Aaron', '"Jon"')

    // Check that the second cell now contains code
    const newSecondCell = await page.locator('.jp-Cell-inputArea').nth(1);
    expect(await newSecondCell.textContent()).toContain("from mitosheet.public");
    
    // Check that the third cell now contains placeholder text
    const thirdCell = await page.locator('.jp-Cell-inputArea').nth(2);
    expect(await thirdCell.textContent()).toContain(placeholderCellText);

  });
});
