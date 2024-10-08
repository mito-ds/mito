import { expect, test } from '@jupyterlab/galata';
import { createAndRunNotebookWithCells, updateCellValue, waitForIdle } from './utils';

const placeholderCellText = '# Empty code cell';

test.describe.configure({ mode: 'parallel' });

test.describe('Dataframe renders as mitosheet', () => {
  test('renders a mitosheet when hanging dataframe', async ({ page, tmpPath }) => {

    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})\ndf']);
    const cellOuput = await page.notebook.getCellOutput(0)
    await waitForIdle(page);
    expect(await cellOuput?.innerHTML()).toContain('Home');

    // The toolbar should be collapsed by default, so the Insert button should not be visible
    expect(await cellOuput?.innerHTML()).not.toContain('Insert');
  });

  test('Do not create a new code cell until code is generated', async ({ page, tmpPath }) => {
    await createAndRunNotebookWithCells(page, [
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

  test("Use empty code cell if it exists", async ({ page, tmpPath }) => {
    await createAndRunNotebookWithCells(page, [
        'import pandas as pd\ndf=pd.DataFrame({"A": ["Aaron", "Jake", "Shay"], "B": [4, 5, 6]})\ndf', '', placeholderCellText
    ]);

    // Edit the Mitosheet
    await updateCellValue(page, 'Aaron', '"Jon"')

    // Check that the second cell contains the placeholder text and therefore a new code cell was not inserted
    const secondCell = await page.locator('.jp-Cell-inputArea').nth(1);
    await secondCell.scrollIntoViewIfNeeded();
    expect(await secondCell.textContent()).toContain("from mitosheet.public");

    // Check that the third cell still contains the placeholder text
    const thirdCell = await page.locator('.jp-Cell-inputArea').nth(2);
    expect(await thirdCell.textContent()).toContain(placeholderCellText);
    
  })

  test("Rerunning hanging df creates new code cell", async ({ page, tmpPath }) => {
    await createAndRunNotebookWithCells(page, [
        'import pandas as pd\ndf=pd.DataFrame({"A": ["Aaron", "Jake", "Shay"], "B": [4, 5, 6]})\ndf',
    ]);

    // Edit the Mitosheet -> rerun df -> edit again
    await updateCellValue(page, 'Aaron', '"Jon"')
    await page.notebook.runCell(0);
    await updateCellValue(page, '4', '10')

    // Check that there are now two Mito generated code cells
    const secondCell = await page.locator('.jp-Cell-inputArea').nth(1);
    expect(await secondCell.textContent()).toContain("from mitosheet.public");

    // Check that the first cell still contains the original code
    const thirdCell = await page.locator('.jp-Cell-inputArea').nth(2);
    expect(await thirdCell.textContent()).toContain("from mitosheet.public");
  })
});
