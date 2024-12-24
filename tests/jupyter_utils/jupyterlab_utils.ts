import { expect, IJupyterLabPageFixture } from "@jupyterlab/galata";

export const runCell = async (page: IJupyterLabPageFixture, cellIndex: number) => {
    await page.notebook.runCell(cellIndex);
    await waitForIdle(page);
}

export const createAndRunNotebookWithCells = async (
    page: IJupyterLabPageFixture, 
    cellContents: string[],
) => {
    const randomFileName = `$test_file_${Math.random().toString(36).substring(2, 15)}.ipynb`;
    await page.notebook.createNew(randomFileName);

    // Wait for the kernel to be ready before setting cells
    await waitForIdle(page);

    for (let i = 0; i < cellContents.length; i++) {


        await page.notebook.addCell('code', cellContents[i]);
        await mitoSetCell(page, i, cellContents[i]);

        // await page.notebook.enterCellEditingMode(i);
        // // timeout for 100ms 
        // await page.waitForTimeout(100);

        // The setCell utility isn't working for some reason. The workaround was 
        // to add a \n in front of the cell contents, however, just typing the cell 
        // contents also works and doesn't require the \n which is an extra burden on 
        // expecting the cell contents. There is some discussion of a similar issue here: 
        // https://github.com/jupyterlab/jupyterlab/issues/15252
        // await page.keyboard.type(cellContents[i]);

        //Check if the cell now contains the cell contents
        // const cellInput = await page.notebook.getCellTextInput(i);

        // Sometimes the cell input doesn't get updated.
        // If that happens, try again.
        // if (cellInput !== cellContents[i]) {
        //     await page.notebook.enterCellEditingMode(i);
        //     await page.keyboard.type("\n\n");
        //     await page.keyboard.press('Backspace');
        //     await page.keyboard.press('Backspace');
        //     await page.keyboard.type(cellContents[i]);
        // }

        // await leaveCellEditingMode(cellIndex);
    }

    await page.notebook.runCellByCell();
    await waitForIdle(page)
}

export const mitoSetCell = async (
    page: IJupyterLabPageFixture,
    cellIndex: number,
    source: string
  ): Promise<boolean> => {

    const cell = await page.notebook.getCell(cellIndex);
    await cell?.dblclick();
    await page.notebook.enterCellEditingMode(cellIndex);

    await page.keyboard.press('Control+A');
    // give CodeMirror time to style properly

    // Type slower like a user would
    await page.keyboard.type(source, {delay: 200}) 

    await page.notebook.leaveCellEditingMode(cellIndex);

    // give CodeMirror time to style properly
    await page.waitForTimeout(500);

    return true;
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
