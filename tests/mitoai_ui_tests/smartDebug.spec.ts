/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { test, expect } from '../fixtures';
import {
    createAndRunNotebookWithCells,
    getCodeFromCell,
    waitForIdle,
} from '../jupyter_utils/jupyterlab_utils';
import {
    clickAcceptButton,
    clickPreviewButton,
    waitForMitoAILoadingToDisappear,
    startNewMitoAIChat,
    turnOnAgentMode,
} from './utils';
import { CLAUDE_HAIKU_DISPLAY_NAME } from '../../mito-ai/src/utils/models';

const MODEL = CLAUDE_HAIKU_DISPLAY_NAME

test.describe.parallel('Smart Debug tests', () => {

    test.beforeEach(async ({ page }) => {
        await createAndRunNotebookWithCells(page, ['print(1']);
        await waitForIdle(page);

        await startNewMitoAIChat(page, MODEL);
    });

    test('Smart Debug button should update code', async ({ page }) => {
        await page.getByRole('button', { name: 'Fix Error in AI Chat' }).click();
        await waitForIdle(page);

        await waitForMitoAILoadingToDisappear(page);

        // Ensure the chat input is not focussed on 
        await expect(page.locator('.chat-input')).not.toBeFocused();

        // No code diffs should be visible before the user clicks preview
        await expect(page.locator('.cm-codeDiffRemovedStripe')).not.toBeVisible();
        await expect(page.locator('.cm-codeDiffInsertedStripe')).not.toBeVisible();

        await clickPreviewButton(page);

        await clickAcceptButton(page);
        await waitForIdle(page);

        const code = await getCodeFromCell(page, 0);
        expect(code).toContain('print(1)');
    });

    test('Smart Debug in Agent mode should start a new chat', async ({ page }) => {
        // Switch to agent mode
        await turnOnAgentMode(page);

        // Click the Smart Debug button
        await page.getByRole('button', { name: 'Fix Error in AI Chat' }).click();
        await waitForIdle(page);

        await waitForMitoAILoadingToDisappear(page);

        // Ensure the chat input is not focussed on 
        await expect(page.locator('.chat-input')).not.toBeFocused();

        // Ensure we are in chat mode
        const chatButton = page.locator('.toggle-button-container').getByRole('button', { name: 'Chat' });
        const isSelected = await chatButton.evaluate((el) => el.classList.contains('selected'));
        expect(isSelected).toBe(true);

        // No code diffs should be visible before the user clicks preview
        await expect(page.locator('.cm-codeDiffRemovedStripe')).not.toBeVisible();
        await expect(page.locator('.cm-codeDiffInsertedStripe')).not.toBeVisible();

        await clickPreviewButton(page);

        await clickAcceptButton(page);
        await waitForIdle(page);

        const code = await getCodeFromCell(page, 0);
        expect(code).toContain('print(1)');
    });
});
