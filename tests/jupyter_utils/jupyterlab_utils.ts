import { IJupyterLabPageFixture } from "@jupyterlab/galata";

export const runCell = async (page: IJupyterLabPageFixture, cellIndex: number) => {
    await page.notebook.runCell(cellIndex);
    await waitForIdle(page);
}

export const createAndRunNotebookWithCells = async (page: IJupyterLabPageFixture, cellContents: string[]) => {
    const randomFileName = `$test_file_${Math.random().toString(36).substring(2, 15)}.ipynb`;
    await page.notebook.createNew(randomFileName);

    // Wait for the kernel to be ready before setting cells
    await waitForIdle(page);

    for (let i = 0; i < cellContents.length; i++) {
        // Add a short delay to ensure that the cell is created and the decoration placeholder extension
        // has a chance to process
        await page.waitForTimeout(100);

        await page.notebook.enterCellEditingMode(i);

        // Give the cell a chance to enter editing mode and be ready for typing. 
        // This is a crucial step that prevents the typing from not registering!
        await page.waitForTimeout(500);

        // Even after waiting, sometimes the cell is not ready for typing, but
        // it does accept the Enter 
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');

        await page.keyboard.type(cellContents[i], {delay: 50});
        await page.notebook.leaveCellEditingMode(i);
        await page.notebook.runCell(i);
        await waitForIdle(page)
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

export const typeInNotebookCell = async (
    page: IJupyterLabPageFixture, 
    cellIndex: number, 
    cellValue: string, 
    runAfterTyping?: boolean,
    clearCellBeforeTyping: boolean = true
) => {
    // First ensure the cell is visible
    await page.locator('.jp-Cell-inputArea').nth(cellIndex).scrollIntoViewIfNeeded();
    
    // Wait for the cell to be actually visible in viewport
    await page.locator('.jp-Cell-inputArea').nth(cellIndex).waitFor({state: 'visible'});
    
    // Enter editing mode and wait for it to be ready
    await page.notebook.enterCellEditingMode(cellIndex);
    await page.waitForTimeout(500); // Give it time to fully enter edit mode
    
    // Try using keyboard input instead of setCell
    const cell = await page.notebook.getCellInput(cellIndex);
    await cell?.click();
    if (clearCellBeforeTyping) {
        await page.keyboard.press('Control+A'); // Select all existing content
        await page.keyboard.press('Delete');    // Clear it
    }
    await page.keyboard.type(cellValue, {delay: 50}); // Type with a small delay
    
    if (runAfterTyping) {
        await page.notebook.runCell(cellIndex);
    }
}

export const getCodeFromCell = async (page: IJupyterLabPageFixture, cellIndex: number): Promise<string> => {
    const cellInput = await page.notebook.getCellInput(cellIndex);
    if (cellInput === null) {
        return ''
    }

    const cellText = await cellInput.innerText();
    return cellText
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
