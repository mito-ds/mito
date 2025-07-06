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
} from '../mitoai_ui_tests/utils';

test.describe.serial('Azure OpenAI Integration Tests', () => {
  test('chat mode basic functionality with Azure OpenAI', async ({ page }) => {
    // Create a notebook for Azure OpenAI testing
    await createAndRunNotebookWithCells(page, ['# Test notebook for Azure OpenAI']);
    await waitForIdle(page);

    // Switch to GPT 4.1 model (which should use Azure when configured)
    await selectModel(page, 'GPT 4.1');

    // Start a new chat
    await clickOnMitoAIChatTab(page);
    await startNewMitoAIChat(page);
    await clearMitoAIChatInput(page);

    // Select the first cell
    await selectCell(page, 0);

    // Send a message and verify the response
    await sendMessagetoAIChat(page, 'print hello world from azure');
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

  test('agent mode basic functionality with Azure OpenAI', async ({ page }) => {
    // Create a notebook for Azure OpenAI testing
    await createAndRunNotebookWithCells(page, ['# Test notebook for Azure OpenAI Agent']);
    await waitForIdle(page);

    // Switch to GPT 4.1 model (which should use Azure when configured)
    await selectModel(page, 'GPT 4.1');

    // Start a new chat and switch to agent mode
    await clickOnMitoAIChatTab(page);
    await startNewMitoAIChat(page);
    await turnOnAgentMode(page);

    // Send a message to the agent
    await sendMessageToAgent(page, 'create a simple function that prints hello azure');
    await waitForAgentToFinish(page);

    // Verify the code was added to the notebook
    const code = await getNotebookCode(page);
    const joinedCode = code.join('').toLowerCase();
    expect(joinedCode.includes('def') || joinedCode.includes('function')).toBe(true);
    expect(joinedCode).toContain('print');
    expect(joinedCode).toContain('hello');
  });

  test('model capabilities reporting for Azure OpenAI', async ({ page }) => {
    // Create a notebook for testing model capabilities
    await createAndRunNotebookWithCells(page, ['# Test Azure OpenAI model capabilities']);
    await waitForIdle(page);

    // Switch to GPT 4.1 model (which should use Azure when configured)
    await selectModel(page, 'GPT 4.1');

    // Check the status button
    await page.getByRole("button", { name: "Mito AI" }).click();
    await expect(page.locator(".mito-ai-status-popup")).toBeVisible();
    await expect(page.locator(".mito-ai-status-popup")).toContainText("Azure OpenAI")
  });
}); 