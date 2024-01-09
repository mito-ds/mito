import { expect, test } from '@playwright/test';
import { awaitResponse, checkOpenTaskpane, clickButtonAndAwaitResponse, closeTaskpane, getColumnHeaderContainer, getMitoFrameWithTestCSV, importCSV } from '../utils';


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
        await expect(mito.locator('.endo-column-header-container')).toHaveCount(4);
    });
});