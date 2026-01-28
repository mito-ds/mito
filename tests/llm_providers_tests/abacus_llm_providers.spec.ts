/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { test, expect } from '../fixtures';
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
} from '../mitoai_ui_tests/utils';

const MODEL = 'Abacus/gpt-4.1'

test.describe.serial('Abacus AI Integration Tests', () => {
  test('chat mode basic functionality with Abacus AI', async ({ page }) => {
    // Create a notebook for Abacus AI testing
    await createAndRunNotebookWithCells(page, ['# Test notebook for Abacus AI']);
    await waitForIdle(page);

    // Switch to GPT 4.1 model (which should use Abacus when configured)
    await selectModel(page, MODEL);

    // Start a new chat
    await clickOnMitoAIChatTab(page);
    await startNewMitoAIChat(page);
    await clearMitoAIChatInput(page);

    // Select the first cell
    await selectCell(page, 0);

    // Send a message and verify the response
    await sendMessagetoAIChat(page, 'print hello world from abacus');
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

  test('agent mode basic functionality with Abacus AI', async ({ page }) => {
    // Create a notebook for Abacus AI testing
    await createAndRunNotebookWithCells(page, ['# Test notebook for Abacus AI Agent']);
    await waitForIdle(page);

    // Switch to GPT 4.1 model (which should use Abacus when configured)
    await selectModel(page, MODEL);

    // Start a new chat and switch to agent mode
    await clickOnMitoAIChatTab(page);
    await startNewMitoAIChat(page);
    await turnOnAgentMode(page);

    // Send a message to the agent
    await sendMessageToAgent(page, 'create a simple function that prints hello abacus');
    await waitForAgentToFinish(page);

    // Verify the code was added to the notebook
    const code = await getNotebookCode(page);
    const joinedCode = code.join('').toLowerCase();
    expect(joinedCode.includes('def') || joinedCode.includes('function')).toBe(true);
    expect(joinedCode).toContain('print');
    expect(joinedCode).toContain('hello');
  });

  test('model capabilities reporting for Abacus AI', async ({ page }) => {
    // Create a notebook for testing model capabilities
    await createAndRunNotebookWithCells(page, ['# Test Abacus AI model capabilities']);
    await waitForIdle(page);

    // Switch to GPT 4.1 model (which should use Abacus when configured)
    await selectModel(page, MODEL);

    // Check the status button
    await page.getByRole('button', { name: 'Mito AI', exact: true }).click();
    await expect(page.locator(".mito-ai-status-popup")).toBeVisible();
    await expect(page.locator(".mito-ai-status-popup")).toContainText("Abacus AI")
  });
});
