/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@jupyterlab/galata';
import {
  createAndRunNotebookWithCells,
  getCodeFromCell,
  waitForIdle,
  selectCell
} from '../jupyter_utils/jupyterlab_utils';
import {
  clickOnMitoAIChatTab,
  sendMessagetoAIChat,
  waitForMitoAILoadingToDisappear,
  startNewMitoAIChat,
  turnOnAgentMode,
  sendMessageToAgent,
  waitForAgentToFinish,
  getNotebookCode,
  clickPreviewButton,
  clickAcceptButton,
  clearMitoAIChatInput,
  selectModel
} from './utils';

test.describe.parallel('Anthropic Model Tests', () => {
  test('chat mode basic functionality', async ({ page }) => {
    // Create a single notebook for all tests
    await createAndRunNotebookWithCells(page, ['# Test notebook for Anthropic']);
    await waitForIdle(page);

    // Switch to Anthropic model
    await selectModel(page, 'Claude 4 Sonnet');

    // Start a new chat
    await clickOnMitoAIChatTab(page);
    await startNewMitoAIChat(page);
    await clearMitoAIChatInput(page);

    // Select the first cell
    await selectCell(page, 0);

    // Send a message and verify the response
    await sendMessagetoAIChat(page, 'print hello world');
    await waitForMitoAILoadingToDisappear(page);

    // Accept the generated code
    await clickPreviewButton(page);
    await clickAcceptButton(page);
    await waitForIdle(page);

    // Verify the code was added to the notebook
    const code = await getCodeFromCell(page, 0);
    const codeLower = code.toLowerCase();
    expect(codeLower).toContain('print');
    expect(codeLower).toContain('hello');
    expect(codeLower).toContain('world');
  });

  test('agent mode basic functionality', async ({ page }) => {
    // Create a single notebook for all tests
    await createAndRunNotebookWithCells(page, ['# Test notebook for Anthropic']);
    await waitForIdle(page);

    // Switch to Anthropic model
    await selectModel(page, 'Claude 4 Sonnet');

    // Start a new chat and switch to agent mode
    await clickOnMitoAIChatTab(page);
    await startNewMitoAIChat(page);
    await turnOnAgentMode(page);

    // Send a message to the agent
    await sendMessageToAgent(page, 'print hello world');
    await waitForAgentToFinish(page);

    // Verify the code was added to the notebook
    const code = await getNotebookCode(page);
    const joinedCode = code.join('').toLowerCase();
    expect(joinedCode).toContain('print');
    expect(joinedCode).toContain('hello');
    expect(joinedCode).toContain('world');
  });
}); 