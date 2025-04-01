/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, galata, test } from "@jupyterlab/galata";
import { PromiseDelegate } from "@lumino/coreutils";

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

  test("should show the AI provider capabilities", async ({
    page,
    tmpPath,
  }) => {
    // Mock provider capabilities
    await page.routeWebSocket(/.*\/mito-ai\/completions/, (ws) => {
      // Send capabilities after a delay to simulate a real server
      setTimeout(
        () =>
          ws.send(
            JSON.stringify({
              configuration: {
                model: "a-powerful-model",
              },
              provider: "Mito server",
              type: "ai_capabilities",
            })
          ),
        500
      );
    });

    await page.goto(`tree/${tmpPath}`);

    await page.getByRole("button", { name: "Mito AI" }).click();

    await expect(page.locator(".mito-ai-status-popup")).toBeVisible();
    await expect(page.locator(".mito-ai-status-popup")).toContainText("Mito server")
  });

  test("should show upgrade to pro message and button", async ({ page, tmpPath }) => {
    // Mock provider capabilities
    await page.routeWebSocket(/.*\/mito-ai\/completions/, (ws) => {
      // Send capabilities after a delay to simulate a real server
      setTimeout(
        () =>
          ws.send(
            JSON.stringify({
              type: "error",
              error_type: "builtins.PermissionError",
              title: "mito_server_free_tier_limit_reached",
              hint: "Upgrade to Mito Pro to continue using Mito AI",
            })
          ),
        500
      );
    });

    await page.goto(`tree/${tmpPath}`);

    await page.getByRole("button", { name: "Mito AI" }).click();

    await expect(page.locator(".mito-ai-status-popup")).toBeVisible();
    await expect(page.locator(".mito-ai-status-popup")).toContainText("Free Trial Expired")
    await expect(page.locator(".mito-ai-status-popup").locator(".button-base")).toContainText("Upgrade to Pro")
  })

  test("should show the latest error", async ({ page, tmpPath }) => {

    // Mock provider sending an error
    await page.routeWebSocket(/.*\/mito-ai\/completions/, (ws) => {
      // Send error and capabilities after a delay to simulate a real server
      setTimeout(
        () =>
          ws.send(
            JSON.stringify({
              type: "error",
              error_type: "openai.AuthenticationError",
              title: "Bad OpenAI API key",
              hint: "Try again with a valid API key",
            })
          ),
        500
      );
      setTimeout(
        () =>
          ws.send(
            JSON.stringify({
              configuration: {
                model: "a-powerful-model",
              },
              provider: "Mito server",
              type: "ai_capabilities",
            })
          ),
        600
      );
    });

    await page.goto(`tree/${tmpPath}`);

    await page.getByRole("button", { name: "Mito AI" }).click();

    await expect(page.locator(".mito-ai-status-popup")).toContainText("Bad OpenAI API key");
    await expect(page.locator(".mito-ai-status-popup")).toContainText("Try again with a valid API key")
  });

  test("should show error if server endpoint returns 404", async ({
    page,
    tmpPath,
  }) => {
        // Mock head request to websocket to fake missing server endpoint
        await page.route(/.*\/mito-ai\/completions/, (request) => {
          request.fulfill({
            status: 404,
            body: 'Not Found',
          })
        });
    
        await page.goto(`tree/${tmpPath}`);
    
        await page.getByRole("button", { name: "Mito AI" }).click();

    await expect(page.locator(".mito-ai-status-popup")).toContainText("Mito AI extension not enabled.")
    await expect(page.locator(".mito-ai-status-popup")).toContainText("You can enable it by running in a cell `!jupyter server extension enable mito_ai`. Then restart the application.")
  });
});
