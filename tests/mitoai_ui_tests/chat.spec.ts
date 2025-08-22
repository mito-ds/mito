/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@jupyterlab/galata';
import {
  createAndRunNotebookWithCells,
  getCodeFromCell,
  selectCell,
  waitForIdle,
  addNewCell,
  updateCell,
  waitForCodeToBeWritten
} from '../jupyter_utils/jupyterlab_utils';
import {
  clearMitoAIChatInput,
  clickAcceptButton,
  clickDenyButton,
  clickPreviewButton,
  clickOnMitoAIChatTab,
  editMitoAIMessage,
  sendMessagetoAIChat,
  waitForMitoAILoadingToDisappear,
  startNewMitoAIChat,
} from './utils';
import { CLAUDE_SONNET_DISPLAY_NAME } from '../../mito-ai/src/utils/models';

const MODEL = CLAUDE_SONNET_DISPLAY_NAME

test.describe.parallel('Mito AI Chat', () => {

  test.beforeEach(async ({ page }) => {
    await createAndRunNotebookWithCells(page, []);
    await waitForIdle(page);

    await startNewMitoAIChat(page, MODEL);
  });

  test('AI Chat should open on Jupyter Launch', async ({ page }) => {
    // Expect the AI Chat is open
    // Locate the "Clear the chat history" button
    const clearButton = page.locator('button[title="Start New Chat"]');
    expect(clearButton).toBeVisible()

  })

  test('Preview and Accept AI Generated Code', async ({ page }) => {
    await updateCell(
      page,
      0,
      ['import pandas as pd', 'df=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})'],
      true
    );

    await sendMessagetoAIChat(page, 'Write the code df["C"] = [7, 8, 9]');

    // No code diffs should be visible before the user clicks preview
    await expect(page.locator('.cm-codeDiffRemovedStripe')).not.toBeVisible();
    await expect(page.locator('.cm-codeDiffInsertedStripe')).not.toBeVisible();

    await clickPreviewButton(page);
    // Code diffs should be visible after the user clicks preview
    await expect(page.locator('.cm-codeDiffRemovedStripe')).toBeVisible();
    await expect(page.locator('.cm-codeDiffInsertedStripe')).toBeVisible();

    await clickAcceptButton(page);
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 1);
    expect(code).toContain('df["C"] = [7, 8, 9]');
  });

  test("Accept using cell toolbar button", async ({ page }) => {
    await sendMessagetoAIChat(page, 'Write the code x=1');

    await clickPreviewButton(page);
    await page.waitForTimeout(1000);

    expect(page.locator('.jp-cell-toolbar').getByRole('button', { name: 'Accept' })).toBeVisible();

    await clickAcceptButton(page, { useCellToolbar: true });
    await waitForIdle(page);

    // When using the toolbar buttons, there is a bug that Playwright triggers,
    // where the page continously scrolls to the bottom. This loop causes a timeout.
    // To avoid this, we manually select the first cell, forcing the page to scroll to the top.
    await selectCell(page, 0);

    const code = await getCodeFromCell(page, 0);
    expect(code).toContain('x');
    expect(code).toContain('1');
  });

  test('Reject AI Generated Code', async ({ page }) => {
    await updateCell(
      page,
      0,
      ['import pandas as pd', 'df=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})'],
      true
    );

    await sendMessagetoAIChat(page, 'Write the code df["C"] = [7, 8, 9]');

    await clickPreviewButton(page);
    await clickDenyButton(page);
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 1);
    expect(code).not.toContain('df["C"] = [7, 8, 9]');
    expect(code?.trim()).toBe("")
  });

  test("Reject using cell toolbar button", async ({ page }) => {
    await sendMessagetoAIChat(page, 'print x=1');

    await clickPreviewButton(page);
    await page.waitForTimeout(1000);

    expect(page.locator('.jp-cell-toolbar').getByRole('button', { name: 'Reject' })).toBeVisible();

    await clickDenyButton(page, { useCellToolbar: true });
    await waitForIdle(page);

    // When using the toolbar buttons, there is a bug that Playwright triggers,
    // where the page continously scrolls to the bottom. This loop causes a timeout.
    // To avoid this, we manually select the first cell, forcing the page to scroll to the top.
    await selectCell(page, 0);

    const code = await getCodeFromCell(page, 0);
    expect(code).not.toContain('x');
    expect(code).not.toContain('1');
    expect(code?.trim()).toContain("Start writing python") // The placeholder ghost text
  });

  test('Edit Message', async ({ page }) => {
    await updateCell(
      page,
      0,
      ['import pandas as pd', 'df=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})'],
      true
    );

    // Send the first message
    await sendMessagetoAIChat(page, 'Write the code df["C"] = [7, 8, 9]');

    await clickPreviewButton(page);
    await clickAcceptButton(page);
    await waitForIdle(page);

    // Send the second message
    await sendMessagetoAIChat(page, 'Write the code df["D"] = [10, 11, 12]');
    await clickPreviewButton(page);
    await clickAcceptButton(page);
    await waitForIdle(page);

    // Edit the first message
    await editMitoAIMessage(page, 'Write the code df["C_edited"] = [7, 8, 9]', 0);
    await clickPreviewButton(page);
    await clickAcceptButton(page);
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 1);
    expect(code).toContain('df["C_edited"] = [7, 8, 9]');

    // Ensure previous messages are removed.
    const messageAssistantDivs = await page.locator('.message.message-assistant-chat').count();
    expect(messageAssistantDivs).toBe(1);
  });

  test('Code diffs are automatically rejected before new messages are sent', async ({ page }) => {
    // Send a first message w. first cell selected
    await sendMessagetoAIChat(page, 'Write the code x = 1');
    await clickPreviewButton(page);
    await waitForIdle(page);

    // Send a second message
    await sendMessagetoAIChat(page, 'Write the code y = 2');
    await clickPreviewButton(page);
    await clickAcceptButton(page);
    await waitForIdle(page);

    // Sometimes there is a bug where the page continously scrolls to the bottom.
    // To avoid this, we manually select the first cell, forcing the page to scroll to the top.
    await selectCell(page, 0);

    const codeInCell = await getCodeFromCell(page, 0);
    expect(codeInCell).not.toContain('x = 1'); // First msg should be auto-rejected
    expect(codeInCell).toContain('y = 2');
  });

  test('Always write code to the preview cell', async ({ page }) => {
    await updateCell(page, 0, ['print("hello world")'], true);

    // Send the first message with the first cell active
    await selectCell(page, 0);
    await sendMessagetoAIChat(page, 'Write the code x = 1');

    // Preview the changes
    await clickPreviewButton(page);

    // Select the second cell and accept the changes
    await selectCell(page, 1);
    await clickAcceptButton(page);
    await waitForIdle(page);

    // Wait for the code to be written to cell 0
    await waitForCodeToBeWritten(page, 0);

    // The code should be written to cell 0 (the cell that was active when the message was sent)
    const codeInCell1 = await getCodeFromCell(page, 0);
    expect(codeInCell1).toContain('x = 1');

    // Cell 1 should remain unchanged
    const codeInCell2 = await getCodeFromCell(page, 1);
    expect(codeInCell2).not.toContain('x = 1');
  });

  test('Reject reverts preview cell to original code', async ({ page }) => {
    await updateCell(page, 0, ['print("hello world")'], true);

    // Send the first message with the first cell active
    await selectCell(page, 0);
    await sendMessagetoAIChat(page, 'Write the code x = 1');

    // Preview the changes
    await clickPreviewButton(page);

    // Select the second cell and reject the changes
    await selectCell(page, 1);
    await clickDenyButton(page);
    await waitForIdle(page);

    // Wait for the code to be reverted in cell 0
    await waitForCodeToBeWritten(page, 0);

    // Cell 0 should be reverted to its original content
    const codeInCell1 = await getCodeFromCell(page, 0);
    expect(codeInCell1).toContain('print("hello world")');
    expect(codeInCell1).not.toContain('x = 1');

    // Cell 1 should remain unchanged
    const codeInCell2 = await getCodeFromCell(page, 1);
    expect(codeInCell2).not.toContain('x = 1');
  });

  test('No Code blocks are displayed when active cell is empty', async ({ page }) => {
    // Don't need to do anything here, the beforeEach will create a new notebook with an empty cell

    await sendMessagetoAIChat(page, 'Add print (1)');

    // Since the active cell is empty, there should only be one code message part container.
    // It should be in the AI response message, which means that it is not in the user's message.
    const codeMessagePartContainersCount = await page.locator('.code-block-container').count();
    expect(codeMessagePartContainersCount).toBe(1);
  });

  test('Explain code button', async ({ page }) => {
    await updateCell(page, 0, ['print(1)'], true);

    await page.getByRole('button', { name: 'Explain code in AI Chat' }).click();
    await waitForIdle(page);
    await expect(page.locator('.message-assistant-chat')).toHaveCount(1);
  });

  test('Variable dropdown shows correct variables', async ({ page }) => {
    await updateCell(
      page,
      0,
      ['import pandas as pd', 'df=pd.DataFrame({"Apples": [1, 2, 3], "Bananas": [4, 5, 6]})'],
      true
    );

    await clickOnMitoAIChatTab(page);
    await startNewMitoAIChat(page);
    await page.locator('.chat-input').click();

    // The fill() command doesn't trigger input events that the dropdown relies on
    // So we need to type it character by character instead
    await page.keyboard.type("Edit column @ap");
    await expect.soft(page.locator('.chat-dropdown-item-name').filter({ hasText: 'Apples' })).toBeVisible();
    await expect(page.locator('.chat-dropdown-item-name').filter({ hasText: 'Bananas' })).not.toBeVisible();
  });

  test('Unserializable objects are handled correctly', async ({ page }) => {
    await updateCell(
      page,
      0,
      [
        'import pandas as pd',
        'timestamp_df = pd.DataFrame({"timestamp_col_A": [pd.to_datetime("2020-01-01"), pd.to_datetime("2020-01-02"), pd.to_datetime("2020-01-03")]}, dtype=object)',
        'none_type_df = pd.DataFrame({"none_type_col_A": [None, None, None]})'
      ],
      true
    );

    await waitForIdle(page);
    await clickOnMitoAIChatTab(page);
    await startNewMitoAIChat(page);

    // The fill() command doesn't trigger input events that the dropdown relies on
    // So we need to type it character by character instead
    await page.locator('.chat-input').click();

    await page.keyboard.type("@timestamp_df");
    await expect(page.locator('.chat-dropdown-item-name').filter({ hasText: 'timestamp_df' })).toBeVisible();
    await clearMitoAIChatInput(page);

    await page.keyboard.type("@timestamp_col_A");
    await expect(page.locator('.chat-dropdown-item-name').filter({ hasText: 'timestamp_col_A' })).toBeVisible();
    await clearMitoAIChatInput(page);

    await page.keyboard.type("@none_type_df");
    await expect(page.locator('.chat-dropdown-item-name').filter({ hasText: 'none_type_df' })).toBeVisible();
    await clearMitoAIChatInput(page);

    await page.keyboard.type("@none_type_col_A");
    await expect(page.locator('.chat-dropdown-item-name').filter({ hasText: 'none_type_col_A' })).toBeVisible();
  });
});

