import { expect, galata, test } from "@jupyterlab/galata";
import { PromiseDelegate } from "@lumino/coreutils";

const GHOST_SELECTOR = ".jp-GhostText";

test.describe("first time setup", () => {
  test.skip("should ask the user to activate the inline completion", async ({
    page,
    request,
  }) => {
    await page
      .getByText(/Thanks for installing the Mito AI extension/)
      .waitFor();
    await page.getByRole("button", { name: "Enable" }).click();

    // Check that reload trigger loading not empty mito ai config
    await Promise.all([
      page.reload(),
      page.waitForResponse(async (response) => {
        if (response.request().method() !== "GET") {
          return false;
        }
        const url = response.url();
        if (galata.Routes.config.test(url) && /\/mitoaiconfig\?+/.test(url)) {
          const content = await response.json();
          return !!content["state"]?.["settingsChecked"];
        }
        return false;
      }),
    ]);

    await expect
      .soft(page.getByText(/Thanks for installing the Mito AI extension/))
      .toHaveCount(0);

    // Check settings is correctly set
    const reply = await request.get(
      "/lab/api/settings/@jupyterlab/completer-extension:inline-completer"
    );
    const body = await reply.json();
    expect
      .soft(
        body["settings"]["providers"]["@jupyterlab/inline-completer:history"][
          "enabled"
        ]
      )
      .toEqual(false);
    expect(body["settings"]["providers"]["mito-ai"]["enabled"]).toEqual(true);
  });
});

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
          payload.messages.find((message) => message.content === "def fib") &&
          payload.stream
        ) {
          let counter = -1;
          const streamReply = setInterval(() => {
            if (++counter < MOCKED_MESSAGES.length) {
              ws.send(JSON.stringify(MOCKED_MESSAGES[counter]));
            } else {
              clearInterval(streamReply);
              replyDone.resolve();
            }
          }, 100);
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
      .fill("def fib");

    await replyDone.promise;

    expect.soft(page.locator(GHOST_SELECTOR)).toHaveCount(1);
    expect
      .soft((await page.notebook.getCellLocator(0))!.getByRole("textbox"))
      .toHaveText("def fib(n):\n    pass\n");

    await page.keyboard.press("Tab");

    expect.soft(page.locator(GHOST_SELECTOR)).toHaveCount(0);
    expect(
      (await page.notebook.getCellLocator(0))!.getByRole("textbox")
    ).toHaveText("def fib(n):\n    pass\n");
  });
});

test.describe("default manual inline completion", () => {
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
            triggerKind: "manual",
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
          payload.messages.find((message) => message.content === "def fib") &&
          payload.stream
        ) {
          let counter = -1;
          const streamReply = setInterval(() => {
            if (++counter < MOCKED_MESSAGES.length) {
              ws.send(JSON.stringify(MOCKED_MESSAGES[counter]));
            } else {
              clearInterval(streamReply);
              replyDone.resolve();
            }
          }, 100);
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
    await page.notebook.setCell(0, "code", "def fib");
    // Ensure the cell is focused with the cursor at the end of the content
    await (await page.notebook.getCellLocator(0))!.click();
    await page.keyboard.press("Alt+\\");

    await replyDone.promise;

    expect.soft(page.locator(GHOST_SELECTOR)).toHaveCount(1);
    expect
      .soft((await page.notebook.getCellLocator(0))!.getByRole("textbox"))
      .toHaveText("def fib(n):\n    pass\n");

    await page.keyboard.press("Tab");

    expect.soft(page.locator(GHOST_SELECTOR)).toHaveCount(0);
    expect(
      (await page.notebook.getCellLocator(0))!.getByRole("textbox")
    ).toHaveText("def fib(n):\n    pass\n");
  });
});

// Mocked messages to simulate the inline completion process
const MOCKED_MESSAGES = [
  {
    items: [
      {
        content: "",
        isIncomplete: true,
        token: "1",
        error: null,
      },
    ],
    parent_id: "1",
    type: "reply",
    error: null,
  },
  {
    chunk: {
      content: "",
      isIncomplete: true,
      token: "1",
      error: null,
    },
    parent_id: "1",
    done: false,
    type: "chunk",
    error: null,
  },
  {
    chunk: {
      content: "def",
      isIncomplete: true,
      token: "1",
      error: null,
    },
    parent_id: "1",
    done: false,
    type: "chunk",
    error: null,
  },
  {
    chunk: {
      content: " fib",
      isIncomplete: true,
      token: "1",
      error: null,
    },
    parent_id: "1",
    done: false,
    type: "chunk",
    error: null,
  },
  {
    chunk: {
      content: "(n",
      isIncomplete: true,
      token: "1",
      error: null,
    },
    parent_id: "1",
    done: false,
    type: "chunk",
    error: null,
  },
  {
    chunk: {
      content: "):\n",
      isIncomplete: true,
      token: "1",
      error: null,
    },
    parent_id: "1",
    done: false,
    type: "chunk",
    error: null,
  },
  {
    chunk: {
      content: "    pass\n",
      isIncomplete: true,
      token: "1",
      error: null,
    },
    parent_id: "1",
    done: true,
    type: "chunk",
    error: null,
  },
];
