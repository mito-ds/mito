import { FrameLocator, Page, expect, test } from '@playwright/test';
import { getMitoFrameWithTypeCSV, createNewColumn, clickButtonAndAwaitResponse } from './utils';


test('Add new column to end using context menu', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await createNewColumn(page, mito, 3, 'Column4');
});

test('Add new column to start using context menu', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await createNewColumn(page, mito, 0, 'Column4');
});

test('Add multiple new columns using context menu', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await createNewColumn(page, mito, 2, 'Column4');
    await createNewColumn(page, mito, 2, 'Column5');
});



