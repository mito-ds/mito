import { expect, test } from '@jupyterlab/galata';
import { createAndRunNotebookWithCells, getCodeFromCell, runCell, selectCell, typeInNotebookCell, waitForIdle } from '../jupyter_utils/jupyterlab_utils';
import { updateCellValue } from '../jupyter_utils/mitosheet_utils';
import { editMitoAIMessage, sendMessageToMitoAI, waitForMitoAILoadingToDisappear } from './utils';
const placeholderCellText = '# Empty code cell';

test.describe.configure({ mode: 'parallel' });

test.describe('Mito AI Chat', () => {

  test('Apply AI Generated Code', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);

    await sendMessageToMitoAI(page, 'Write the code df["C"] = [7, 8, 9]');

    await page.getByRole('button', { name: 'Apply' }).click();
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 1);
    expect(code).toContain('df["C"] = [7, 8, 9]');
  });

  test('Reject AI Generated Code', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})']);
    await waitForIdle(page);

    await sendMessageToMitoAI(page, 'Write the code df["C"] = [7, 8, 9]');

    await page.getByRole('button', { name: 'Deny' }).click();
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
    await page.getByRole('button', { name: 'Apply' }).click();
    await waitForIdle(page);

    // Send the second message
    await sendMessageToMitoAI(page, 'Write the code df["D"] = [10, 11, 12]');
    await page.getByRole('button', { name: 'Apply' }).click();
    await waitForIdle(page);

    // Edit the first message
    await editMitoAIMessage(page, 'Write the code df["C_edited"] = [7, 8, 9]', 0);
    await page.getByRole('button', { name: 'Apply' }).click();
    await waitForIdle(page);

    const code = await getCodeFromCell(page, 1);
    expect(code).toContain('df["C_edited"] = [7, 8, 9]');

    // Ensure previous messages are removed.
    const messageAssistantDivs = await page.locator('.message.message-assistant').count();
    expect(messageAssistantDivs).toBe(1);
  });

  test('Code Diffs are applied', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1)']);
    await waitForIdle(page);

    await sendMessageToMitoAI(page, 'Remove the code print(1) and add the code print(2)', 0);

    await expect(page.locator('.cm-codeDiffRemovedStripe')).toBeVisible();
    await expect(page.locator('.cm-codeDiffInsertedStripe')).toBeVisible();
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

  test('Errors have fix with AI button', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1']);
    await waitForIdle(page);

    await page.getByRole('button', { name: 'Fix Error in AI Chat' }).click();
    await waitForIdle(page);

    await waitForMitoAILoadingToDisappear(page);

    await page.getByRole('button', { name: 'Apply' }).click();
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

  test.only('Fix Error and Explain code buttons clear chat history', async ({ page }) => {
    await createAndRunNotebookWithCells(page, ['print(1)']);
    await waitForIdle(page);

    await sendMessageToMitoAI(page, 'Write the code print(2)');
    await page.getByRole('button', { name: 'Apply' }).click();
    runCell(page, 1)

    await typeInNotebookCell(page, 2, 'print(3', true)
    await waitForIdle(page);

    await page.getByRole('button', { name: 'Fix Error in AI Chat' }).click();
    await waitForIdle(page);

    const messageCount = await page.locator('.message').count();
    expect(messageCount).toBe(2);

    await page.getByRole('button', { name: 'Explain code in AI Chat' }).click();
    await waitForIdle(page);

    const newMessageCount = await page.locator('.message').count();
    expect(newMessageCount).toBe(2);
  });
});

