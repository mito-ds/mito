/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@jupyterlab/galata';
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
} from './utils';

const MODEL = 'GPT 4.1';

test.describe.parallel('Smart Debug (in Chat mode)', () => {

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
});
