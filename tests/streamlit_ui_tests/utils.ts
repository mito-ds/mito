
import { expect, Page, FrameLocator, Locator } from '@playwright/test';
import { FormulaType } from './types';

export const getMitoFrame = async (page: Page): Promise<FrameLocator> => {
    await page.goto('http://localhost:8555/');
    const mito = page.frameLocator('iframe[title="mitosheet\\.streamlit\\.v1\\.spreadsheet\\.my_component"]');
    await expect(mito.locator('.mito-toolbar-button-container-enabled', { hasText: 'Import' })).toBeVisible();
    return mito;
};
  
export const importCSV = async (page: Page, mito: FrameLocator, filename: string): Promise<void> => {
    let tabCount = 0;
    try {
      // If there are 0 tabs, this will throw an error, as the locator
      // cannot find anything. As such, we leave tabCount as 0 in this
      // case.
      tabCount = (await mito.locator('.tab').all()).length;
    } catch (e) {
      // The .tab element doesn't exist -- so we don't need to do anything
      // as tabCount is already 0
    }
  
    await mito.getByRole('button', { name: '▾ Import' }).click();
    await mito.getByTitle('Import Files').getByText('Import Files').click();
    await mito.getByText(filename).dblclick();
  
    // Wait until the number of tabs has increased by 1
    await expect(mito.locator('.tab')).toHaveCount(tabCount + 1);
  
    await awaitResponse(page);
    await closeTaskpane(mito);
}
  
export const getMitoFrameWithTestCSV = async (page: Page): Promise<FrameLocator> => {
    const mito = await getMitoFrame(page);
    await importCSV(page, mito, 'test.csv');
    return mito;
}

export const checkColumnCellsHaveExpectedValues = async (mito: FrameLocator, columnIndex: number, values: any[]) => {
    const cells = await mito.locator(`.mito-grid-cell[mito-col-index="${columnIndex}"]`).all()
    await expect(mito.locator('.index-header-container')).toHaveCount(values.length);
    for (const cellIndex in values) {
        const cell = cells[cellIndex];
        if (cell === undefined) {
            continue;
        }
        await expect(cell).toHaveText(values[cellIndex]);
    }
}

export const fillInput = async (mito: FrameLocator, inputLabel: string, value: string): Promise<void> => {
    await mito.locator('.spacing-row', { hasText: inputLabel }).locator('input').fill(value);
}

export const updateSelectedValue = async (mito: FrameLocator, selectLabel: string, value: string): Promise<void> => {
    await mito.locator('.spacing-row', { hasText: selectLabel }).locator('.select-text').click();
    await mito.locator('.mito-dropdown-item', { hasText: value }).click();
}

export const hasExpectedNumberOfRows = async (mito: any, expectedRows: number) => {
    await expect(mito.locator('.index-header-container', { hasText: `${expectedRows - 1}` })).toBeVisible();
    await expect(mito.locator('.index-header-container', { hasText: `${expectedRows}` })).not.toBeVisible();
};
  
export const getMitoFrameWithTypeCSV = async (page: Page): Promise<FrameLocator> => {
    const mito = await getMitoFrame(page);
    await importCSV(page, mito, 'types.csv');
    return mito;
}
  
export const awaitResponse = async (page: Page): Promise<void> => {

    // Check if the message "Running" is visible, and wait if it isn't
    if ((await page.locator('text=Running').count()) === 0) {
        // Wait at least 25 ms for the message to send, as there is 
        // a 25ms delay in the message sending in streamlit. We actually
        // wait 500ms to be safe -- which is a bit of a cost, but 
        // the biggest slow down by far is flakey tests, so I would 
        // rather wait a little bit extra each awaitResponse to avoid a 
        // bunch of reruns due to flakey tests
        await page.waitForTimeout(500);
    }
    
    // Then, wait for Streamlit to finish processing the message
    await expect(page.getByText("Running")).toHaveCount(0);
}
  
export const clickButtonAndAwaitResponse = async (page: Page, mito: FrameLocator, nameOrOptions: string | any): Promise<void> => {
    const button = mito.getByRole('button', typeof nameOrOptions === 'string' ? { name: nameOrOptions} : nameOrOptions);
    // Scroll button into view
    await button.scrollIntoViewIfNeeded();
    // Click button
    await button.click();
    await awaitResponse(page);
}
  
export const checkOpenTaskpane = async (mito: FrameLocator, taskpaneName: string): Promise<void> => {
    // Check there is a class default-taskpane-header-div, that contains a nested div with text "taskpaneName"
    await expect(mito.locator('.default-taskpane-header-div').locator('div').filter({ hasText: new RegExp(taskpaneName) }).first()).toBeVisible();
}

export const closeTaskpane = async (mito: FrameLocator): Promise<void> => {
    // Close the taskpane, by clicking default-taskpane-header-exit-button-div
    await mito.locator('.default-taskpane-header-exit-button-div').click();
}

export const checkColumnExists = async (mito: FrameLocator, columnNamesOrName: string | string[]): Promise<void> => {
    let columnNames: string[] = [];
    if (Array.isArray(columnNamesOrName)) {
        columnNames = columnNamesOrName;
    } else {
        columnNames = [columnNamesOrName]
    }

    for (let i = 0; i < columnNames.length; i++) {
        const columnName = columnNames[i];
        const columnHeaderContainer = await getColumnHeaderContainer(mito, columnName);
        await expect(columnHeaderContainer).toBeVisible();
    }

}
  
export const getColumnHeaderContainer = async (mito: FrameLocator, columnName: string): Promise<Locator> => {
    return mito.locator('.endo-column-header-container').locator('div').filter({ hasText: columnName }).first();
}

export const getColumnHeaderContainerAtIndex = async (mito: FrameLocator, index: number): Promise<Locator> => {
    return mito.locator('.endo-column-header-container').nth(index);
}

export const checkColumnCount = async (mito: FrameLocator, count: number): Promise<void> => {
    await expect(mito.locator('.endo-column-header-container')).toHaveCount(count)
}

export const getColumnHeaderIndexFromColumnHeader = async (mito: FrameLocator, columnHeader: string): Promise<number> => {
    const columnHeaders = await mito.locator('.endo-column-header-final-text').all();

    let columnIndex = 0;

    // Find the columnHeader that we want to set the formula for
    for (let i = 0; i < columnHeaders.length; i++) {
        const currentColumnHeader = (await columnHeaders[i].textContent());
        if (currentColumnHeader === columnHeader) {
            columnIndex = i
        }
    }
    return columnIndex;
}

export const getCellAtRowIndexAndColumnName = async (mito: FrameLocator, rowIndex: number, columnHeader: string): Promise<Locator> => {
    const columnIndex = await getColumnHeaderIndexFromColumnHeader(mito, columnHeader);
    return getCellAtRowIndexAndColumnIndex(mito, rowIndex, columnIndex);
}

export const getCellAtRowIndexAndColumnIndex = async (mito: FrameLocator, rowIndex: number, columnIndex: number): Promise<Locator> => {
    const rowLocator = mito.locator('.mito-grid-row').nth(rowIndex);
    const cell = rowLocator.locator('.mito-grid-cell').nth(columnIndex);
    return cell
}

export const renameColumnAtIndex = async (page: Page, mito: FrameLocator, index: number, newName: string): Promise<void> => {
    const newColumnHeader = await getColumnHeaderContainerAtIndex(mito, index)
    await newColumnHeader.dblclick();
    await mito.getByRole('textbox').fill(newName);
    await page.keyboard.press('Enter');
    await awaitResponse(page);

    await expect(mito.locator('textbox')).not.toBeVisible();
    await expect(mito.locator('.endo-column-header-container', { hasText: newName })).toBeVisible();
}
  
export const clickTab = async (page: Page, mito: FrameLocator, tabName: string): Promise<void> => {
    // Button with .mito-toolbar-tabbar-tabname that has text tabName
    await mito.locator('.mito-toolbar-tabbar-tabname').filter({ hasText: tabName }).first().click();
}

export const toggleEditEntireColumn = async (mito: FrameLocator): Promise<void> => {
    await mito.locator('label div').click();
}

export const createNewColumn = async (
    page: Page,
    mito: FrameLocator,
    index: number,
    columnHeader: string,
): Promise<void> => {

    if (index === 0) {
        // If adding a column to index 0 then we use Insert Left
        const columnHeader = await getColumnHeaderContainerAtIndex(mito, index + 1)
        await columnHeader.click({ button: 'right' });
        await expect(mito.locator('.mito-dropdown')).toBeVisible();
        await clickButtonAndAwaitResponse(page, mito, 'Insert Column Left');
    } else {
        // If adding a column elsewhere then we use Insert Right
        const columnHeader = await getColumnHeaderContainerAtIndex(mito, index - 1)
        await columnHeader.click({ button: 'right' });
        await expect(mito.locator('.mito-dropdown')).toBeVisible();
        await clickButtonAndAwaitResponse(page, mito, 'Insert Column Right');
    }

    await renameColumnAtIndex(page, mito, index, columnHeader);
}
  
export const setFormulaUsingCellEditor = async (
    page: Page,
    mito: FrameLocator,
    columnHeader: string,
    formula: string,
    rowNumber = 0,
    formulaType: FormulaType =  'entire column'
): Promise<void> => {
    const cell = await getCellAtRowIndexAndColumnName(mito, rowNumber, columnHeader);
    await cell.dblclick();

    if (formulaType === 'individual cell') {
        await toggleEditEntireColumn(mito);
    }

    await mito.getByRole('textbox').fill(formula);
    await awaitResponse(page);
    await mito.locator('#cell-editor-input').press('Enter');
    await awaitResponse(page);
}

export const getValuesInColumn = async (mito: FrameLocator, columnHeader: string): Promise<string[]> => {

    // Get the number of '.mito-grid-row' elements that have a 'mito-grid-cell' inside of it
    // because we always display a full grid of rows even if the rows don't have any cells in them
    const rowLocators = (await mito.locator('.mito-grid-row').all())
    var numberOfRows = 0;
    for (var i = 0; i < rowLocators.length; i++) {
        const numberOfCells = (await rowLocators[i].locator('.mito-grid-cell').count())
        if (numberOfCells === 0) {
            break;
        } else {
            numberOfRows++;
        }
    }

    const columnHeaderIndex = await getColumnHeaderIndexFromColumnHeader(mito, columnHeader);
    const cellValues: string [] = [];
    for (let i = 0; i < numberOfRows; i++) {
        const cell = await getCellAtRowIndexAndColumnIndex(mito, i, columnHeaderIndex);
        const cellValue = await cell.innerText();
        // Trim the cell value to remove any leading/trailing whitespace
        cellValues.push(cellValue.trim());
    }

    return cellValues;
}