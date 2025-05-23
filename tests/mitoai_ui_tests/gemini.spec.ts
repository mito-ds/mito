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

test('Gemini model: chat mode basic functionality', async ({ page }) => {
  // Create a single notebook for all tests
  await createAndRunNotebookWithCells(page, ['# Test notebook for Gemini']);
  await waitForIdle(page);

  console.log("Testing chat mode functionality...");
  await clickOnMitoAIChatTab(page);
  await startNewMitoAIChat(page);
  await clearMitoAIChatInput(page);

  // Select the first cell
  await selectCell(page, 0);

  // Simple code generation test
  await sendMessagetoAIChat(page, 'Write the code "x = 5" and print it');
  await waitForMitoAILoadingToDisappear(page);

  await clickPreviewButton(page);
  await clickAcceptButton(page);
  await waitForIdle(page);

  const code = await getCodeFromCell(page, 0);
  expect(code).toContain('x = 5');
});

test('Gemini model: agent mode basic functionality', async ({ page }) => {
  // Create a single notebook for all tests
  await createAndRunNotebookWithCells(page, ['# Test notebook for Gemini']);
  await waitForIdle(page);

  console.log("Testing agent mode functionality...");
  await clickOnMitoAIChatTab(page);
  await startNewMitoAIChat(page);
  await clearMitoAIChatInput(page);

  // Switch to agent mode
  await turnOnAgentMode(page);
  await waitForIdle(page);

  // Execute a simple command
  await sendMessageToAgent(page, 'Write the code "y = 10" and print it');
  await waitForAgentToFinish(page);

  // Verify the execution
  const codeFromCells = await getNotebookCode(page);
  const codeFromCellsString = codeFromCells.join(' ');
  expect(codeFromCellsString).toContain('y = 10');
});