/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@jupyterlab/galata';
import {
    createAndRunNotebookWithCells,
    getCodeFromCell,
    scrollToCell,
    waitForIdle,
} from '../jupyter_utils/jupyterlab_utils';
import {
    sendMessageToAgent,
    waitForMitoAILoadingToDisappear,
    turnOnAgentMode,
    getNotebookCode,
    waitForAgentToFinish,
    startNewMitoAIChat
} from './utils';
import { CLAUDE_SONNET_DISPLAY_NAME } from '../../mito-ai/src/utils/models';

const MODEL = CLAUDE_SONNET_DISPLAY_NAME;

test.describe.parallel("Background Agent functionality", () => {

    test.only("Agent continues working in original notebook when user switches to different notebook", async ({ page }) => {
        // Create the first notebook with some initial content
        await createAndRunNotebookWithCells(page, ['x = 1']);
        await waitForIdle(page);

        // Start Mito AI chat and turn on agent mode
        await startNewMitoAIChat(page, MODEL);
        await turnOnAgentMode(page);

        // Send a message to the agent that will create multiple cells
        await sendMessageToAgent(page, "In three different cells: create a variable y = x + 1, then create z = y * 2");
        
        // Wait a moment for the agent to start working
        await page.waitForTimeout(500);

        // Create a second notebook by clicking the Jupyter launcher
        page.notebook.createNew();

        // Wait for the agent to finish
        await waitForAgentToFinish(page);

        // Verify we're now in the second notebook (it should be empty)
        const secondNotebookCodeCell = await getCodeFromCell(page, 0);
        expect(secondNotebookCodeCell).toContain('Start writing python or Press'); // Placeholder text

        // Switch back to the original notebook
        await page.getByRole('tab', { name: /\.ipynb$/ }).first().click();

        // Verify the agent worked in the original notebook
        const originalNotebookCode = await getNotebookCode(page);
        const codeString = originalNotebookCode.join(' ');
        
        // Check that the agent created the expected variables and operations
        expect(codeString).toContain('x = 1'); // Original content
        expect(codeString).toContain('y = x + 1'); // Agent's first operation
        expect(codeString).toContain('z = y * 2'); // Agent's second operation

        // Verify that the notebook is scrolled to the active cell (the last cell the agent edited)
        // The active cell should be the last cell in the notebook
        const lastCellIndex = originalNotebookCode.length - 1;
        const activeCell = page.locator('.jp-Cell').nth(lastCellIndex);
        await expect(activeCell).toHaveClass('jp-Cell-active');
    });

    test("Agent has access to variables from original notebook when working in background", async ({ page }) => {
        // Create notebook with some variables
        await createAndRunNotebookWithCells(page, []);
        await waitForIdle(page);

        // Start Mito AI chat and turn on agent mode
        await startNewMitoAIChat(page, MODEL);
        await turnOnAgentMode(page);

        // Send a message that requires access to the existing variables
        // By making the agent import the data first, we know that the data will only be available to the 
        // background agent if it uses the correct variable manager because it won't be part of
        // the defined variables in the original notebook.
        await sendMessageToAgent(page, "Import the meta stock data and then find the mean of the closing price. The data is here https://github.com/mito-ds/mito/blob/dev/jupyterhub/meta_stock_prices.csv");
        
        // Wait a moment for the agent to start working
        await page.waitForTimeout(500);

        // Switch to a different notebook
        await page.getByRole('button', { name: 'New Launcher' }).click();
        await page.locator('.jp-LauncherCard-icon').first().click();
        await waitForIdle(page);

        // Wait for the agent to finish
        await waitForAgentToFinish(page);

        const codeString = await getNotebookCode(page);
        const codeStringString = codeString.join('');
        expect(codeStringString).toBe('');

        // Switch back to the original notebook
        const originalNotebookTab = page.locator('.jp-NotebookPanel-title').first();
        await originalNotebookTab.click();

        // Verify the agent worked in the original notebook
        const originalNotebookCode = await getNotebookCode(page);
        const originalNotebookCodeString = originalNotebookCode.join('');
        expect(originalNotebookCodeString).toContain('meta_stock_prices.csv');

        // Check that the agent never used the run_all_cells tool 
        // by looking at the content in the chat taskpane
        // If the background agent's variables were not updated, it is likely 
        // to try using the run_all_cells tool to refresh the variables.
        const chatTaskpane = page.locator('.chat-taskpane');
        const chatTaskpaneContent = await chatTaskpane.textContent();
        expect(chatTaskpaneContent).not.toContain('run_all_cells');
    });
});
