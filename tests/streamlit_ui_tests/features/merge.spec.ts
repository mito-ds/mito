import { expect, test } from '@playwright/test';
import { awaitResponse, checkColumnCount, checkColumnExists, clickButtonAndAwaitResponse, closeTaskpane, getMitoFrameWithTestCSV, importCSV } from '../utils';




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
});