/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@playwright/test';
import { getMitoFrameWithTestCSV } from '../utils';

test.describe.configure({ mode: 'parallel' });

test.describe('Resize taskpane', () => {
  test.skip('Resize taskpane', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.getByText('Format').first().click();
    expect(mito.locator('.taskpane-resizer-container')).toBeVisible();
    expect(mito.locator('.default-taskpane-div')).toHaveCSS('width', '300px' );
    await mito.locator('.taskpane-resizer-container').dragTo(mito.getByText('Column2').first());
    expect(mito.locator('.default-taskpane-div')).toHaveCSS('width', '497.117px' );
  });
})