/*
Basic integration test for inline completion. These tests are closer
to the actual user experience of typing in a notebook and seeing
inline completions. 
*/

import { expect, galata, test } from '@jupyterlab/galata';
import {
    createAndRunNotebookWithCells,
    waitForIdle,
    typeInNotebookCell,
    selectCell,
    getCodeFromCell
} from '../jupyter_utils/jupyterlab_utils';

const GHOST_SELECTOR = ".jp-GhostText";
const THRESHOLD_IN_MS = 5000;

test.describe("inline completion integration test", () => {

    test('Inline completion', async ({ page }) => {
        await createAndRunNotebookWithCells(page, ['import pandas as pd']);
        await waitForIdle(page);

        await typeInNotebookCell(page, 1, 'def sum(a, b):');
        await waitForIdle(page);

        await selectCell(page, 1);
        await waitForIdle(page);

        // sleep 
        await page.waitForTimeout(THRESHOLD_IN_MS);

        expect.soft(page.locator(GHOST_SELECTOR)).toBeVisible();
        expect.soft((await page.notebook.getCellLocator(1))!.getByRole("textbox")).toContainText("def sum(a, b):");

        await page.keyboard.press("Tab");

        expect.soft(page.locator(GHOST_SELECTOR)).toHaveCount(0);
        expect((await page.notebook.getCellLocator(1))!.getByRole("textbox")).toContainText("return a + b");
    })
});
