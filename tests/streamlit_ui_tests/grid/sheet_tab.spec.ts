/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import { expect, test } from '@playwright/test';
import { getMitoFrameWithTestCSV } from "../utils";

test.describe('Context Menus', () => {
    test('Open sheet tab context menu then open number format dropdown', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await mito.getByText('test').click({ button: 'right' });
        await expect(mito.locator('.mito-dropdown')).toBeVisible();
        await expect(mito.locator('.mito-dropdown')).toHaveText(/Create graph/);
    
        await mito.getByText('Default').click();
        await expect(mito.getByText('Currency')).toBeVisible();
        await expect(mito.locator('.mito-dropdown')).toHaveCount(1);
    });
});


