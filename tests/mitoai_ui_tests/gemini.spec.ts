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
    clickOnMitoAIChatTab,
    sendMessageToAgent,
    sendMessagetoAIChat,
    waitForMitoAILoadingToDisappear,
    turnOnAgentMode,
    getNotebookCode,
    waitForAgentToFinish,
    startNewMitoAIChat,
    clickPreviewButton,
    clickAcceptButton
} from './utils';

test.describe('Gemini Model Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Create a new notebook for each test
        await createAndRunNotebookWithCells(page, []);
        await waitForIdle(page);
        await clickOnMitoAIChatTab(page);
        await waitForIdle(page);
        await startNewMitoAIChat(page);
        await waitForIdle(page);
    });

    test('Chat mode with Gemini model', async ({ page }) => {
        // Test basic chat functionality
        await sendMessagetoAIChat(page, 'Write code to create a list of numbers from 1 to 5');
        await waitForMitoAILoadingToDisappear(page);

        // Verify response and code generation
        await clickPreviewButton(page);
        await clickAcceptButton(page);
        await waitForIdle(page);

        const code = await getCodeFromCell(page, 0);
        expect(code).toContain('numbers = [1, 2, 3, 4, 5]');
    });

    test('Agent mode with Gemini model', async ({ page }) => {
        // Switch to agent mode
        await turnOnAgentMode(page);

        // Test agent functionality
        await sendMessageToAgent(page, 'Create a list of numbers from 1 to 5 and print it');
        await waitForAgentToFinish(page);

        // Verify the code was executed
        const codeFromCells = await getNotebookCode(page);
        const codeFromCellsString = codeFromCells.join(' ');
        expect(codeFromCellsString).toContain('numbers = [1, 2, 3, 4, 5]');
        expect(codeFromCellsString).toContain('print');
    });

    test('Autocomplete with Gemini model', async ({ page }) => {
        // Type partial code to trigger autocomplete
        await page.locator('.jp-Cell-inputArea').click();
        await page.keyboard.type('import pandas as pd\n');
        await page.keyboard.type('df = pd.DataF');
        
        // Wait for autocomplete suggestions
        await page.waitForTimeout(1000);
        
        // Verify autocomplete suggestions appear
        const suggestions = await page.locator('.jp-Completer-item').count();
        expect(suggestions).toBeGreaterThan(0);
        
        // Verify DataFrame is in suggestions
        const suggestionTexts = await Promise.all(
            (await page.locator('.jp-Completer-item').all()).map(item => item.textContent())
        );
        expect(suggestionTexts.some(text => text?.includes('DataFrame'))).toBe(true);
    });
}); 