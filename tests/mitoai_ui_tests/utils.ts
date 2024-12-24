import { IJupyterLabPageFixture } from "@jupyterlab/galata";
import { selectCell, waitForIdle } from "../jupyter_utils/jupyterlab_utils";

export const waitForMitoAILoadingToDisappear = async (page: IJupyterLabPageFixture) => {
    const mitoAILoadingLocator = page.locator('.chat-loading-message');
    await mitoAILoadingLocator.waitFor({ state: 'hidden' });
}

export const clickOnMitoAIChatTab = async (page: IJupyterLabPageFixture) => {
    // Click the AI Chat tab if it's not already selected
    const aiChatTab = await page.getByRole('tab', { name: 'AI Chat for your JupyterLab' });
    const isSelected = await aiChatTab.getAttribute('aria-selected');
    if (isSelected !== 'true') {
        await aiChatTab.getByRole('img').click();
    }
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
    await page.getByRole('button', { name: 'Overwrite Active Cell' }).click();
    await page.waitForTimeout(3000);
    await waitForIdle(page);
}

export const clickAcceptButtonInTaskpane = async (
    page: IJupyterLabPageFixture, 
) => {
    await page.locator('.chat-taskpane').getByRole('button', { name: 'Accept code' }).click();
    await waitForIdle(page);
}

export const clickAcceptButtonInCellToolbar = async (
    page: IJupyterLabPageFixture, 
    cellIndex: number
) => {
    await page.waitForTimeout(3000);
    await page.notebook.leaveCellEditingMode(cellIndex);
    const cellToolbar = await page.locator('.jp-cell-toolbar');
    await cellToolbar.getByRole('button', { name: 'Accept code' }).click();
    await waitForIdle(page);
}

export const clickDenyButton = async (
    page: IJupyterLabPageFixture,
    // Express the useCellToolbar option like this so that they are keyword arguments in the tests
    // and are therefore easy to read!  
    { useCellToolbar = false }: { useCellToolbar?: boolean } = {useCellToolbar: false}
) => {
    if (useCellToolbar) {
        // sleep for 1 second to make sure the cell toolbar is visible
        await page.waitForTimeout(3000);
        await page.locator('.jp-cell-toolbar').getByRole('button', { name: 'Reject code' }).click();
    } else {
        await page.locator('.chat-taskpane').getByRole('button', { name: 'Reject code' }).click();
    }
    await waitForIdle(page);
}