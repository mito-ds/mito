import { expect, IJupyterLabPageFixture } from "@jupyterlab/galata";
import { selectCell, waitForIdle } from "../jupyter_utils/jupyterlab_utils";

export const waitForMitoAILoadingToDisappear = async (page: IJupyterLabPageFixture) => {
    const mitoAILoadingLocator = page.locator('.chat-loading-message');
    await mitoAILoadingLocator.waitFor({ state: 'hidden' });
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

export const sendMessageToMitoAI = async (
    page: IJupyterLabPageFixture,
    message: string,
    activeCellIndex?: number
) => {
    if (activeCellIndex) {
        await selectCell(page, activeCellIndex);
    }
    await clickOnMitoAIChatTab(page);
    // Fill in the message and send it
    await page.locator('.chat-input').fill(message);
    await page.keyboard.press('Enter');
    await waitForMitoAILoadingToDisappear(page);
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


