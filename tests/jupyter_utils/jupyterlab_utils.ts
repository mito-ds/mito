import { IJupyterLabPageFixture } from "@jupyterlab/galata";

export const runCell = async (page: IJupyterLabPageFixture, cellIndex: number) => {
    await page.notebook.runCell(cellIndex);
    await waitForIdle(page);
}

export const createAndRunNotebookWithCells = async (
    page: IJupyterLabPageFixture, 
    cellContents: string[],
    addNewLineToCell: boolean = false
) => {
    const randomFileName = `$test_file_${Math.random().toString(36).substring(2, 15)}.ipynb`;
    await page.notebook.createNew(randomFileName);

    // Wait for the kernel to be ready before setting cells
    await waitForIdle(page);

    for (let i = 0; i < cellContents.length; i++) {
        // Add a short delay to ensure that the cell is created and the decoration placeholder extension
        // has a chance to process
        await page.waitForTimeout(100);
        if (addNewLineToCell) {
            await page.notebook.setCell(i, 'code', '\n\n')
        }
        await page.notebook.setCell(i, 'code', cellContents[i]);
        await page.notebook.runCell(i);
    }
    await waitForIdle(page)
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

export const typeInNotebookCell = async (page: IJupyterLabPageFixture, cellIndex: number, cellValue: string, runAfterTyping?: boolean) => {
    await page.locator('.jp-Cell-inputArea').nth(cellIndex).scrollIntoViewIfNeeded();
    await page.notebook.enterCellEditingMode(cellIndex);
    await page.notebook.setCell(cellIndex, 'code', cellValue);
    if (runAfterTyping) {
        await page.notebook.runCell(cellIndex);
    }
}

export const getCodeFromCell = async (page: IJupyterLabPageFixture, cellIndex: number) => {
    const cellInput = await page.notebook.getCellInput(cellIndex);
    return await cellInput?.innerText();
}

export const selectCell = async (page: IJupyterLabPageFixture, cellIndex: number) => {
    const cell = await page.notebook.getCell(cellIndex);
    await cell?.click();
}

export const addNewCell = async (
    page: IJupyterLabPageFixture,
    cellType: 'code' | 'markdown' = 'code',
    cellValue: string = ''
) => {
    await page.notebook.addCell(cellType, cellValue);
}
