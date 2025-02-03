/*
Miscellaneous tests that don't fit into other test files,
but still need to be run if changes are made in mito-ai/
*/

import { expect, test } from '@jupyterlab/galata';
import {
    createAndRunNotebookWithCells,
    waitForIdle,
} from '../jupyter_utils/jupyterlab_utils';


test('Make sure collapsed warnings can be read', async ({ page }) => {
    const warningMessage = 'This is a warning message.';

    await createAndRunNotebookWithCells(page, [`import warnings\nwarnings.warn("${warningMessage}")`]);
    await waitForIdle(page);

    // Expect to see the warning message
    await expect(page.locator('.output-block')).toBeVisible();
    await expect(page.locator('.output-block').locator('pre')).toContainText(warningMessage);

    // Expand the full warning message
    await page.locator('.collapse-button').click();

    // Expect to see the expanded warning message
    await expect(page.locator('.output-block-expanded')).toBeVisible();
    await expect(page.locator('.output-block-expanded').locator('pre')).toContainText(warningMessage);
})