import { IJupyterLabPageFixture } from "@jupyterlab/galata";
import { selectCell } from "../jupyter_utils/jupyterlab_utils";

export const waitForMitoAILoadingToDisappear = async (page: IJupyterLabPageFixture) => {
    const mitoAILoadingLocator = page.locator('.chat-loading-message');
    await mitoAILoadingLocator.waitFor({ state: 'hidden' });
}

export const sendMessageToMitoAI = async (
    page: IJupyterLabPageFixture,
    message: string,
    activeCellIndex?: number
) => {
    if (activeCellIndex) {
        await selectCell(page, activeCellIndex);
    }
    // Click the AI Chat tab if it's not already selected
    const aiChatTab = await page.getByRole('tab', { name: 'AI Chat for your JupyterLab' });
    const isSelected = await aiChatTab.getAttribute('aria-selected');
    if (isSelected !== 'true') {
        await aiChatTab.getByRole('img').click();
    }
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