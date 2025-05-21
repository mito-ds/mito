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
  clearMitoAIChatInput
} from './utils';

test('Gemini model basic functionality test', async ({ page }) => {
  // Create a single notebook for all tests
  await createAndRunNotebookWithCells(page, ['# Test notebook for Gemini']);
  await waitForIdle(page);

  // TEST 1: CHAT MODE
  console.log("Testing chat mode functionality...");
  await clickOnMitoAIChatTab(page);
  await startNewMitoAIChat(page);
  await clearMitoAIChatInput(page);

  // Select the first cell
  await selectCell(page, 0);

  // Simple code generation test
  await sendMessagetoAIChat(page, 'Create a variable x = 5');
  await waitForMitoAILoadingToDisappear(page);

  await clickPreviewButton(page);
  await clickAcceptButton(page);
  await waitForIdle(page);

  const code = await getCodeFromCell(page, 0);
  expect(code).toContain('x = 5');

  // TEST 2: AGENT MODE
  console.log("Testing agent mode functionality...");
  await clickOnMitoAIChatTab(page);
  await startNewMitoAIChat(page);
  await clearMitoAIChatInput(page);

  // Switch to agent mode
  await turnOnAgentMode(page);
  await waitForIdle(page);

  // Execute a simple command
  await sendMessageToAgent(page, 'Set y = 10 and print it');
  await waitForAgentToFinish(page);

  // Verify the execution
  const codeFromCells = await getNotebookCode(page);
  const codeFromCellsString = codeFromCells.join(' ');
  expect(codeFromCellsString).toContain('y = 10');

  // TEST 3: AUTOCOMPLETE
  console.log("Testing autocomplete functionality...");
  // Select the first cell
  await selectCell(page, 0);

  // Type code to trigger autocomplete
  await page.locator('.jp-Cell-inputArea').click();
  await page.keyboard.type('import numpy as np\n');
  await page.keyboard.type('np.ar');

  // Wait for suggestions
  await page.waitForTimeout(1500);

  // Verify autocomplete suggestions appear
  const suggestions = await page.locator('.jp-Completer-item').all();
  const suggestionTexts = await Promise.all(
    suggestions.map(async item => await item.textContent())
  );

  // Look for common numpy array functions
  const expectedFunctions = ['array', 'arange', 'arccos'];
  const foundFunctions = expectedFunctions.filter(func =>
    suggestionTexts.some(text => text?.includes(func))
  );

  expect(foundFunctions.length).toBeGreaterThan(0);
});