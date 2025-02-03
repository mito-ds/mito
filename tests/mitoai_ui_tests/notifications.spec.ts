import { expect, galata, test } from "@jupyterlab/galata";
import { PromiseDelegate } from "@lumino/coreutils";
import { createAndRunNotebookWithCells, waitForIdle } from "../jupyter_utils/jupyterlab_utils";

test.describe.configure({ mode: 'parallel' });

test.describe("Mito AI status item", () => {
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

    test("should show upgrade to pro notification", async ({ page, tmpPath }) => {
        const replyDone = new PromiseDelegate<void>();
        
        // Set up WebSocket route BEFORE navigating to the page
        await page.routeWebSocket(/.*\/mito-ai\/completions/, (ws) => {
            ws.onMessage((message) => {
                const payload = JSON.parse(message as string);
                const messageId = payload.number;
                if (
                    payload.type === "inline_completion" &&
                    payload.metadata.prefix.includes("print") &&
                    payload.stream == false
                ) {
                    // Send the error response in the exact format expected
                    ws.send(JSON.stringify({
                        items: [],
                        parent_id: messageId,
                        type: "inline_completion",
                        error: {
                            type: "error",
                            error_type: "builtins.PermissionError",
                            title: "mito_server_free_tier_limit_reached",
                            hint: "Upgrade to Mito Pro to continue using Mito AI",
                        }
                    }));
                    replyDone.resolve();
                }
            });
        });

        await page.goto(`tree/${tmpPath}`);
        const filename = "notifications.ipynb";
        await page.notebook.createNew(filename);

        await (await page.notebook.getCellLocator(0))!
            .getByRole("textbox")
            .fill("print('hel");

        await replyDone.promise;

        await expect(page.locator(".jp-toast-message")).toBeVisible();
        await expect(page.locator('.jp-toast-button').getByRole('button', { name: 'Upgrade to Mito Pro' })).toBeVisible();
    });
});
