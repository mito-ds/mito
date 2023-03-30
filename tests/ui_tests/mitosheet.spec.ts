import { expect, IJupyterLabPageFixture, test } from '@jupyterlab/galata';

test.describe.configure({ mode: 'parallel' });

const dfCreationCode = `import pandas as pd
df = pd.DataFrame({'a': [1], 'b': [4]})\n`;

type ToolbarButton = 'Add Col'

const createNewNotebook = async (page: IJupyterLabPageFixture, firstCellCode?: string) => {
  const randomFileName = `$test_file_${Math.random().toString(36).substring(2, 15)}.ipynb`;
  await page.notebook.createNew(randomFileName);

  if (firstCellCode) {
    await page.notebook.setCell(0, 'code', firstCellCode);
    await page.notebook.runCell(0);
  }
}

const clickToolbarButton = async (page: IJupyterLabPageFixture, button: ToolbarButton) => {
  await page.click(`text=${button}`);
};

const getNumberOfColumns = async (page: IJupyterLabPageFixture, cellNumber: number) => {
  const cellOuput = await page.notebook.getCellOutput(cellNumber)
  const columns = await cellOuput?.$$('.column-header-container')
  return columns?.length || 0;
}

const waitForIdle = async (page: IJupyterLabPageFixture) => {
  const idleLocator = page.locator('#jp-main-statusbar >> text=Idle');
  await idleLocator.waitFor();
}

const waitForCodeToBeWritten = async (page: IJupyterLabPageFixture, cellIndex: number) => {
  await waitForIdle(page);
  const cellInput = await page.notebook.getCellInput(cellIndex);
  let cellCode = (await cellInput?.innerText())?.trim();
  // We wait until there's any code in the cell
  while (!/[a-zA-Z]/g.test(cellCode || '')) {
    // Wait 20 ms
    await page.waitForTimeout(20);
    await waitForIdle(page);
    const cellInput = await page.notebook.getCellInput(cellIndex);
    cellCode = (await cellInput?.innerText())?.trim();
  }
}

test.describe('Mitosheet Tests', () => {
  test('renders a mitosheet.sheet()', async ({ page, tmpPath }) => {
    await createNewNotebook(page, 'import mitosheet\nmitosheet.sheet()');
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('Add Col');
  });
  
  test('create an analysis to replay, and replays it', async ({ page, tmpPath }) => {
    await createNewNotebook(page, `${dfCreationCode}import mitosheet\nmitosheet.sheet(df)`);

    await clickToolbarButton(page, 'Add Col');
    await waitForIdle(page);
    await getNumberOfColumns(page, 0).then((num) => expect(num).toBe(3));
    
    await page.notebook.runCell(0);
    await getNumberOfColumns(page, 0).then((num) => expect(num).toBe(3));
  });

  test('Can run the generated code', async ({ page, tmpPath }) => {
    await createNewNotebook(page, `${dfCreationCode}import mitosheet\nmitosheet.sheet(df)`);

    await clickToolbarButton(page, 'Add Col');

    await waitForCodeToBeWritten(page, 1);
    await page.notebook.runCell(1);

    await page.notebook.setCell(2, 'code', `mitosheet.sheet(df)`);
    await page.notebook.runCell(2);
    await getNumberOfColumns(page, 2).then((num) => expect(num).toBe(3));
  });
});