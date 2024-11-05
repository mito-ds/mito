import { IJupyterLabPageFixture } from "@jupyterlab/galata";
import { selectCell } from "../jupyter_utils/jupyterlab_utils";

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