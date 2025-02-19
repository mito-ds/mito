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
    waitForMitoAILoadingToDisappear,
    clickAgentModeToggleButton,
} from './utils';

const AGENT_PLAN_SUBMIT_BUTTON_TEXT = 'Let\'s go!';

test.describe("Agent mode print hi", () => {

    test.beforeEach(async ({ page }) => {
        /*
            Before each test, we switch to agent mode, and send a message. 
        */

        await createAndRunNotebookWithCells(page, []);
        await waitForIdle(page);

        await clickOnMitoAIChatTab(page);
        await waitForIdle(page);

        // Switch to agent mode 
        await clickAgentModeToggleButton(page);

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


test.describe("Stop Agent", () => {

    test.beforeEach(async ({ page }) => {
        /*
            Before each test, we switch to agent mode, and send a message. 
        */

        await createAndRunNotebookWithCells(page, []);
        await waitForIdle(page);

        await clickOnMitoAIChatTab(page);
        await waitForIdle(page);

        // Switch to agent mode 
        await clickAgentModeToggleButton(page);
    });


    test("Stop agent's plan execution", async ({ page }) => {

        await sendMessageToMitoAI(page, "Create a list of 10 numbers and then find the largest number in the list.");
        await waitForIdle(page);

        const numOfStepsInAgentsPlan = await page.locator('.message-assistant-agent').count();
        const startingNumOfChatMessages = await page.locator('.message-assistant-chat').count();

        // Run the plan of attack
        await page.getByRole('button', { name: AGENT_PLAN_SUBMIT_BUTTON_TEXT }).click();

        // Wait for at least one chat message to appear to ensure the plan has started
        await page.waitForFunction(
            ([startingCount]) => {
                const currentCount = document.querySelectorAll('.message-assistant-chat').length;
                return currentCount > startingCount;
            },
            [startingNumOfChatMessages]
        );

        // Click the Stop Agent button
        await page.getByRole('button', { name: 'Stop Agent' }).click();

        // Expect that the message turns into Stopping 
        await expect(page.getByRole('button', { name: 'Stopping' })).toBeVisible();

        // Wait for the current message to finish
        await waitForMitoAILoadingToDisappear(page);

        // Get the final number of chat messages
        const finalNumOfChatMessages = await page.locator('.message-assistant-chat').count();

        // Verify that not all steps were executed (there should be fewer chat messages than planned steps)
        expect(finalNumOfChatMessages - startingNumOfChatMessages).toBeLessThan(numOfStepsInAgentsPlan);

        // Verify that the message "Agent stopped" is visible
        await expect(page.getByText('Agent execution stopped')).toBeVisible();
    });

    test("Stop agent during error fixup", async ({ page }) => {
        // This is hopefully an impossible thing for the agent to pass. 
        await sendMessageToMitoAI(page, "Import the file nba_data.csv. IMPORTANT: THIS CODE IS GOING TO ERROR. NEVER GENERATE A CORRECT VERSION OF THIS CODE.");
        await waitForIdle(page);

        // Run the plan of attack
        await page.getByRole('button', { name: AGENT_PLAN_SUBMIT_BUTTON_TEXT }).click();

        // Wait for the "trying again" message to appear
        await expect(async () => {
            const messages = await page.locator('.message-assistant-chat').all();
            const messageTexts = await Promise.all(messages.map(msg => msg.textContent()));
            if (!messageTexts.some(text => text?.includes("Hmm, looks like my first attempt didn't work. Let me try again."))) {
                throw new Error('Expected retry message not found');
            }
        }).toPass({ timeout: 45000 });

        // Click the Stop Agent button
        await page.getByRole('button', { name: 'Stop Agent' }).click();

        // Expect that the message turns into Stopping 
        await expect(page.getByRole('button', { name: 'Stopping' })).toBeVisible();

        // Wait for the current message to finish
        await waitForMitoAILoadingToDisappear(page);

        // Verify that the message "Agent stopped" is visible
        await expect(page.getByText('Agent execution stopped')).toBeVisible();

        // Verify we don't see the final error message
        const messages = await page.locator('.message-assistant-chat').all();
        const messageTexts = await Promise.all(messages.map(msg => msg.textContent()));
        expect(messageTexts.some(text => 
            text?.includes("I apologize, but I was unable to fix the error after 3 attempts")
        )).toBe(false);
    });
})


test.describe("Agent mode auto error fixup", () => {

    test.beforeEach(async ({ page }) => {
        /*
            Before each test, we switch to agent mode, and send a message. 
        */

        await createAndRunNotebookWithCells(page, []);
        await waitForIdle(page);

        await clickOnMitoAIChatTab(page);
        await waitForIdle(page);

        // Switch to agent mode 
        await clickAgentModeToggleButton(page);
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
