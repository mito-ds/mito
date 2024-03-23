import { IJupyterLabPageFixture, expect, test } from '@jupyterlab/galata';
import { TURN_OFF_TOURS, clickToolbarButton, createNewNotebook, dfCreationCode, getNumberOfColumns, waitForCodeToBeWritten, waitForIdle } from './utils';
import { Page } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.describe('Mitosheet JupyterLab integration', () => {
  test('renders a mitosheet.sheet()', async ({ page, tmpPath }) => {
    await createNewNotebook(page, 'import mitosheet\nmitosheet.sheet()');
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('Insert');
  });

  test('Can run the generated code', async ({ page, tmpPath }) => {    
    // We skip this as it is flakey on Python 3.6... how to handle
    await createNewNotebook(page, `${dfCreationCode}import mitosheet\nmitosheet.sheet(df)`);

    await clickToolbarButton(page, 'Insert');

    await waitForCodeToBeWritten(page, 1);
    await page.notebook.selectCells(1);
    await page.notebook.runCell(1);

    await page.notebook.setCell(2, 'code', `mitosheet.sheet(df)`);
    await page.notebook.runCell(2);
    await getNumberOfColumns(page, 2).then((num) => expect(num).toBe(3));
  });


  test.skip('create an analysis to replay, and replays it', async ({ page, tmpPath }) => {

    await createNewNotebook(page, `${dfCreationCode}import mitosheet\nmitosheet.sheet(df)`);

    await clickToolbarButton(page, 'Insert');
    await waitForIdle(page);
    await getNumberOfColumns(page, 0).then((num) => expect(num).toBe(3));
    
    // This line fails because of a bug in the runCell function. Namely, when the mitosheet is selected
    // in cell 0's output, the selectCells function in the notebook.ts file will try and run, but for some
    // reason fail to select the first cell. This causes the runCell function to fail, and in turn the 
    // test to fail. We can work around this by running cell 1 and then going back to cell 0, but this
    // is a hack... so I'm pausing on these for now...
    await page.notebook.runCell(0);
    await getNumberOfColumns(page, 0).then((num) => expect(num).toBe(3));
  });

  const updateCellValue = async (page: IJupyterLabPageFixture, cellValue: string, newCellValue: string) => {
    await page.locator('.mito-grid-cell', { hasText: cellValue }).dblclick();
    await page.locator('input#cell-editor-input').fill(newCellValue);
    await page.keyboard.press('Enter');
    await waitForIdle(page);
  };

  const typeInNotebookCell = async (page: IJupyterLabPageFixture, cellIndex: number, cellValue: string) => {
    await page.locator('.jp-Cell-inputArea').nth(cellIndex).click();
    await page.keyboard.type(cellValue);
  }

  test('Doesn\'t overwrite user edited code', async ({ page, tmpPath }) => {
    // Create a new notebook with a dataframe and a mitosheet call
    await createNewNotebook(page, `${dfCreationCode}${TURN_OFF_TOURS}import mitosheet\nmitosheet.sheet(df)`);

    // Wait for Jupyter to finish rendering the notebook
    await waitForIdle(page);
    
    // Add an edit so that there is code in the cell below the mitosheet call
    await updateCellValue(page, '1', "'new cell value'");

    // Update the following cell with some code
    await typeInNotebookCell(page, 1, 'hello world');

    // Check that the modal appears to ask the user if they want to overwrite the code
    await updateCellValue(page, 'new cell value', "'another cell value'");
    await expect(page.getByText('Edit to Code Detected')).toBeVisible();

    // Click the "Overwrite Changes" button
    await page.click('text=Overwrite Edits');
    await expect(page.getByText('Edit to Code Detected')).not.toBeAttached();
    await expect(page.locator('.jp-Cell-inputArea').nth(1)).not.toHaveText('hello world');
    // The code from the mitosheet call should still be there
    // Don't check for the entire string because it contains a random id
    await expect(page.locator('.jp-Cell-inputArea').nth(1)).toContainText("df['a'] = 'another cell value'");

    // Update the following cell again with some code
    await typeInNotebookCell(page, 1, 'martha rocks');

    // Check that the modal appears to ask the user if they want to overwrite the code
    await updateCellValue(page, 'another cell value', "'a third cell value'");
    await expect(page.getByText('Edit to Code Detected')).toBeVisible();

    // Click the "Insert New Cell" button
    await page.getByText('Insert New Cell', { exact: true }).click();
    await expect(page.getByText('Edit to Code Detected')).not.toBeVisible();

    // Check that the cell below the mitosheet call has been updated and doesn't contain the edits
    await expect(page.locator('.jp-Cell-inputArea').nth(1)).not.toHaveText('martha rocks');
    await expect(page.locator('.jp-Cell-inputArea').nth(1)).not.toHaveText("df['a'] = 'a third cell value'");

    // Check that the edited code is now in the cell below the cell that was updated
    await expect(page.locator('.jp-Cell-inputArea').nth(2)).toContainText("df['a'] = 'another cell value'");
    await expect(page.locator('.jp-Cell-inputArea').nth(2)).toContainText('martha rocks');

    // Check that new user edits are generated correctly
    await updateCellValue(page, 'a third cell value', "'a fourth cell value'");
    await expect(page.getByText('Edit to Code Detected')).not.toBeVisible();
    // Check that the cell below the mitosheet call has been updated and doesn't contain the edits
    await expect(page.locator('.jp-Cell-inputArea').nth(1)).not.toHaveText('martha rocks');
    await expect(page.locator('.jp-Cell-inputArea').nth(1)).not.toHaveText("df['a'] = 'a fourth cell value'");

  });

  test('Automatically inserts new cell if user deletes mitosheet code', async ({ page, tmpPath }) => {
    // Create a new notebook with a dataframe and a mitosheet call
    await createNewNotebook(page, `${dfCreationCode}import mitosheet\nmitosheet.sheet(df)`);
    
    // Add an edit so that there is code in the cell below the mitosheet call
    await updateCellValue(page, '1', "'new cell value'");

    // Delete the mitosheet code
    await page.notebook.selectCells(1);
    await page.notebook.deleteCells();

    // Make another edit and check that the modal doesn't appear, and that the cell below the mitosheet call has been updated
    await updateCellValue(page, 'new cell value', "'another cell value'");
    await expect(page.getByText('Edit to Code Detected')).not.toBeVisible();
    await expect(page.locator('.jp-Cell-inputArea').nth(1)).toContainText("df['a'] = 'another cell value'");
  });
});