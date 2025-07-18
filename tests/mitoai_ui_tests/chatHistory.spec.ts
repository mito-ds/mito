/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@jupyterlab/galata';
import {
    createAndRunNotebookWithCells,
    waitForIdle,
    updateCell
} from '../jupyter_utils/jupyterlab_utils';
import {
    sendMessagetoAIChat,
    startNewMitoAIChat
} from './utils';

const MODEL = 'GPT 4.1';

test.describe.serial('Mito AI Chat - Restore history', () => {

    test.beforeEach(async ({ page }) => {
        await createAndRunNotebookWithCells(page, []);
        await waitForIdle(page);

        await startNewMitoAIChat(page, MODEL);
    });

    test('Restore message history', async ({ page }) => {
        await updateCell(page, 0, ['print(1)'], true);

        await sendMessagetoAIChat(page, 'print(2)');
        await waitForIdle(page);

        // As you have a notebook opened, at reload a dialog shows up to 
        // select the kernel for the notebook. The dialog prevent all the tests 
        // carried out at page load to be performed as it capture the focus.
        // One way around it is to set the option waitForIsReady (specific to JupyterLab):
        // When that option is set, we don't wait for addition checks specific to JupyterLab
        await page.reload({ waitForIsReady: false });
        await Promise.all([
            page.getByRole('button', { name: 'Select Kernel' }).click(),
            waitForIdle(page)
        ]);

        // 1 from the previous message, 1 for the new chat input since we use
        // the message-user class on the chat input also
        await expect(page.locator('.message-user')).toHaveCount(2);
        await expect(page.locator('.message-assistant-chat')).toHaveCount(1);
    });
});