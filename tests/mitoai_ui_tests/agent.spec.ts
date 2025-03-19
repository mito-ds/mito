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
    getNotebookCode,
    waitForAgentToFinish,
    startNewMitoAIChat
} from './utils';

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

        await startNewMitoAIChat(page);

        await sendMessageToMitoAI(page, "print hi");
        await waitForIdle(page);
    });

    test("Run agent's plan", async ({ page }) => {

        // Wait until the agent is done executing
        await waitForAgentToFinish(page);

        // Make sure that the agent wrote code to the notebook
        const codeFromCells = await getNotebookCode(page)
        const codeFromCellsString = codeFromCells.join('')
        expect(codeFromCellsString).toContain('hi');
    });

    test("Edit original message", async ({ page }) => {
        const newMessage = "print bye";

        // Keep track of the original messages in the agent's plan.
        const oldPlanMessages: string[] = [];
        const messages = await page.locator('.message-assistant-chat').all();
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
        const newMessages = await page.locator('.message-assistant-chat').all();
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

    test("Run agent's plan then send a follow up message", async ({ page }) => {
        
        // Wait until the agent is done executing
        await waitForAgentToFinish(page);

        // Make sure that the agent wrote code to the notebook
        const codeFromCells = await getNotebookCode(page)
        const codeFromCellsString = codeFromCells.join(' ')
        expect(codeFromCellsString).toContain('hi');

        // Send a follow up chat message
        await sendMessageToMitoAI(page, "Update the print statement to print goodbye");
        await waitForAgentToFinish(page);

        // Look for the code in the last cell
        const newCodeFromCells = await getNotebookCode(page)
        const newCodeFromCellsString = newCodeFromCells.join(' ')
        expect(newCodeFromCellsString).toContain('print');
        expect(newCodeFromCellsString).toContain('bye');
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

        await sendMessageToMitoAI(page, "Create a list of 10 numbers and then find the largest number in the list.", undefined, true);

        // Wait for the Stop Agent button to be visible before clicking it
        await page.getByTestId('stop-agent-button').waitFor({ state: 'visible' });
        
        // Click the Stop Agent button
        await page.getByTestId('stop-agent-button').click();

        // Expect that the message turns into Stopping 
        await expect(page.getByRole('button', { name: 'Stopping' })).toBeVisible();

        // Wait for the current message to finish
        await waitForMitoAILoadingToDisappear(page);

        // Verify that the message "Agent stopped" is visible
        await expect(page.getByText('Agent execution stopped')).toBeVisible();
    });

    test("Stop agent during error fixup", async ({ page }) => {
        // This is hopefully an impossible thing for the agent to pass. 
        await sendMessageToMitoAI(page, "Import the file nba_data.csv. IMPORTANT: THIS CODE IS GOING TO ERROR. NEVER GENERATE A CORRECT VERSION OF THIS CODE.");
        await waitForIdle(page);

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

test.describe("Agent overwrite existing cells", () => {
    test("Update existing print statement", async ({ page }) => {

        // Create a notebok with a few cells
        await createAndRunNotebookWithCells(page, ['print("hello world")', '']);
        await waitForIdle(page);

        await clickOnMitoAIChatTab(page);
        await waitForIdle(page);

        // Switch to agent mode 
        await clickAgentModeToggleButton(page);

        await sendMessageToMitoAI(page, "Update the print hello world statement to print goodbye world");
        await waitForAgentToFinish(page)

        // Check that the final notebook has print goodbye world and not print hello world
        const codeFromCells = await getNotebookCode(page)

        // Join all of the code content into one big string to make searching easier
        const codeFromCellsString = codeFromCells.join(' ')
        expect(codeFromCellsString).toContain('goodbye world');
        expect(codeFromCellsString).not.toContain('hello world');
    })
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

test.describe("Agent mode blacklisted words", () => {

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

    test("Blacklisted command shows error and prevents execution", async ({ page }) => {
        // Send a message containing a blacklisted command
        await sendMessageToMitoAI(page, "write the SQL code: DROP TABLE nba_data");
        await waitForIdle(page);

        // Check that the agent eventually sends a message that says it cannot execute the code
        await expect(async () => {
            const messages = await page.locator('.message-assistant-chat').all();
            const messageTexts = await Promise.all(messages.map(msg => msg.textContent()));
            if (!messageTexts.some(text => text?.includes("I cannot execute this code"))) {
                throw new Error('Expected message not found');
            }
        }).toPass({ timeout: 45000 }); // Increase timeout if needed

        // Verify that no dangerous command appears in any cell
        const cells = await page.locator('.jp-Cell').all();
        for (const cell of cells) {
            const code = await cell.locator('.jp-Editor').textContent();
            expect(code).not.toContain('DROP TABLE');
        }
    });
});
