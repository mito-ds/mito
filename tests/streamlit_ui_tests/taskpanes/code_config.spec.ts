/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@playwright/test';
import { awaitResponse, checkOpenTaskpane, clickTab, getMitoFrameWithTestCSV } from '../utils';


test.describe('Code Config', () => {
  test('Configure Code to generate function with new name for function', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Code');

    await mito.getByRole('button', { name: 'Configure Code' }).click();
    await checkOpenTaskpane(mito, 'Generated Code Options');

    await mito.locator('.spacing-row', { hasText: 'Generate Function' }).locator('.toggle').click();
    await mito.getByRole('textbox').fill('new name');
    
    await expect(page.locator('.stCodeBlock')).toContainText('def new_name():');
  });

  test('Configure Code to generate function with parameters', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.locator('.mito-toolbar-button', { hasText: 'Export'}).click();
    await mito.locator('.mito-dropdown-item', { hasText: 'Download File when Executing Code'}).click();
    await awaitResponse(page);
    await mito.getByText('Generate Export Code').click();

    await clickTab(page, mito, 'Code');

    await mito.getByRole('button', { name: 'Configure Code' }).click();
    await checkOpenTaskpane(mito, 'Generated Code Options');

    await mito.locator('.spacing-row', { hasText: 'Generate Function' }).locator('.toggle').click();
    await mito.getByRole('textbox').fill('new name');
    await awaitResponse(page);
    await mito.getByText('Add').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'CSV Import File Path' }).click();
    await awaitResponse(page);
    
    await mito.getByText('Add').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'CSV Export File Path' }).click();

    // Scroll the code block into view
    await page.locator('.stCodeBlock').scrollIntoViewIfNeeded();
    await expect(page.locator('.stCodeBlock')).toContainText('def new_name(test_path, test_export_path):');
    await expect(page.locator('.stCodeBlock')).toContainText('test_path =');
    await expect(page.locator('.stCodeBlock')).toContainText('test_export_path =');
  });
});