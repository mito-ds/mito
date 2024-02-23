import { expect, test } from '@jupyterlab/galata';
import { clickToolbarButton, createNewNotebook, dfCreationCode, getNumberOfColumns, waitForCodeToBeWritten, waitForIdle } from './utils';

test.describe.configure({ mode: 'parallel' });

test.describe('Mitosheet JupyterLab integration', () => {
  test('renders a mitosheet.sheet()', async ({ page, tmpPath }) => {
    await createNewNotebook(page, 'import mitosheet\nmitosheet.sheet()');
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('Insert');
  });

  test.skip('Can run the generated code', async ({ page, tmpPath }) => {    
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

  test.only('Doesn\'t overwrite user edited code', async ({ page, tmpPath }) => {
    // Create a new notebook with a dataframe and a mitosheet call
    await createNewNotebook(page, `${dfCreationCode}import mitosheet\nmitosheet.sheet(df)`);
    
    // Add an edit so that there is code in the cell below the mitosheet call
    await clickToolbarButton(page, 'Insert');
    await waitForIdle(page);
    
    // Check that the edit was successful
    await getNumberOfColumns(page, 0).then((num) => expect(num).toBe(3));

    // Update the following cell with some code
    await page.notebook.setCell(1, 'code', 'hello world');

    // Check that the modal appears to ask the user if they want to overwrite the code
    await clickToolbarButton(page, 'Insert');
    await expect(page.getByText('Insert New Cell?')).toBeVisible();

    // Click the "Overwrite Changes" button
    await page.click('text=Overwrite Edits');
    await expect(page.getByText('Insert New Cell?')).not.toBeAttached();
    await expect(page.locator('.jp-Cell-inputArea').nth(1)).not.toHaveText('hello world');
    // The code from the mitosheet call should still be there
    // Don't check for the entire string because it contains a random id
    await expect(page.locator('.jp-Cell-inputArea').nth(1)).toContainText('df.insert(1, ');


    // Update the following cell again with some code
    await page.notebook.setCell(1, 'code', 'martha rocks');

    // Check that the modal appears to ask the user if they want to overwrite the code
    await clickToolbarButton(page, 'Delete');
    await expect(page.getByText('Insert New Cell?')).toBeVisible();

    // Click the "Insert New Cell" button
    await page.getByText('Insert New Cell', { exact: true }).click();
    await expect(page.getByText('Insert New Cell?')).not.toBeAttached();
    await expect(page.locator('.jp-Cell-inputArea').nth(1)).not.toHaveText('martha rocks');
    await expect(page.locator('.jp-Cell-inputArea').nth(2)).toContainText('df.insert(1, ');
    await expect(page.locator('.jp-Cell-inputArea').nth(2)).toContainText('martha rocks');
  });
});