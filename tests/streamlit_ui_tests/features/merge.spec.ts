import { expect, test } from '@playwright/test';
import { awaitResponse, clickButtonAndAwaitResponse, closeTaskpane, getColumnHeaderContainer, getMitoFrame, getMitoFrameWithTestCSV, hasExpectedNumberOfRows, importCSV } from '../utils';


test.describe('Merge', () => {

    test('Allows Editing', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await importCSV(page, mito, 'test.csv');
        
        await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
        await mito.getByText('Merge (horizontal)').click();
        await awaitResponse(page);
    
        await expect(mito.getByText('Merge Dataframes')).toBeVisible();
    
        // Check that Column1 exists
        const ch1 = await getColumnHeaderContainer(mito, 'Column1');
        await expect(ch1).toBeVisible();

        // Close the taskpane
        await closeTaskpane(mito);

        // Reopen the edit merge
        await mito.getByText('df_merge').click({button: 'right'});
        await mito.getByText('Edit Merge').click();

        // Add a merge key
        await mito.getByRole('button', { name: '+ Add Merge Keys' }).click();

        const newCh1 = await getColumnHeaderContainer(mito, 'Column1');
        await expect(newCh1).toBeVisible();
        const newCh2 = await getColumnHeaderContainer(mito, 'Column2');
        await expect(newCh2).toBeVisible();
        const Column3_test_1 = await getColumnHeaderContainer(mito, 'Column3_test_1');
        await expect(Column3_test_1).toBeVisible();
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
    
        // Check that Column1 exists
        const ch1 = await getColumnHeaderContainer(mito, 'Column1');
        await expect(ch1).toBeVisible();

        // Add a column
        await mito.locator('[id="mito-toolbar-button-add\\ column\\ to\\ the\\ right"]').getByRole('button', { name: 'Insert' }).click();
        await awaitResponse(page);

        // Check that the merge table has been updated -- there should be
        // 5 columns from merge + 1 added
        await expect(mito.locator('.endo-column-header-container')).toHaveCount(6);

        // Reopen the edit merge
        await mito.getByText('df_merge').click({button: 'right'});
        await mito.getByText('Edit Merge').click();

        // Add a merge key
        await mito.getByRole('button', { name: '+ Add Merge Keys' }).click();

        const newCh1 = await getColumnHeaderContainer(mito, 'Column1');
        await expect(newCh1).toBeVisible();
        const newCh2 = await getColumnHeaderContainer(mito, 'Column2');
        await expect(newCh2).toBeVisible();
        const Column3_test_1 = await getColumnHeaderContainer(mito, 'Column3_test_1');
        await expect(Column3_test_1).toBeVisible();

        // Check that there are 5 columns still
        await expect(mito.locator('.endo-column-header-container')).toHaveCount(5);
    });

    test('Change Merge Type', async ({ page }) => {
        const mito = await getMitoFrame(page);
        await importCSV(page, mito, 'merge.csv');
        await importCSV(page, mito, 'test.csv');
        
        await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
        await mito.getByText('Merge (horizontal)').click();
        await awaitResponse(page);
    
        await expect(mito.getByText('Merge Dataframes')).toBeVisible();

        // Wait for the merge to be finished before continuing so adding a column works!
        await expect(mito.getByText('df_merge')).toBeVisible();
    
        // Check that the correct number of rows are present
        await hasExpectedNumberOfRows(mito, 4);

        const changeMergeType = async (oldMergeType: string, newMergeType: string, expectedRows: number) => {
            // Change the merge type
            await mito.locator('.select-text', { hasText: oldMergeType }).click();
            await mito.locator('.mito-dropdown-item span').getByText(newMergeType, { exact: true }).click();
            await awaitResponse(page);

            // Check that the correct number of rows are present
            await hasExpectedNumberOfRows(mito, expectedRows);
        }

        await changeMergeType('lookup', 'left', 5);
        await changeMergeType('left', 'right', 5);
        await changeMergeType('right', 'inner', 4);
        await changeMergeType('inner', 'outer', 6);
        await changeMergeType('outer', 'unique in left', 1);
        await changeMergeType('unique in left', 'unique in right', 1);
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
        await mito.locator('.select-text', { hasText: 'types' }).click();
        await mito.locator('.mito-dropdown-item span').getByText('merge', { exact: true }).click();
        await awaitResponse(page);
        await hasExpectedNumberOfRows(mito, 5);

        // Test changing the merge keys
        await mito.locator('.select-text', { hasText: 'Column1' }).first().click();
        await mito.getByRole('button', { name: 'Column2' }).click();
        await awaitResponse(page);
        await mito.locator('.select-text', { hasText: 'Column1' }).first().click();
        await mito.getByRole('button', { name: 'Column2' }).click();
        await awaitResponse(page);
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
        await mito.locator('.multi-toggle-box-row', { hasText: 'Column2' }).locator('input[type="checkbox"]').first().click();
        await mito.locator('.multi-toggle-box-row', { hasText: 'Column3' }).locator('input[type="checkbox"]').first().click();

        await mito.locator('.multi-toggle-box-row', { hasText: 'Column2' }).locator('input[type="checkbox"]').nth(1).click();
        await mito.locator('.multi-toggle-box-row', { hasText: 'Column3' }).locator('input[type="checkbox"]').nth(1).click();
        await awaitResponse(page);
        await expect(mito.locator('.endo-column-header-container')).toHaveCount(1);

        // Re-check a couple of the columns to keep
        await mito.locator('.multi-toggle-box-row', { hasText: 'Column3' }).locator('input[type="checkbox"]').first().click();
        await mito.locator('.multi-toggle-box-row', { hasText: 'Column2' }).locator('input[type="checkbox"]').nth(1).click();
        await awaitResponse(page);
        await expect(mito.locator('.endo-column-header-container')).toHaveCount(3);
    });
});