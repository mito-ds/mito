import { expect, test } from '@playwright/test';
import { awaitResponse, getMitoFrameWithTestCSV } from '../utils';

test.describe('Formatting', () => {
    test('Add a suggested style', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await mito.getByRole('button', { name: 'Format', exact: true }).click();
        
        // Update to the second suggested style (the first is default)
        await mito.locator('.mito-suggested-style').nth(1).click();
        await expect(mito.locator('.endo-column-header-container:not(.endo-column-header-container-selected)').first()).toHaveCSS('background-color', 'rgb(155, 155, 157)')

        // Update to the third suggested style
        await mito.locator('.mito-suggested-style').nth(2).click();
        await awaitResponse(page);
        await expect(mito.locator('.endo-column-header-container:not(.endo-column-header-container-selected)').first()).toHaveCSS('background-color', 'rgb(84, 157, 58)')
        await expect(mito.locator('.mito-grid-row-even').first()).toHaveCSS('background-color', 'rgb(208, 227, 201)')
        await expect(mito.locator('.mito-grid-row-odd').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    });

    test('Add a custom style to column headers', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await mito.getByRole('button', { name: 'Format', exact: true }).click();

        await mito.getByText('Column Headers').click();
        await mito.locator('.spacing-row', { hasText: 'Background Color' }).locator('.color-input').fill('#2b4eee');
        await expect(mito.locator('.endo-column-header-container:not(.endo-column-header-container-selected)').first()).toHaveCSS('background-color', 'rgb(43, 78, 238)')

        await mito.locator('.spacing-row', { hasText: 'Text Color' }).locator('.color-input').fill('#ffffff');
        await expect(mito.locator('.endo-column-header-container:not(.endo-column-header-container-selected)').first()).toHaveCSS('color', 'rgb(255, 255, 255)')
    });

    test('Add a custom style to rows', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await mito.getByRole('button', { name: 'Format', exact: true }).click();

        await mito.locator('.mito-blue-container', { hasText: 'Rows'}).click();
        await mito.locator('.spacing-row', { hasText: 'Even Row: Background Color' }).locator('.color-input').fill('#2b4eee');
        await expect(mito.locator('.mito-grid-row-even').first()).toHaveCSS('background-color', 'rgb(43, 78, 238)')

        await mito.locator('.spacing-row', { hasText: 'Even Row: Text Color' }).locator('.color-input').fill('#ffffff');
        await expect(mito.locator('.mito-grid-row-even').first()).toHaveCSS('color', 'rgb(255, 255, 255)')

        await mito.locator('.spacing-row', { hasText: 'Odd Row: Background Color' }).locator('.color-input').fill('#ffffff');
        await expect(mito.locator('.mito-grid-row-odd').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)')

        await mito.locator('.spacing-row', { hasText: 'Odd Row: Text Color' }).locator('.color-input').fill('#000000');
        await expect(mito.locator('.mito-grid-row-odd').first()).toHaveCSS('color', 'rgb(0, 0, 0)')
    });

});