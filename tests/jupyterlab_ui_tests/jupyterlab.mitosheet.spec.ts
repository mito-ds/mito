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
});