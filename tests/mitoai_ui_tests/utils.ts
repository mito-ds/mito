/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, IJupyterLabPageFixture } from "@jupyterlab/galata";
import { getCodeFromCell, selectCell, waitForIdle } from "../jupyter_utils/jupyterlab_utils";

export const waitForMitoAILoadingToDisappear = async (page: IJupyterLabPageFixture) => {
    const mitoAILoadingLocator = page.locator('.chat-loading-message');
    await mitoAILoadingLocator.waitFor({ state: 'hidden' });

    await page.waitForTimeout(1000);
}

export const waitForAgentToFinish = async (page: IJupyterLabPageFixture) => {
    const agentStopButton = page.locator('.stop-agent-button');
    await agentStopButton.waitFor({state: 'hidden'})
}

export const clickOnMitoAIChatTab = async (page: IJupyterLabPageFixture) => {
    await page.waitForTimeout(1000);

    // Click the AI Chat tab if it's not already selected
    const aiChatTab = await page.getByRole('tab', { name: 'AI Chat for your JupyterLab' });
    const isSelected = await aiChatTab.getAttribute('aria-selected');
    if (isSelected !== 'true') {
        await aiChatTab.getByRole('img').click();
    }
    await page.waitForTimeout(1000);
}

export const closeMitoAIChat = async (page: IJupyterLabPageFixture) => {
    await page.waitForTimeout(1000);

    // Close the Mito AI chat if it's open
    const aiChat = page.locator('.chat-taskpane');
    if (await aiChat.isVisible()) {
        const aiChatTab = page.getByRole('tab', { name: 'AI Chat for your JupyterLab' });
        await aiChatTab.click();
    }
    await page.waitForTimeout(1000);
    await waitForIdle(page);
}

export const clearMitoAIChatInput = async (page: IJupyterLabPageFixture) => {
    await page.locator('.chat-input').fill('');
}

export const startNewMitoAIChat = async (page: IJupyterLabPageFixture) => {
    await waitForIdle(page);

    // Open the Mito AI chat tab
    await clickOnMitoAIChatTab(page);
  
    // Locate the "Clear the chat history" button
    const clearButton = page.locator('button[title="Start New Chat"]');
    
    // Wait for the button to be visible, then click
    await clearButton.waitFor({ state: 'visible' });
    await clearButton.click();
  
    // Wait for the extension to return to idle
    await waitForIdle(page);
    await page.waitForTimeout(1000);
  };

export const sendMessagetoAIChat = async (
    page: IJupyterLabPageFixture,
    message: string,
    activeCellIndex?: number,
    doNotWaitForLoading?: boolean
) => {  
    await clickOnMitoAIChatTab(page);
    await turnOnChatMode(page);
    await _sendMessageToMitoAI(page, message, activeCellIndex, doNotWaitForLoading);
}

export const sendMessageToAgent = async (
    page: IJupyterLabPageFixture,
    message: string,
    doNotWaitForLoading?: boolean
) => {
    await clickOnMitoAIChatTab(page);
    await turnOnAgentMode(page);
    await _sendMessageToMitoAI(page, message, undefined, doNotWaitForLoading);
}

export const _sendMessageToMitoAI = async (
    page: IJupyterLabPageFixture,
    message: string,
    activeCellIndex?: number,
    doNotWaitForLoading?: boolean
) => {
    if (activeCellIndex) {
        await selectCell(page, activeCellIndex);
    }
    await clickOnMitoAIChatTab(page);
    // Fill in the message and send it
    await page.locator('.chat-input').fill(message);
    await page.keyboard.press('Enter');
    if (!doNotWaitForLoading) {
        await waitForMitoAILoadingToDisappear(page);
    }
}

export const editMitoAIMessage = async (
    page: IJupyterLabPageFixture,
    message: string,
    messageIndex: number,
    activeCellIndex?: number
) => {
    if (activeCellIndex) {
        await selectCell(page, activeCellIndex);
    }
    const messageLocator = page.locator('.message').nth(messageIndex);
    await messageLocator.getByRole('button', { name: 'Edit message' }).click();
    await page.getByPlaceholder('Edit your message').fill(message);
    await page.keyboard.press('Enter');
    await waitForMitoAILoadingToDisappear(page);
}

export const clickPreviewButton = async (page: IJupyterLabPageFixture) => {
    await page.locator('.chat-message-buttons').getByRole('button', { name: 'Overwrite Active Cell' }).click();
    await waitForIdle(page);
}

export const clickAcceptButton = async (
    page: IJupyterLabPageFixture,
    // Express the useCellToolbar option like this so that they are keyword arguments in the tests
    // and are therefore easy to read!  
    { useCellToolbar = false }: { useCellToolbar?: boolean } = {useCellToolbar: false}
) => {
    if (useCellToolbar) {
        await page.locator('.jp-ToolbarButtonComponent-label').filter({ hasText: 'Accept' }).click();
    } else {
        await page.locator('.chat-message-buttons').getByRole('button', { name: 'Accept code' }).click();
    }
    await waitForIdle(page);
}

export const clickDenyButton = async (
    page: IJupyterLabPageFixture,
    // Express the useCellToolbar option like this so that they are keyword arguments in the tests
    // and are therefore easy to read!  
    { useCellToolbar = false }: { useCellToolbar?: boolean } = {useCellToolbar: false}
) => {
    if (useCellToolbar) {
        await page.locator('.jp-ToolbarButtonComponent-label').filter({ hasText: 'Reject' }).click();
    } else {
        await page.locator('.chat-message-buttons').getByRole('button', { name: 'Reject code' }).click();
    }
    await waitForIdle(page);
}

export const turnOnAgentMode = async (page: IJupyterLabPageFixture) => {
    await page.locator('.toggle-button-container').getByRole('button', { name: 'Agent' }).click();
    await waitForIdle(page);
}

export const turnOnChatMode = async (page: IJupyterLabPageFixture) => {
    await page.locator('.toggle-button-container').getByRole('button', { name: 'Chat' }).click();
    await waitForIdle(page);
}

export const getNotebookCode = async (page: IJupyterLabPageFixture): Promise<string[]> => {
    // Get count of cells in the notebook
    const cellCount = await page.locator('.jp-Cell').count();

    // Get code from every cell in the notebook
    const codeFromCells: string[] = [];
    for (let i = 0; i < cellCount; i++) {
        const code = await getCodeFromCell(page, i);
        if (code) {
            codeFromCells.push(code);
        }
    }
    return codeFromCells
}

export const selectModel = async (page: IJupyterLabPageFixture, modelName: string) => {
    // Try both selectors for the model dropdown
    const modelSelector = page.getByTestId('model-selector')
    await modelSelector.click();
    await page.waitForTimeout(1000);
    await page.getByText(modelName).click();
    await waitForIdle(page);
}


