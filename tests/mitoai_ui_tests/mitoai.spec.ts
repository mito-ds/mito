/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@jupyterlab/galata';
import { 
  createAndRunNotebookWithCells, 
  getCodeFromCell, 
  runCell, 
  selectCell, 
  typeInNotebookCell, 
  waitForIdle, 
  addNewCell
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
  turnOnChatMode
} from './utils';

test.describe.parallel('Mito AI Chat', () => {

  test('AI Chat should open on Jupyter Launch', async ({ page }) => {

    await createAndRunNotebookWithCells(page, []);
    await waitForIdle(page);

    // Expect the AI Chat is open
    // Locate the "Clear the chat history" button
    const clearButton = page.locator('button[title="Start New Chat"]');
    expect(clearButton).toBeVisible()
  
  })

  test('Preview and Accept AI Generated Code', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);

    await startNewMitoAIChat(page);

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
    await createAndRunNotebookWithCells(page, ['import pandas as pd', 'df=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);

    await sendMessagetoAIChat(page, 'Write the code df["C"] = [7, 8, 9]');

    await clickPreviewButton(page);
    await page.waitForTimeout(1000);

    expect(page.locator('.jp-cell-toolbar').getByRole('button', { name: 'Accept' })).toBeVisible();

    await clickAcceptButton(page, { useCellToolbar: true });
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 2);
    expect(code).toContain('df["C"] = [7, 8, 9]');
  });

  test('Reject AI Generated Code', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);
    
    await startNewMitoAIChat(page);

    await sendMessagetoAIChat(page, 'Write the code df["C"] = [7, 8, 9]');

    await clickPreviewButton(page);
    await clickDenyButton(page);
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 1);
    expect(code).not.toContain('df["C"] = [7, 8, 9]');
    expect(code?.trim()).toBe("")
  });

  test("Reject using cell toolbar button", async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd', 'df=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);

    await sendMessagetoAIChat(page, 'Write the code df["C"] = [7, 8, 9]');

    await clickPreviewButton(page);
    await page.waitForTimeout(1000);

    expect(page.locator('.jp-cell-toolbar').getByRole('button', { name: 'Reject' })).toBeVisible();

    await clickDenyButton(page, { useCellToolbar: true });
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 2);
    expect(code).not.toContain('df["C"] = [7, 8, 9]');
    expect(code?.trim()).toBe("")
  });

  test('Edit Message', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);

    await startNewMitoAIChat(page);

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

    // Ensure you cannot edit the AI's messages by clicking the pencil icon or double clicking the message
    await expect(page.locator('.message-assistant-chat .message-start-editing-button')).not.toBeVisible();
    await page.locator('.message-assistant-chat p').last().dblclick();
    await expect(page.locator('.message-assistant-chat').getByRole('button', { name: 'Save' })).not.toBeVisible();
  });

  test('Code diffs are automatically rejected before new messages are sent', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print("cell 0")']);
    await waitForIdle(page);

    await startNewMitoAIChat(page);

    // Send a first message in cell 1
    await sendMessagetoAIChat(page, 'Write the code x = 1');

    // Create a new cell w/o accepting the first message
    await addNewCell(page);

    // Send a second message in cell 2
    await sendMessagetoAIChat(page, 'Write the code x = 2');
    await clickPreviewButton(page);
    await clickAcceptButton(page);
    await waitForIdle(page);


    const codeInCell1 = await getCodeFromCell(page, 1);
    expect(codeInCell1).not.toContain('x = 1'); // First msg should be auto-rejected

    const codeInCell2 = await getCodeFromCell(page, 2);
    expect(codeInCell2).toContain('x = 2');
    expect(codeInCell2).not.toContain('x = 1'); // Make sure the first msg does not show up in the second cell
  });

  test('Always write code to the preview cell', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print("hello world")', '# this should not be overwritten']);
    await waitForIdle(page);

    // Send the first message with the first cell active
    selectCell(page, 0);
    await sendMessagetoAIChat(page, 'Write the code x = 1');

    // Preview the changes
    await clickPreviewButton(page);

    // Select the second cell and accept the changes
    selectCell(page, 1);
    await clickAcceptButton(page);
    await waitForIdle(page);

    const codeInCell1 = await getCodeFromCell(page, 0);
    expect(codeInCell1).toContain('x = 1');

    const codeInCell2 = await getCodeFromCell(page, 1);
    expect(codeInCell2).not.toContain('x = 1');
    expect(codeInCell2).toContain('# this should not be overwritten');
  });

  test('Reject reverts preview cell to original code', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print("hello world")', '# this should not be overwritten']);
    await waitForIdle(page);

    // Send the first message with the first cell active
    selectCell(page, 0);
    await sendMessagetoAIChat(page, 'Write the code x = 1');

    // Preview the changes
    await clickPreviewButton(page);

    // Select the second cell and accept the changes
    selectCell(page, 1);
    await clickDenyButton(page);
    await waitForIdle(page);

    const codeInCell1 = await getCodeFromCell(page, 0);
    expect(codeInCell1).toContain('print("hello world")');
    expect(codeInCell1).not.toContain('x = 1');

    const codeInCell2 = await getCodeFromCell(page, 1);
    expect(codeInCell2).not.toContain('x = 1');
    expect(codeInCell2).toContain('# this should not be overwritten');
  });

  test('No Code blocks are displayed when active cell is empty', async ({ page }) => {
    await createAndRunNotebookWithCells(page, []);
    await waitForIdle(page);

    await startNewMitoAIChat(page);

    await sendMessagetoAIChat(page, 'Add print (1)');

    // Since the active cell is empty, there should only be one code message part container.
    // It should be in the AI response message, which means that it is not in the user's message.
    const codeMessagePartContainersCount = await page.locator('.code-block-container').count();
    expect(codeMessagePartContainersCount).toBe(1);
  });

  test('Fix error button', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1']);
    await waitForIdle(page);

    await page.getByRole('button', { name: 'Fix Error in AI Chat' }).click();
    await waitForIdle(page);

    await waitForMitoAILoadingToDisappear(page);

    // Ensure the chat input is not focussed on 
    await expect(page.locator('.chat-input')).not.toBeFocused();

    // No code diffs should be visible before the user clicks preview
    await expect(page.locator('.cm-codeDiffRemovedStripe')).not.toBeVisible();
    await expect(page.locator('.cm-codeDiffInsertedStripe')).not.toBeVisible();

    await clickPreviewButton(page);

    await clickAcceptButton(page);
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 0);
    expect(code).toContain('print(1)');
  });

  test('No fix error button for warnings', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import warnings', 'warnings.warn("This is a warning")']);
    await waitForIdle(page);

    // Ensure that the "Fix Error in AI Chat" button is not visible
    expect(page.getByRole('button', { name: 'Fix Error in AI Chat' })).not.toBeVisible();
  });

  test('Explain code button', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1)']);
    await waitForIdle(page);

    await selectCell(page, 0);

    await page.getByRole('button', { name: 'Explain code in AI Chat' }).click();
    await waitForIdle(page);
    await expect(page.locator('.message-assistant-chat')).toHaveCount(1);
  });

  test('Variable dropdown shows correct variables', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"Apples": [1, 2, 3], "Bananas": [4, 5, 6]})']);
    await waitForIdle(page);

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
    await createAndRunNotebookWithCells(
      page,
      [
        'import pandas as pd',
        'timestamp_df = pd.DataFrame({"timestamp_col_A": [pd.to_datetime("2020-01-01"), pd.to_datetime("2020-01-02"), pd.to_datetime("2020-01-03")]}, dtype=object)',
        'none_type_df = pd.DataFrame({"none_type_col_A": [None, None, None]})'
      ]
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

  test('Active cell preview is displayed and updated when active cell changes', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1)', 'print(2)']);
    await waitForIdle(page);

    await selectCell(page, 0);

    await clickOnMitoAIChatTab(page);
    await startNewMitoAIChat(page);

    // Turn on chat mode
    await turnOnChatMode(page);

    // The active cell preview should not be visible before the user focusses on the chat input
    await expect.soft(page.locator('.active-cell-preview-container')).not.toBeVisible();
    
    // The active cell preview should show the code from the first cell
    await page.locator('.chat-input').fill('Test');

    // Wait for half a second for the cell preview to update
    await page.waitForTimeout(500);
    
    const activeCellPreview = await page.locator('.active-cell-preview-container').textContent();
    expect.soft(activeCellPreview).toContain('print(1)');

    // After changing the selected cell, the active cell preview should update
    await selectCell(page, 1);
    // Wait for half a second for the cell preview to update
    await page.waitForTimeout(500);

    const activeCellPreview2 = await page.locator('.active-cell-preview-container').textContent();
    expect.soft(activeCellPreview2).toContain('print(2)');

    await page.locator('.chat-input').fill('print hello world');
    await page.keyboard.press('Enter');
    await waitForMitoAILoadingToDisappear(page);

    // After sending the message, the active cell preview should disappear
    expect(page.locator('.active-cell-preview-container')).not.toBeVisible();
  });
});

test.describe.serial('Mito AI Chat - Restore history', () => {
  test('Restore message history', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1)']);
    await waitForIdle(page);

    await selectCell(page, 0);

    await sendMessagetoAIChat(page, 'print(2)');
    await waitForIdle(page);
    
    // As you have a notebook opened, at reload a dialog shows up to 
    // select the kernel for the notebook. The dialog prevent all the tests 
    // carried out at page load to be performed as it capture the focus.
    // One way around it is to set the option waitForIsReady (specific to JupyterLab):
    // When that option is set, we don't wait for addition checks specific to JupyterLab
    await page.reload({waitForIsReady: false});
    await Promise.all([
      page.getByRole('button', { name: 'Select Kernel' }).click(),
      waitForIdle(page)
    ]);

    // 1 from the previous message, 1 for the new chat input since we use
    // the message-user class on the chat input also
    await expect(page.locator('.message-user')).toHaveCount(2); 
    await expect(page.locator('.message-assistant-chat')).toHaveCount(1);
  });
});