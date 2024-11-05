import { IJupyterLabPageFixture } from "@jupyterlab/galata";
import { selectCell, waitForIdle } from "../jupyter_utils/jupyterlab_utils";

export const waitForMitoAILoadingToDisappear = async (page: IJupyterLabPageFixture) => {
    const mitoAILoadingLocator = page.locator('.chat-loading-message');
    await mitoAILoadingLocator.waitFor({ state: 'hidden' });
}

export const sendMessageToMitoAI = async (page: IJupyterLabPageFixture, message: string, activeCellIndex?: number) => {
    if (activeCellIndex) {
        await selectCell(page, activeCellIndex);
    }
    await page.getByRole('tab', { name: 'AI Chat for your JupyterLab' }).getByRole('img').click();
    await page.getByPlaceholder('Ask your personal Python').fill(message);
    await page.keyboard.press('Enter');
    await waitForMitoAILoadingToDisappear(page);
}

export const sendAndEditMitoAIMessage = async (page: IJupyterLabPageFixture, initialMessage: string, editedMessage: string, activeCellIndex?: number) => {
    await sendMessageToMitoAI(page, initialMessage, activeCellIndex);

    // Apply inital code suggestion
    await page.getByRole('button', { name: 'Apply' }).click();
    await waitForIdle(page);

    // Edit message
    await page.locator('.message-edit-button').click();
    await page.locator('.message-edit-textarea').fill(editedMessage);
    await page.keyboard.press('Enter');
    await waitForMitoAILoadingToDisappear(page);
}