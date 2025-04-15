/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@playwright/test';
import { getMitoFrameWithTestCSV } from "../utils";

test.describe('Column Header', () => {
    test('Column Header context menu opens', async ({ page }) => {
      const mito = await getMitoFrameWithTestCSV(page);
      await expect(mito.locator('.mito-dropdown')).not.toBeVisible();
      await mito.getByTitle('Column1').click({ button: 'right' });
      await expect(mito.locator('.mito-dropdown')).toBeVisible();
      await expect(mito.locator('.mito-dropdown')).toHaveText(/Sort A to Z/);
    })
});
  