import { expect, galata, test } from '@jupyterlab/galata';
import {
    createAndRunNotebookWithCells,
    waitForIdle,
} from '../jupyter_utils/jupyterlab_utils';
import {
    clickOnMitoAIChatTab,
    sendMessageToMitoAI,
} from './utils';

test.describe("Agent mode integration tests", () => {

    test.beforeEach(async ({ page }) => {
        /*
            Before each test, we switch to agent mode, and send a message. 
        */

        await createAndRunNotebookWithCells(page, []);
        await waitForIdle(page);

        await clickOnMitoAIChatTab(page);
        await waitForIdle(page);

        // Switch to agent mode
        await page.getByRole('button', { name: 'Chat ▾' }).click();
        await page.getByRole('button', { name: 'Agent' }).click();

        await sendMessageToMitoAI(page, "print hi");
        await waitForIdle(page);
    });

    test("Switch to agent mode, and send a message", async ({ page }) => {
        // It's hard to know exactly how many items will be in the agent's plan,
        // but we can assume there will be at least one message. 
        const messageCount = await page.locator('.message-assistant-agent').count();
        expect(messageCount).toBeGreaterThanOrEqual(1);
    })

    test("Edit message in agent's plan", async ({ page }) => {
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
        const numOfStepsInAgentsPlan = await page.locator('.message-assistant-agent').count();
        const startingNumOfChatMessages = await page.locator('.message-assistant-chat').count();

        // Run the plan of attack
        await page.getByRole('button', { name: 'Let\'s go!' }).click();

        // Wait for all chat messages to appear
        await page.waitForFunction(
            ([expectedCount, startingCount]) => {
                const currentCount = document.querySelectorAll('.message-assistant-chat').length;
                return currentCount === startingCount + expectedCount;
            },
            [numOfStepsInAgentsPlan, startingNumOfChatMessages]
        );

        const finalNumOfChatMessages = await page.locator('.message-assistant-chat').count();
        expect(finalNumOfChatMessages).toEqual(startingNumOfChatMessages + numOfStepsInAgentsPlan);
    });
});
