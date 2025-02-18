import { expect, galata, test } from '@jupyterlab/galata';
import {
    createAndRunNotebookWithCells,
    getCodeFromCell,
    waitForIdle,
} from '../jupyter_utils/jupyterlab_utils';
import {
    clickOnMitoAIChatTab,
    clickPreviewButton,
    clickAcceptButton,
    sendMessageToMitoAI,
    editMitoAIMessage,
} from './utils';

const AGENT_PLAN_SUBMIT_BUTTON_TEXT = 'Let\'s go!';

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

    test("Edit original message", async ({ page }) => {
        const newMessage = "print bye";

        // Keep track of the original messages in the agent's plan.
        const oldPlanMessages: string[] = [];
        const messages = await page.locator('.message-assistant-agent').all();
        messages.forEach(async (message) => {
            const messageText = await message.textContent();
            if (messageText) {
                oldPlanMessages.push(messageText);
            }
        });

        // Edit the message
        await editMitoAIMessage(page, newMessage, 0);
        await waitForIdle(page);

        // Track new plan.  
        const newPlanMessages: string[] = [];
        const newMessages = await page.locator('.message-assistant-agent').all();
        newMessages.forEach(async (message) => {
            const messageText = await message.textContent();
            if (messageText) {
                newPlanMessages.push(messageText);
            }
        });
        
        // By editing the original agent message, we should see a new plan
        // and the old plan messages should be wiped. 
        oldPlanMessages.forEach(message => {
            expect(newPlanMessages).not.toContain(message);
        });
    });

    test("Edit message in agent's plan", async ({ page }) => {
        const newMessage = "print bye";

        // Get the last agent message, and click on it's edit button 
        const lastAgentMessage = await page.locator('.message-assistant-agent').last();
        await lastAgentMessage.locator('.message-start-editing-button').click();

        // Make sure the active cell preview is not visible
        await expect(page.locator('.active-cell-preview-container')).not.toBeVisible();

        // Edit the message
        await page.locator('.chat-input').fill(newMessage);
        await page.keyboard.press('Enter');

        const lastAgentMessageContent = await lastAgentMessage.textContent();
        expect(lastAgentMessageContent).toContain(newMessage);
    });

    test("Run agent's plan", async ({ page }) => {
        const numOfStepsInAgentsPlan = await page.locator('.message-assistant-agent').count();
        const startingNumOfChatMessages = await page.locator('.message-assistant-chat').count();

        // Run the plan of attack
        await page.getByRole('button', { name: AGENT_PLAN_SUBMIT_BUTTON_TEXT }).click();

        // Wait for all chat messages to appear
        await page.waitForFunction(
            ([expectedCount, startingCount]) => {
                const currentCount = document.querySelectorAll('.message-assistant-chat').length;
                return currentCount === startingCount + expectedCount;
            },
            [numOfStepsInAgentsPlan, startingNumOfChatMessages]
        );

        // Ensure all steps in the agent's plan have been executed
        const finalNumOfChatMessages = await page.locator('.message-assistant-chat').count();
        expect(finalNumOfChatMessages).toEqual(startingNumOfChatMessages + numOfStepsInAgentsPlan);

        // Extract code snippets from chat messages
        const codeSnippetsFromChatMessages = await page.$$eval('.code-block-python-code pre code', elements => {
            return elements.map(element => {
                // Remove any HTML tags and combine text content
                return element.textContent?.replace(/\s+/g, ' ').trim() || '';
            });
        });

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

        // Ensure all code snippets are in the notebook
        codeSnippetsFromChatMessages.forEach(codeSnippet => {
            expect(codeFromCells).toContain(codeSnippet);
        });
    });

    test("Run agent's plan then send a follow up chat message", async ({ page }) => {
        const numOfStepsInAgentsPlan = await page.locator('.message-assistant-agent').count();
        const startingNumOfChatMessages = await page.locator('.message-assistant-chat').count();

        // Run the plan of attack
        await page.getByRole('button', { name: AGENT_PLAN_SUBMIT_BUTTON_TEXT }).click();

        // Wait for all chat messages to appear
        await page.waitForFunction(
            ([expectedCount, startingCount]) => {
                const currentCount = document.querySelectorAll('.message-assistant-chat').length;
                return currentCount === startingCount + expectedCount;
            },
            [numOfStepsInAgentsPlan, startingNumOfChatMessages]
        );

        // Send a follow up chat message
        await sendMessageToMitoAI(page, "print bye");
        await waitForIdle(page);

        // Accept the follow up chat message
        await clickPreviewButton(page);
        await clickAcceptButton(page, { useCellToolbar: true });
        await waitForIdle(page);

        // Look for the code in the last cell
        const cellCount = await page.locator('.jp-Cell').count();
        const code = await getCodeFromCell(page, cellCount - 1);
        expect(code).toContain('print');
        expect(code).toContain('bye');
    });
});


test.describe("Agent auto error debugging", () => {

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
    });

    test("Auto Error Fixup", async ({ page }) => {

        await sendMessageToMitoAI(page, "Import the file nba_data.csv");
        await waitForIdle(page);

        // Run the plan of attack
        await page.getByRole('button', { name: AGENT_PLAN_SUBMIT_BUTTON_TEXT }).click();

        // Check that the agent eventually sends a message that says it is trying again
        await expect(async () => {
            const messages = await page.locator('.message-assistant-chat').all();
            const messageTexts = await Promise.all(messages.map(msg => msg.textContent()));
            if (!messageTexts.some(text => text?.includes("Hmm, looks like my first attempt didn't work. Let me try again."))) {
                throw new Error('Expected message not found');
            }
        }).toPass({ timeout: 45000 }); // Increase timeout if needed
    });
});
