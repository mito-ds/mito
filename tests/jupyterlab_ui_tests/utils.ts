import { IJupyterLabPageFixture } from "@jupyterlab/galata";

export const dfCreationCode = `import pandas as pd
df = pd.DataFrame({'a': [1], 'b': [4]})\n`;

type ToolbarButton = 'Insert' | 'Delete'

export const createNewNotebook = async (page: IJupyterLabPageFixture, firstCellCode?: string) => {
  const randomFileName = `$test_file_${Math.random().toString(36).substring(2, 15)}.ipynb`;
  await page.notebook.createNew(randomFileName);

  if (firstCellCode) {
    await page.notebook.setCell(0, 'code', firstCellCode);
    await page.notebook.runCell(0);
  }
}

// If the test just interacts with the mitosheet, and not JupyterLab
export const createNewMitosheetOnlyTest = async (page: IJupyterLabPageFixture, firstCellCode: string) => {
    const randomFileName = `$test_file_${Math.random().toString(36).substring(2, 15)}.ipynb`;
    await page.notebook.createNew(randomFileName);
  
    if (firstCellCode) {
      await page.notebook.setCell(0, 'code', firstCellCode);
      await page.notebook.runCell(0);
    }

    await page.locator('.mito-container').click();
}

export const clickToolbarButton = async (page: IJupyterLabPageFixture, button: ToolbarButton) => {
  await page.locator('.mito-toolbar-bottom button', { hasText: button }).click();
};

export const getNumberOfColumns = async (page: IJupyterLabPageFixture, cellNumber: number) => {
  const cellOuput = await page.notebook.getCellOutput(cellNumber)
  const columns = await cellOuput?.$$('.endo-column-header-container')
  return columns?.length || 0;
}

export const waitForIdle = async (page: IJupyterLabPageFixture) => {
  const idleLocator = page.locator('#jp-main-statusbar >> text=Idle');
  await idleLocator.waitFor();
}

export const waitForCodeToBeWritten = async (page: IJupyterLabPageFixture, cellIndex: number) => {
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
