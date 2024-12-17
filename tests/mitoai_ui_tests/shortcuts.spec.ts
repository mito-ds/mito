import { expect, test } from '@jupyterlab/galata';
import {
    createAndRunNotebookWithCells,
    getCodeFromCell,
    waitForIdle,
} from '../jupyter_utils/jupyterlab_utils';
import { sendMessageToMitoAI } from './utils';

const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';

test.describe('Mito AI Shortcuts', () => {

    test.beforeEach(async ({ page }) => {
        await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
        await waitForIdle(page);
    });
    
    test.only('Open the AI chat pane', async ({ page }) => {
        await page.keyboard.press(`${modifierKey}+B`); // Close the sidebar
        await page.keyboard.press(`${modifierKey}+E`);
        await expect(page.locator('.chat-input')).toBeVisible();
    });

    test.only('Preview AI generated code', async ({ page }) => {
        await sendMessageToMitoAI(page, 'Write the code df["C"] = [7, 8, 9]');

        // Preview the code
        await page.keyboard.press(`${modifierKey}+Y`);

        // Code diffs should be visible after the user clicks preview
        await expect(page.locator('.cm-codeDiffRemovedStripe')).toBeVisible();
        await expect(page.locator('.cm-codeDiffInsertedStripe')).toBeVisible();
    });

    test.only('Accept AI generated code', async ({ page }) => {
        await sendMessageToMitoAI(page, 'Write the code df["C"] = [7, 8, 9]');

        // Preview the code
        await page.keyboard.press(`${modifierKey}+Y`);

        // Accept the code
        await page.keyboard.press(`${modifierKey}+Y`);

        // Code diffs should not longer be visible after the user accepts 
        await expect(page.locator('.cm-codeDiffRemovedStripe')).not.toBeVisible();
        await expect(page.locator('.cm-codeDiffInsertedStripe')).not.toBeVisible();

        const code = await getCodeFromCell(page, 1);
        expect(code).toContain('df["C"] = [7, 8, 9]');
    });

    test.only('Reject AI generated code', async ({ page }) => {
        await sendMessageToMitoAI(page, 'Write the code df["C"] = [7, 8, 9]');

        // Preview the code
        await page.keyboard.press(`${modifierKey}+Y`);

        // Reject the code
        await page.keyboard.press(`${modifierKey}+D`);

        // Code diffs should not longer be visible after the user rejects 
        await expect(page.locator('.cm-codeDiffRemovedStripe')).not.toBeVisible();
        await expect(page.locator('.cm-codeDiffInsertedStripe')).not.toBeVisible();

        const code = await getCodeFromCell(page, 1);
        expect(code).not.toContain('df["C"] = [7, 8, 9]');
    });
});
