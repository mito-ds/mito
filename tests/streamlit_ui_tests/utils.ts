
import { expect, Page, FrameLocator, Locator } from '@playwright/test';


export const getMitoFrame = async (page: Page): Promise<FrameLocator> => {
    await page.goto('http://localhost:8555/');
    return page.frameLocator('iframe[title="mitosheet\\.streamlit\\.v1\\.spreadsheet\\.my_component"]');
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
  
export const getMitoFrameWithTypeCSV = async (page: Page): Promise<FrameLocator> => {
    const mito = await getMitoFrame(page);
    await importCSV(page, mito, 'types.csv');
    return mito;
}
  
export const awaitResponse = async (page: Page): Promise<void> => {
    // Wait at least 25 ms for the message to send
    await page.waitForTimeout(100);
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
  
export const getColumnHeaderContainer = async (mito: FrameLocator, columnName: string): Promise<Locator> => {
    return mito.locator('.endo-column-header-container').locator('div').filter({ hasText: columnName }).first();
}

export const getColumnHeaderContainerAtIndex = async (mito: FrameLocator, index: number): Promise<Locator> => {
    return mito.locator('.endo-column-header-container').nth(index);
}

export const renameColumnByIndex = async (page: Page, mito: FrameLocator, index: number, newName: string): Promise<void> => {
    const newColumnHeader = await getColumnHeaderContainerAtIndex(mito, index)
    await newColumnHeader.dblclick();
    await mito.getByRole('textbox').fill(newName);
    await page.keyboard.press('Enter');

    await expect(mito.locator('textbox')).not.toBeVisible();
    await expect(mito.locator('.endo-column-header-container', { hasText: newName })).toBeVisible();
}
  
export const clickTab = async (page: Page, mito: FrameLocator, tabName: string): Promise<void> => {
    // Button with .mito-toolbar-tabbar-tabname that has text tabName
    await mito.locator('.mito-toolbar-tabbar-tabname').filter({ hasText: tabName }).first().click();
}

export const createNewColumn = async (
    page: Page,
    mito: FrameLocator,
    index: number,
    columnHeader: string
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

    await renameColumnByIndex(page, mito, index, columnHeader);
}
  