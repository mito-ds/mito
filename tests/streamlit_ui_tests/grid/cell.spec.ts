/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */



import { expect, test } from '@playwright/test';
import { getMitoFrameWithTestCSV } from "../utils";

test.describe('Column Header', () => {
    test('Cell context menu appears', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await mito.locator('.endo-renderer-container').first().getByTitle('1', { exact: true }).click({ button: 'right' });
        await expect(mito.locator('.mito-dropdown')).toBeVisible();
        await expect(mito.locator('.mito-dropdown')).toHaveText(/Copy/);
    });


  test('Cell (with multiple cells)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.locator('.endo-renderer-container').first().getByTitle('1', { exact: true }).click({ button: 'right' });
    await mito.locator('.endo-renderer-container').first().getByTitle('2', { exact: true }).click({ button: 'right' });
    await expect(mito.locator('.mito-dropdown')).toBeVisible();
    await expect(mito.locator('.mito-dropdown')).toHaveText(/Copy/);
  });

  test('Open cell context menu then open column header context menu', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.locator('.endo-renderer-container').first().getByTitle('1', { exact: true }).click({ button: 'right' });
    await expect(mito.locator('.mito-dropdown')).toBeVisible();
    await expect(mito.locator('.mito-dropdown')).toHaveText(/Copy/);

    // Open the column header context menu and check for the contents
    await mito.getByTitle('Column1').click({ button: 'right' });
    await expect(mito.locator('.mito-dropdown')).toHaveCount(1);
    await expect(mito.locator('.mito-dropdown')).toHaveText(/Sort A to ZSort Z to A/);
  });
});
  


