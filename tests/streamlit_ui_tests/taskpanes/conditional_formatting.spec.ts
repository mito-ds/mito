import { expect, test } from '@playwright/test';
import { awaitResponse, getMitoFrameWithTestCSV } from '../utils';

test.describe('Conditional Formatting', () => {
    test('Leave conditional format color and backgroud_color unset', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await mito.getByRole('button', { name: 'Conditional Formatting', exact: true }).click();
        awaitResponse(page)
        await mito.getByRole('button', { name: 'Add Conditional Formatting Rule', exact: true }).click();
        awaitResponse(page)
        await mito.getByText('Is not empty').click();
        awaitResponse(page)
        await mito.getByText('Toggle All').click();
        awaitResponse(page)

        // Click on the Export
        await mito.locator('.mito-toolbar-button', { hasText: 'Export'}).click();
        await mito.locator('.mito-dropdown-item', { hasText: 'Download File when Executing Code'}).click();
        await awaitResponse(page);
        awaitResponse(page)
        await mito.getByText('CSV').click();
        awaitResponse(page)
        await mito.getByText('Excel').click();
        awaitResponse(page)

        await mito.getByText('Generate Export Code').click();
        awaitResponse(page)

        // Make sure the code doesn't have mito css variables in it
        await expect(mito.locator('.stCodeBlock').first()).not.toHaveText('var(--mito-text)');
        await expect(mito.locator('.stCodeBlock').first()).not.toHaveText('var(--mito-background-off')

        // There should be no styler, since no style is set
        await expect(mito.locator('.stCodeBlock').first()).not.toHaveText('styler')
    });
})