/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@playwright/test';
import { getMitoFrameWithTestCSV } from "../utils";

test.describe('Context Menus', () => {
    test('Index header context menu appears', async ({ page }) => {
      const mito = await getMitoFrameWithTestCSV(page);
      await mito.locator('.endo-index-headers-container').first().getByTitle('1', { exact: true }).click({ button: 'right' });
      await expect(mito.locator('.mito-dropdown')).toBeVisible();
      await expect(mito.locator('.mito-dropdown')).toHaveText(/Reset Index/);
    })
});