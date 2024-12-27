// TODO: DELETE THIS FILE LATER (maybe)
import { expect, test } from '@jupyterlab/galata';
import {
    createAndRunNotebookWithCells,
    waitForIdle,
    typeInNotebookCell,
    selectCell
} from '../jupyter_utils/jupyterlab_utils';

const GHOST_SELECTOR = ".jp-GhostText";


// Before each test, enable inline completion
test.beforeEach(async ({ page }) => {
    await page.locator('button:has-text("Enable")').click();
});


test.only('Inline completion', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd']);
    await waitForIdle(page);

    await typeInNotebookCell(page, 1, 'def sum(a, b):');
    await waitForIdle(page);

    await selectCell(page, 1);
    await waitForIdle(page);

    // sleep for 5s
    await page.waitForTimeout(5000);

    expect.soft(page.locator(GHOST_SELECTOR)).toHaveCount(1);
    expect
        .soft((await page.notebook.getCellLocator(1))!.getByRole("textbox"))
        .toContainText("def sum(a, b):");
    expect
        .soft((await page.notebook.getCellLocator(1))!.getByRole("textbox"))
        .toContainText("return a + b");
});
