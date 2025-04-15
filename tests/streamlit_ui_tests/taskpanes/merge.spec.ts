/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { FrameLocator, Page, expect, test } from '@playwright/test';
import { awaitResponse, checkColumnCount, checkColumnExists, clickButtonAndAwaitResponse, closeTaskpane, getColumnHeaderContainer, getMitoFrame, getMitoFrameWithTestCSV, hasExpectedNumberOfRows, importCSV } from '../utils';


const changeMergeType = async (mito: FrameLocator, page: Page, mergeType: string) => {
    // Change the merge type
    await mito.locator('.spacing-row', { hasText: 'Merge Type' }).locator('.select-text').click();
    await mito.locator('.mito-dropdown-item span').getByText(mergeType, { exact: true }).click();
    await awaitResponse(page);
}

const changeDataFrame = async (mito: FrameLocator, page: Page, dataframe: string, firstOrSecond: 'first' | 'second') => {
    await mito.locator('.spacing-col', { hasText: firstOrSecond === 'first' ? 'First DataFrame' : 'Second Dataframe' }).locator('.select-text').click();
    await mito.locator('.mito-dropdown-item span').getByText(dataframe, { exact: true }).click();
    await awaitResponse(page);
}

const changeMergeKeys = async (mito: FrameLocator, page: Page, newKey: string, firstOrSecond: 'first' | 'second') => {
    await mito.locator('.expandable-content-card', { hasText: 'Match rows where:' }).locator('.select-text').nth(firstOrSecond === 'first' ? 0 : 1).click();
    await mito.locator('.mito-dropdown-item span').getByText(newKey, { exact: true }).click();
    await awaitResponse(page);
}

const toggleColumnToKeepInMerge = async (mito: FrameLocator, page: Page, columnName: string, firstOrSecond: 'first' | 'second') => {
    await mito.locator('.multi-toggle-box-row', { hasText: columnName }).locator('input[type="checkbox"]').nth(firstOrSecond === 'first' ? 0 : 1).click();
    await awaitResponse(page);
}

test.describe('Merge', () => {
    test('Allows Editing', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await importCSV(page, mito, 'test.csv');
        
        await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
        await mito.getByText('Merge (horizontal)').click();
        await awaitResponse(page);
    
        await expect(mito.getByText('Merge Dataframes')).toBeVisible();
    
        await checkColumnExists(mito, 'Column1');

        // Close the taskpane
        await closeTaskpane(mito);

        // Reopen the edit merge
        await mito.getByText('df_merge').click({button: 'right'});
        await mito.getByText('Edit Merge').click();

        // Add a merge key
        await mito.getByRole('button', { name: '+ Add Merge Keys' }).click();

        await checkColumnExists(mito, ['Column1', 'Column2', 'Column3_test_1']);
    });


    test('Replays Dependent Edits', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await importCSV(page, mito, 'test.csv');
        
        await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
        await mito.getByText('Merge (horizontal)').click();
        await awaitResponse(page);
    
        await expect(mito.getByText('Merge Dataframes')).toBeVisible();

        // Wait for the merge to be finished before continuing so adding a column works!
        await expect(mito.getByText('df_merge')).toBeVisible();
    
        await checkColumnExists(mito, 'Column1');

        // Add a column
        await mito.locator('[id="mito-toolbar-button-add\\ column\\ to\\ the\\ right"]').getByRole('button', { name: 'Insert' }).click();
        await awaitResponse(page);

        // Check that the merge table has been updated -- there should be
        // 5 columns from merge + 1 added
        await checkColumnCount(mito, 6);

        // Reopen the edit merge
        await mito.getByText('df_merge').click({button: 'right'});
        await mito.getByText('Edit Merge').click();

        // Add a merge key
        await mito.getByRole('button', { name: '+ Add Merge Keys' }).click();

        // Check the new columns
        await checkColumnExists(mito, ['Column1', 'Column2', 'Column3_test_1']);
        await checkColumnCount(mito, 5);
    });

    test('Change Merge Type', async ({ page }) => {
        const mito = await getMitoFrame(page);
        await importCSV(page, mito, 'merge.csv');
        await importCSV(page, mito, 'test.csv');
        
        await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
        await mito.getByText('Merge (horizontal)').click();
        await awaitResponse(page);
    
        await expect(mito.getByText('Merge Dataframes')).toBeVisible();
        await awaitResponse(page);

        // Check that the correct number of rows are present
        await hasExpectedNumberOfRows(mito, 4);

        const changeMergeTypeAndCheckRows = async (mergeType: string, expectedRows: number) => {
            await changeMergeType(mito, page, mergeType);
            await hasExpectedNumberOfRows(mito, expectedRows);
        }

        await changeMergeTypeAndCheckRows('left', 5);
        await changeMergeTypeAndCheckRows('right', 5);
        await changeMergeTypeAndCheckRows('inner', 4);
        await changeMergeTypeAndCheckRows('outer', 6);
        await changeMergeTypeAndCheckRows('unique in left', 1);
        await changeMergeTypeAndCheckRows('unique in right', 1);
    });

    test('Error handling and changing merge keys / dataframes', async ({ page }) => {
        const mito = await getMitoFrame(page);
        await importCSV(page, mito, 'merge.csv');
        await importCSV(page, mito, 'test.csv');
        await importCSV(page, mito, 'types.csv');
        
        await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
        await mito.getByText('Merge (horizontal)').click();
        await awaitResponse(page);

        // Check that we throw an error because the default merge keys are different types
        await expect(mito.locator('.text-color-error')).toHaveText('Column1 (object) and Column1 (int64) have different types. Either pick new keys or cast their types.');

        // Test changing the dataframe
        await changeDataFrame(mito, page, 'merge', 'first');
        await hasExpectedNumberOfRows(mito, 5);

        // Test changing the merge keys
        await changeMergeKeys(mito, page, 'Column2', 'first');
        await changeMergeKeys(mito, page, 'Column2', 'second');

        await hasExpectedNumberOfRows(mito, 5);
        await expect(mito.locator('.endo-column-header-final-text', { hasText: 'Column2' })).toHaveCount(1);
    });

    test('Changing the columns to keep in merge', async ({ page }) => {
        const mito = await getMitoFrame(page);
        await importCSV(page, mito, 'merge.csv');
        await importCSV(page, mito, 'test.csv');
        
        await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
        await mito.getByText('Merge (horizontal)').click();
        await awaitResponse(page);

        // Check that the correct number of rows are present
        await hasExpectedNumberOfRows(mito, 4);

        // Uncheck all of the the columns to keep
        await toggleColumnToKeepInMerge(mito, page, 'Column2', 'first');
        await toggleColumnToKeepInMerge(mito, page, 'Column3', 'first');

        await toggleColumnToKeepInMerge(mito, page, 'Column2', 'second');
        await toggleColumnToKeepInMerge(mito, page, 'Column3', 'second');
        await expect(mito.locator('.endo-column-header-container')).toHaveCount(1);

        // Re-check a couple of the columns to keep
        await mito.locator('.multi-toggle-box-row', { hasText: 'Column3' }).locator('input[type="checkbox"]').first().click();
        await mito.locator('.multi-toggle-box-row', { hasText: 'Column2' }).locator('input[type="checkbox"]').nth(1).click();
        await awaitResponse(page);
        await expect(mito.locator('.endo-column-header-container')).toHaveCount(3);
    });

    test('Deleting a merge key then editing a merge', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await importCSV(page, mito, 'test.csv');
        
        await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
        await mito.getByText('Merge (horizontal)').click();
        await awaitResponse(page);
    
        await expect(mito.getByText('Merge Dataframes')).toBeVisible();

        await awaitResponse(page);
    
        // Check that Column1 exists
        const ch1 = await getColumnHeaderContainer(mito, 'Column1');
        await expect(ch1).toBeVisible();

        // Add a merge key
        await mito.getByRole('button', { name: '+ Add Merge Keys' }).click();

        await expect(await getColumnHeaderContainer(mito, 'Column1')).toBeVisible();
        await expect(await getColumnHeaderContainer(mito, 'Column2')).toBeVisible();
        await expect(await getColumnHeaderContainer(mito, 'Column3_test_1')).toBeVisible();

        // Check that there are 5 columns still
        await expect(mito.locator('.endo-column-header-container')).toHaveCount(5);

        // Delete a merge key
        await mito.locator('.tab-content').getByText('test', { exact: true }).click();
        await awaitResponse(page);
        
        await mito.locator('.endo-column-header-container', { hasText: 'Column2' }).click();
        await page.keyboard.press('Delete');
        await awaitResponse(page);

        await expect(await getColumnHeaderContainer(mito, 'Column2')).not.toBeVisible();
        await mito.locator('.tab-content').getByText('df_merge', { exact: true }).click({ button: 'right' });
        await mito.getByText('Edit Merge').click();
        await awaitResponse(page);

        // Check that the merge key pairing was removed and that there are warning messages for both
        // merge keys and columns
        await expect(mito.locator('.caution-text', { hasText: 'The merge key pairing (Column2, Column2) was removed because “Column2” no longer exists in “test”.'})).toBeVisible();
        await expect(mito.locator('.caution-text', { hasText: 'The column “Column2” was removed because it no longer exists in “test”.'})).toBeVisible();
        await expect(mito.locator('.select-text', { hasText: 'Column2' })).not.toBeVisible();
    });
});