import { expect, galata, test } from '@jupyterlab/galata';
import { sendMessageToMitoAI } from './utils';
import { createAndRunNotebookWithCells } from '../jupyter_utils/jupyterlab_utils';
import { waitForIdle } from '../jupyter_utils/jupyterlab_utils';
import { clickOnMitoAIChatTab } from './utils';

test.describe("Agent mode integration test", () => {

    test.beforeEach(async ({ page }) => {
        /*
            Before each test, we switch to agent mode, and send a message. 
        */

        await createAndRunNotebookWithCells(page, []);
        await waitForIdle(page);

        await clickOnMitoAIChatTab(page);
        await waitForIdle(page);

        await page.getByRole('button', { name: 'Chat ▾' }).click();
        await page.getByRole('button', { name: 'Agent' }).click();

        await sendMessageToMitoAI(page, "print hi");
        await waitForIdle(page);
    });

    test.only("Switch to agent mode, and send a message", async ({ page }) => {
        // It's hard to know exactly how many items will be in the agent's plan,
        // but we can assume there will be at least one message. 
        const messageCount = await page.locator('.message-assistant-agent').count();
        expect(messageCount).toBeGreaterThanOrEqual(1);
    })

    test.only("Edit message in agent's plan", async ({ page }) => {
        const newMessage = "print bye";

        // Get the last agent message, and click on it's edit button 
        const lastAgentMessage = await page.locator('.message-assistant-agent').last();
        await lastAgentMessage.locator('.message-edit-button').click();

        // Edit the message
        await page.locator('.chat-input').fill(newMessage);
        await page.keyboard.press('Enter');

        const lastAgentMessageContent = await lastAgentMessage.textContent();
        expect(lastAgentMessageContent).toContain(newMessage);
    });

    test.only("Run agent's plan", async ({ page }) => {
        // Run the plan of attack
        await page.getByRole('button', { name: 'Let\'s go!' }).click();
        await waitForIdle(page);
    });
});