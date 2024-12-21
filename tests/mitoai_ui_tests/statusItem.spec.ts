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
                max_completion_tokens: 20,
                model: "a-powerful-model",
                temperature: 0.7,
              },
              provider: "Mito server",
              type: "ai_capabilities",
            })
          ),
        500
      );
    });

    await page.goto(`tree/${tmpPath}`);

    await page.getByRole("button", { name: "Mito AI Status" }).click();

    await expect(page.locator(".mito-ai-status-popup")).toHaveText(
      "Mito AI StatusProvider: Mito serverConfiguration:Model: a-powerful-modelMax tokens: 20Temperature: 0.7"
    );
  });

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
                max_completion_tokens: 20,
                model: "a-powerful-model",
                temperature: 0.7,
              },
              provider: "Mito server",
              type: "ai_capabilities",
            })
          ),
        600
      );
    });

    await page.goto(`tree/${tmpPath}`);

    await page.getByRole("button", { name: "Mito AI Status" }).click();

    await expect(page.locator(".mito-ai-status-popup")).toHaveText(
      "Mito AI StatusProvider: Mito serverConfiguration:Model: a-powerful-modelMax tokens: 20Temperature: 0.7Last error:Type: openai.AuthenticationErrorTitle: Bad OpenAI API keyHint: Try again with a valid API key"
    );
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
    
        await page.getByRole("button", { name: "Mito AI Status" }).click();

    await expect(page.locator(".mito-ai-status-popup")).toHaveText(
      "Mito AI StatusProvider: NoneLast error:Type: HTTPErrorTitle: Mito AI extension not enabled.Hint: You can enable it by running in a cell `!jupyter server extension enable mito_ai`. Then restart the application."
    );
  });
});
