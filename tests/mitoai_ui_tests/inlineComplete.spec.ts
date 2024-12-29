// TODO: DELETE THIS FILE LATER (maybe)
import { expect, galata, test } from '@jupyterlab/galata';
import {
    createAndRunNotebookWithCells,
    waitForIdle,
    typeInNotebookCell,
    selectCell,
    getCodeFromCell
} from '../jupyter_utils/jupyterlab_utils';

const GHOST_SELECTOR = ".jp-GhostText";


// Before each test, enable inline completion
test.beforeEach(async ({ page }) => {
    await page.locator('button:has-text("Enable")').click();
});


test.describe("inline completion integration test", () => {

    test('Inline completion', async ({ page }) => {
        await createAndRunNotebookWithCells(page, ['import pandas as pd']);
        await waitForIdle(page);

        await typeInNotebookCell(page, 1, 'def sum(a, b):');
        await waitForIdle(page);

        await selectCell(page, 1);
        await waitForIdle(page);

        // sleep for 5s
        await page.waitForTimeout(5000);

        expect.soft(page.locator(GHOST_SELECTOR)).toBeVisible();
        expect.soft((await page.notebook.getCellLocator(1))!.getByRole("textbox")).toContainText("def sum(a, b):");

        await page.keyboard.press("Tab");

        expect.soft(page.locator(GHOST_SELECTOR)).toHaveCount(0);
        expect((await page.notebook.getCellLocator(1))!.getByRole("textbox")).toHaveText("def sum(a, b):\n    return a + b");

    })
});
