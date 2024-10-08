import { expect, test } from '@playwright/test';
import { clickButtonAndAwaitResponse, getMitoFrameWithTestCSV } from '../utils';

test.describe('Top of Toolbar', () => {
    test('Undo', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await expect(mito.getByText('Import Files')).not.toBeVisible();

        await mito.getByTitle(/Undo the most recent edit./).click();
        await expect(mito.getByText('Import Files')).toBeVisible();
    });

    test('Redo', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await expect(mito.getByText('Import Files')).not.toBeVisible();

        await mito.getByTitle(/Undo the most recent edit./).click();
        await expect(mito.getByText('Import Files')).toBeVisible();

        await mito.getByTitle(/Reapplies the last step that you undid, as long as you haven't made any edits since the undo./).click();
        await expect(mito.getByText('Import Files')).not.toBeVisible();
    });

    test('Clear', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);

        // Insert a new column
        await mito.locator('.mito-toolbar-button', { hasText: 'Insert' }).click();
        await expect(mito.locator('.endo-column-header-final-text', { hasText: /new-column/ })).toBeVisible();

        // Clear the analysis
        await mito.getByTitle('Removes all of the transformations you\'ve made to imported dataframes.').click();
        await expect(mito.getByText('Clear your current analysis?')).toBeVisible();
        await mito.getByText('Clear', { exact: true }).click();

        // Expect that the column does not exist
        await expect(mito.locator('.endo-column-header-final-text', { hasText: /new-column/ })).not.toBeVisible();
    });

    test('Steps', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);

        await mito.locator('.mito-toolbar-button', { hasText: 'Insert' }).click();
        await expect(mito.locator('.endo-column-header-final-text', { hasText: /new-column/ })).toBeVisible();

        await mito.getByTitle('View a list of all the edits you\'ve made to your data.').click();
        await expect(mito.getByText('Step History')).toBeVisible();
        await expect(mito.getByText('Imported', { exact: true })).toBeVisible();
        await expect(mito.getByText('Added column', { exact: true })).toBeVisible();

        // Click on a step and check that the column is removed
        await mito.getByText('Imported', { exact: true }).click();
        await expect(mito.locator('.endo-column-header-final-text', { hasText: /new-column/ })).not.toBeVisible();
        await expect(mito.getByText('You are viewing a previous step, and cannot make any edits.')).toBeVisible();

        // Check that you can catch up to the latest step
        await mito.getByText('Catch up').click();
        await expect(mito.locator('.endo-column-header-final-text', { hasText: /new-column/ })).toBeVisible();
    })

    test('Help button', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);

        const popupPromise = page.waitForEvent('popup');
        await mito.getByText('Help').click();
        const popup = await popupPromise;
        await expect(popup.url()).toBe('https://discord.com/invite/XdJSZyejJU');
    });

    test('Search button', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);

        await mito.locator('.mito-toolbar-top').getByTitle(/Search for a value in your data./).click();
        await expect(mito.getByPlaceholder('Find...')).toBeVisible();
    });
});