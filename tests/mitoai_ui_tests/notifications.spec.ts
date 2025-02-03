import { expect, galata, test } from "@jupyterlab/galata";
import { PromiseDelegate } from "@lumino/coreutils";
import { createAndRunNotebookWithCells, waitForIdle } from "../jupyter_utils/jupyterlab_utils";

test.describe.configure({ mode: 'parallel' });

test.describe("default inline completion", () => {
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

    test("should display inline completion", async ({ page, tmpPath }) => {
        const replyDone = new PromiseDelegate<void>();
        // Mock completion request with code prefix 'def fib'
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
        const filename = "inline-completer.ipynb";
        await page.notebook.createNew(filename);
        // Don't use the helper, page.notebook.setCell because it check
        // of content will fail if the inline completion is already displayed
        // before it grabs the text content.
        await (await page.notebook.getCellLocator(0))!
            .getByRole("textbox")
            .fill("print('hel");

        await replyDone.promise;
        await expect(page.locator(".jp-toast-message")).toBeVisible();
        await expect(page.locator('.jp-toast-button').getByRole('button', { name: 'Upgrade to Mito Pro' })).toBeVisible();
    });
});
