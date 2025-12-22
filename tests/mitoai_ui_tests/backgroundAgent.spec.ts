/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { test, expect } from '../fixtures';
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

    test("Agent continues working in original notebook when user switches to different notebook", async ({ page }) => {
        // Create the first notebook with some initial content
        await createAndRunNotebookWithCells(page, ['x = 1']);
        await waitForIdle(page);

        // Start Mito AI chat and turn on agent mode
        await startNewMitoAIChat(page, MODEL);
        await turnOnAgentMode(page);

        // Send a message to the agent that will create multiple cells
        await sendMessageToAgent(page, "print 1");
        
        // Wait a moment for the agent to start working
        await page.waitForTimeout(500);

        // Create a second notebook by clicking the Jupyter launcher
        await page.getByRole('tab', { name: 'Launcher' }).click();
        await page.getByText('Python 3').first().click();
        await waitForIdle(page);

        // Wait for the agent to finish
        await waitForAgentToFinish(page);

        // Verify we're now in the second notebook (it should be empty)
        const secondNotebookCodeCell = await getCodeFromCell(page, 0);
        expect(secondNotebookCodeCell).toContain('Write Python or Press');

        // Switch back to the original notebook
        await page.getByRole('tab', { name: /\.ipynb$/ }).last().click();

        // Scroll to the first code cell
        await scrollToCell(page, 0);

        // Verify the agent worked in the original notebook
        const finalCodeCell = await getCodeFromCell(page, 1);
        expect(finalCodeCell).toContain('print(1)');
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

        // Create a second notebook by clicking the Jupyter launcher
        await page.getByRole('tab', { name: 'Launcher' }).click();
        await page.getByText('Python 3').first().click();
        await waitForIdle(page);

        // Wait for the agent to finish
        await waitForAgentToFinish(page);

        // Verify we're now in the second notebook (it should be empty)
        const secondNotebookCodeCell = await getCodeFromCell(page, 0);
        expect(secondNotebookCodeCell).toContain('Write Python or Press');

        // Switch back to the original notebook
        await page.getByRole('tab', { name: /\.ipynb$/ }).last().click();

        // Scroll to the first code cell
        await scrollToCell(page, 0);

        // Verify the agent worked in the original notebook
        const firstCodeCell = await getCodeFromCell(page, 0);
        expect(firstCodeCell).toContain('meta_stock_prices.csv');

        // Check that the agent never used the run_all_cells tool 
        // by looking at the content in the chat taskpane
        // If the background agent's variables were not updated, it is likely 
        // to try using the run_all_cells tool to refresh the variables.
        const chatTaskpane = page.locator('.chat-taskpane');
        const chatTaskpaneContent = await chatTaskpane.textContent();
        expect(chatTaskpaneContent).not.toContain('run_all_cells');
    });
});
