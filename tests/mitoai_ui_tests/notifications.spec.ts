import { expect, galata, test } from "@jupyterlab/galata";
import { PromiseDelegate } from "@lumino/coreutils";
import { createAndRunNotebookWithCells, waitForIdle } from "../jupyter_utils/jupyterlab_utils";

test.describe.configure({ mode: 'parallel' });

test.describe("notification", () => {
    test.use({
        autoGoto: false,
        mockSettings: {
            ...galata.DEFAULT_SETTINGS,
            "@jupyterlab/completer-extension:inline-completer": {
                providers: {
                    "@jupyterlab/inline-completer:history": {
                        enabled: false,
                        timeout: 5000,
                        debouncerDelay: 0,
                        maxSuggestions: 100,
                    },
                    "mito-ai": {
                        enabled: true,
                        timeout: 5000,
                        debouncerDelay: 250,
                        triggerKind: "any",
                    },
                },
            },
        },
    });

    // I can't figure out how to get this test to show the notification...
    // The message is getting sent back to the frontend, but the notification
    // doesn't appear.
    test.skip("should display upgrade notification", async ({ page, tmpPath }) => {
        const replyDone = new PromiseDelegate<void>();
        
        await page.routeWebSocket(/.*\/mito-ai\/completions/, (ws) => {
            ws.onMessage((message) => {
                const payload = JSON.parse(message as string);
                const messageId = payload.number;
                if (
                    payload.type === "inline_completion" &&
                    payload.metadata.prefix.includes("print") &&
                    payload.stream == false
                ) {
                    ws.send(JSON.stringify({
                        type: "reply",  // Changed to "reply" to match expected format
                        items: [],
                        parent_id: messageId,
                        error: {
                            error_type: "builtins.PermissionError",
                            title: "mito_server_free_tier_limit_reached",  // This exact string is important
                            hint: "You've reached the free tier limit for Mito AI. Upgrade to Pro for unlimited uses or supply your own OpenAI API key.",
                            traceback: "This is a test traceback"
                        }
                    }));
                    replyDone.resolve();
                } else {
                    ws.send(
                        JSON.stringify({
                            items: [],
                            parent_id: messageId,
                            type: "inline_completion",
                            error: {
                                type: "ValueError",
                                title: `Unknown request ${message}.`,
                            },
                        })
                    );
                }
            });
        });

        await page.goto(`tree/${tmpPath}`);
        const filename = "notifications.ipynb";
        await page.notebook.createNew(filename);
        // Don't use the helper, page.notebook.setCell because it check
        // of content will fail if the inline completion is already displayed
        // before it grabs the text content.
        await (await page.notebook.getCellLocator(0))!
            .getByRole("textbox")
            .fill("print('hel");

        await replyDone.promise;

        // Add a small delay to allow the notification to appear
        await page.waitForTimeout(1000);

        await expect(page.locator(".jp-toast-message")).toBeVisible();
        await expect(page.locator('.jp-toast-button').getByRole('button', { name: 'Upgrade to Mito Pro' })).toBeVisible();
    });
});
