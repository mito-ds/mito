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

// Define test configurations for different models
const modelConfigs = [
  { name: 'Claude 4 Sonnet', provider: 'Anthropic Claude 4 Sonnet' },
  { name: 'Claude 4 Opus', provider: 'Anthropic Claude 4 Opus' },
  { name: 'Gemini 2.5 Pro', provider: 'Gemini Gemini 2.5 Pro' },
  { name: 'GPT 4.1', provider: 'OpenAI GPT 4.1' }
];

// Run tests for each model configuration
modelConfigs.forEach(({ name: modelName, provider }) => {
  test.describe.serial(`${provider} Model Tests`, () => {
    test('chat mode basic functionality', async ({ page }) => {
      // Create a single notebook for all tests
      await createAndRunNotebookWithCells(page, [`# Test notebook for ${provider}`]);
      await waitForIdle(page);

      // Switch to the specified model
      await selectModel(page, modelName);

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
      await createAndRunNotebookWithCells(page, [`# Test notebook for ${provider}`]);
      await waitForIdle(page);

      // Switch to the specified model
      await selectModel(page, modelName);

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
});
