import { FrameLocator, Page, expect, test } from '@playwright/test';
import { getMitoFrameWithTypeCSV, createNewColumn, clickButtonAndAwaitResponse } from '../utils';


test('Add new column to end using context menu', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTypeCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    // Check that the new column was added in correct position
    await expect(mito.locator('.endo-column-header-container').last().getByText(columnHeader)).toBeVisible();
});

test('Add new column to start using context menu', async ({ page }) => {
    const columnHeader = 'Column4'

    const mito = await getMitoFrameWithTypeCSV(page);
    await createNewColumn(page, mito, 0, columnHeader);

    // Check that the new column was added in correct position
    await expect(mito.locator('.endo-column-header-container').first().getByText(columnHeader)).toBeVisible();
});

test('Add multiple new columns using context menu', async ({ page }) => {
    const columnHeader4 = 'Column4'
    const columnHeader5 = 'Column5'

    const mito = await getMitoFrameWithTypeCSV(page);
    await createNewColumn(page, mito, 2, columnHeader4);

    await expect(mito.locator('.endo-column-header-container').nth(2).getByText(columnHeader4)).toBeVisible();

    await createNewColumn(page, mito, 2, columnHeader5);

    // Check that the new column was added in correct position
    await expect(mito.locator('.endo-column-header-container').nth(3).getByText(columnHeader4)).toBeVisible();
    await expect(mito.locator('.endo-column-header-container').nth(2).getByText(columnHeader5)).toBeVisible();
});



