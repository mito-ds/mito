import { expect, test } from '@jupyterlab/galata';
import { createAndRunNotebookWithCells, getCodeFromCell, runCell, selectCell, typeInNotebookCell, waitForIdle, addNewCell } from '../jupyter_utils/jupyterlab_utils';
import { updateCellValue } from '../jupyter_utils/mitosheet_utils';
import { clearMitoAIChatInput, clickOnMitoAIChatTab, editMitoAIMessage, sendMessageToMitoAI, waitForMitoAILoadingToDisappear } from './utils';

const placeholderCellText = '# Empty code cell';
const acceptButtonSelector = '[class="code-block-accept-button"]';
const denyButtonSelector = '[class="code-block-deny-button"]'

test.describe.configure({ mode: 'parallel' });

test.describe('Mito AI Chat', () => {

  test.only('Preview and Accept AI Generated Code', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);

    await sendMessageToMitoAI(page, 'Write the code df["C"] = [7, 8, 9]');

    // No code diffs should be visible before the user clicks preview
    await expect(page.locator('.cm-codeDiffRemovedStripe')).not.toBeVisible();
    await expect(page.locator('.cm-codeDiffInsertedStripe')).not.toBeVisible();

    await page.getByRole('button', { name: 'Preview' }).click();
    await waitForIdle(page);

    // Code diffs should be visible after the user clicks preview
    await expect(page.locator('.cm-codeDiffRemovedStripe')).toBeVisible();
    await expect(page.locator('.cm-codeDiffInsertedStripe')).toBeVisible();

    await page.locator(acceptButtonSelector).click();
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 1);
    expect(code).toContain('df["C"] = [7, 8, 9]');
  });

  test('Reject AI Generated Code', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);

    await sendMessageToMitoAI(page, 'Write the code df["C"] = [7, 8, 9]');

    await page.getByRole('button', { name: 'Preview' }).click();
    await waitForIdle(page);

    await page.locator(denyButtonSelector).click();
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 1);
    expect(code).not.toContain('df["C"] = [7, 8, 9]');
    expect(code?.trim()).toBe("")
  });

  test('Edit Message', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);

    // Send the first message
    await sendMessageToMitoAI(page, 'Write the code df["C"] = [7, 8, 9]');
    await page.getByRole('button', { name: 'Preview' }).click();
    await waitForIdle(page);
    await page.locator(acceptButtonSelector).click();
    await waitForIdle(page);

    // Send the second message
    await sendMessageToMitoAI(page, 'Write the code df["D"] = [10, 11, 12]');
    await page.getByRole('button', { name: 'Preview' }).click();
    await waitForIdle(page);
    await page.locator(acceptButtonSelector).click();
    await waitForIdle(page);

    // Edit the first message
    await editMitoAIMessage(page, 'Write the code df["C_edited"] = [7, 8, 9]', 0);
    await page.getByRole('button', { name: 'Preview' }).click();
    await waitForIdle(page);
    await page.locator(acceptButtonSelector).click();
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 1);
    expect(code).toContain('df["C_edited"] = [7, 8, 9]');

    // Ensure previous messages are removed.
    const messageAssistantDivs = await page.locator('.message.message-assistant').count();
    expect(messageAssistantDivs).toBe(1);

    // Ensure you cannot edit the AI's messages by clicking the pencil icon or double clicking the message
    await expect(page.locator('.message-assistant .message-edit-button')).not.toBeVisible();
    await page.locator('.message-assistant p').last().dblclick();
    await expect(page.locator('.message-assistant').getByRole('button', { name: 'Save' })).not.toBeVisible();
  });

  test('Code diffs are automatically rejected before new messages are sent', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print("cell 0")']);
    await waitForIdle(page);

    // Send a first message in cell 1
    await sendMessageToMitoAI(page, 'Write the code x = 1');

    // Create a new cell w/o accepting the first message
    await addNewCell(page);

    // Send a second message in cell 2
    await sendMessageToMitoAI(page, 'Write the code x = 2');
    await page.getByRole('button', { name: 'Preview' }).click();
    await waitForIdle(page);
    await page.locator(acceptButtonSelector).click();
    await waitForIdle(page);


    const codeInCell1 = await getCodeFromCell(page, 1);
    expect(codeInCell1).not.toContain('x = 1'); // First msg should be auto-rejected

    const codeInCell2 = await getCodeFromCell(page, 2);
    expect(codeInCell2).toContain('x = 2');
    expect(codeInCell2).not.toContain('x = 1'); // Make sure the first msg does not show up in the second cell
  });

  test('Accept code from a different cell', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1)']);
    await waitForIdle(page);

    // Send the first message
    await sendMessageToMitoAI(page, 'Write the code x = 1');

    // Create a new cell w/o accepting the first message
    await addNewCell(page);

    // Type/run new cell
    await typeInNotebookCell(page, 2, '# this should not be overwritten', true);

    // Accept the first message
    await page.getByRole('button', { name: 'Preview' }).click();
    await waitForIdle(page);
    await page.locator(acceptButtonSelector).click();
    await waitForIdle(page);

    const codeInCell1 = await getCodeFromCell(page, 1);
    expect(codeInCell1).toContain('x = 1');

    const codeInCell2 = await getCodeFromCell(page, 2);
    expect(codeInCell2).not.toContain('x = 1');
    expect(codeInCell2).toContain('# this should not be overwritten');
  });

  test('Reject code from a different cell', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1)']);
    await waitForIdle(page);

    // Send the first message
    await sendMessageToMitoAI(page, 'Write the code x = 1');

    // Create a new cell w/o accepting the first message
    await addNewCell(page);

    // Type/run new cell
    await typeInNotebookCell(page, 2, '# this should not be overwritten', true);

    // Reject the first message
    await page.getByRole('button', { name: 'Preview' }).click();
    await waitForIdle(page);
    await page.locator(denyButtonSelector).click();
    await waitForIdle(page);

    const codeInCell1 = await getCodeFromCell(page, 1);
    expect(codeInCell1).not.toContain('x = 1');

    const codeInCell2 = await getCodeFromCell(page, 2);
    expect(codeInCell2).not.toContain('x = 1');
    expect(codeInCell2).toContain('# this should not be overwritten');
  });

  test('No Code blocks are displayed when active cell is empty', async ({ page }) => {
    await createAndRunNotebookWithCells(page, []);
    await waitForIdle(page);

    await sendMessageToMitoAI(page, 'Add print (1)');

    // Since the active cell is empty, there should only be one code message part container.
    // It should be in the AI response message, which means that it is not in the user's message.
    const codeMessagePartContainersCount = await page.locator('.code-message-part-container').count();
    expect(codeMessagePartContainersCount).toBe(1);
  });

  test('Test fix error button', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(3']);
    await waitForIdle(page);

    await page.getByRole('button', { name: 'Fix Error in AI Chat' }).click();
    await waitForIdle(page);
    await expect(page.locator('.message-assistant')).toHaveCount(1);
  });

  test('Errors have fix with AI button', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1']);
    await waitForIdle(page);

    await page.getByRole('button', { name: 'Fix Error in AI Chat' }).click();
    await waitForIdle(page);

    await waitForMitoAILoadingToDisappear(page);

    // No code diffs should be visible before the user clicks preview
    await expect(page.locator('.cm-codeDiffRemovedStripe')).not.toBeVisible();
    await expect(page.locator('.cm-codeDiffInsertedStripe')).not.toBeVisible();

    await page.getByRole('button', { name: 'Preview' }).click();
    await waitForIdle(page);

    await page.locator(acceptButtonSelector).click();
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 0);
    expect(code).toContain('print(1)');
  });

  test('Code cells have Explain Code button', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1)']);
    await waitForIdle(page);

    await selectCell(page, 0);
    await page.getByRole('button', { name: 'Explain code in AI Chat' }).click();

    // Check that the message "Explain this code" exists in the AI chat
    await expect(page.getByText('Explain this code')).toBeVisible();

  });

  test('Test explain code button', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1)']);
    await waitForIdle(page);

    await page.getByRole('button', { name: 'Explain code in AI Chat' }).click();
    await waitForIdle(page);
    await expect(page.locator('.message-assistant')).toHaveCount(1);
  });

  test('Variable dropdown shows correct variables', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"Apples": [1, 2, 3], "Bananas": [4, 5, 6]})']);
    await waitForIdle(page);

    await clickOnMitoAIChatTab(page);

    // The fill() command doesn't trigger input events that the dropdown relies on
    // So we need to type it character by character instead
    await page.locator('.chat-input').click();
    await page.keyboard.type("Edit column @ap");
    await expect(page.locator('.chat-dropdown-item-name').filter({ hasText: 'Apples' })).toBeVisible();
    await expect(page.locator('.chat-dropdown-item-name').filter({ hasText: 'Bananas' })).not.toBeVisible();
  });

  test('Unserializable objects are handled correctly', async ({ page }) => {
    await createAndRunNotebookWithCells(
      page,
      [
        '\nimport pandas as pd',
        'timestamp_df = pd.DataFrame({"timestamp_col_A": [pd.to_datetime("2020-01-01"), pd.to_datetime("2020-01-02"), pd.to_datetime("2020-01-03")]}, dtype=object)',
        'none_type_df = pd.DataFrame({"none_type_col_A": [None, None, None]})'
      ]
    );

    await waitForIdle(page);
    await clickOnMitoAIChatTab(page);

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

