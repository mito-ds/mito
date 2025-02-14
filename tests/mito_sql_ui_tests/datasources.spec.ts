import { expect, galata, test } from "@jupyterlab/galata";
import * as path from "path";

const DATABASES_URL =
  /.*\/mito-sql-cell\/databases(\/(?<connectionName>\w[\w-]*))?/;
const MOCKED_CONFIGURATION_FILE = "/home/test/.mito/connections.ini";

test.describe("Mito SQL datasources", () => {
  test.use({ autoGoto: false });

  const sources = new Array<any>();

  test.beforeEach(async ({ baseURL, page, request, tmpPath }) => {
    // Mock SQL sources - must happen before page goto
    sources.length = 0;

    await page.route(DATABASES_URL, (route, request) => {
      const connectionName = DATABASES_URL.exec(request.url())?.groups
        ?.connectionName as string;
      if (connectionName) {
        switch (request.method()) {
          case "GET":
            const connection = sources.find(
              (s) => s.connectionName === connectionName
            );
            return connection
              ? route.fulfill({
                  status: 200,
                  body: JSON.stringify(connection),
                })
              : route.fulfill({ status: 404 });
          case "PATCH": {
            const data = request.postDataJSON();
            const connectionIndex = sources.findIndex(
              (s) => s.connectionName === connectionName
            );
            if (connectionIndex === -1) {
              return route.fulfill({ status: 404 });
            } else {
              const connection = { ...sources[connectionIndex], ...data };
              sources.splice(connectionIndex, 1, connection);
              return route.fulfill({
                status: 200,
              });
            }
          }
          case "DELETE": {
            const connectionIndex = sources.findIndex(
              (s) => s.connectionName === connectionName
            );
            if (connectionIndex >= 0) {
              sources.splice(connectionIndex, 1);
            }
            return route.fulfill({ status: 204 });
          }
          default:
            return route.continue();
        }
      } else {
        switch (request.method()) {
          case "GET":
            return route.fulfill({
              status: 200,
              body: JSON.stringify({
                connections: sources,
                configurationFile: MOCKED_CONFIGURATION_FILE,
              }),
            });
          case "POST": {
            const data = request.postDataJSON();
            sources.push(data);
            return route.fulfill({ status: 201 });
          }
          default:
            return route.continue();
        }
      }
    });

    // Upload test sqlite file
    const contents = galata.newContentsHelper(request);
    await contents.uploadFile(
      path.resolve(__dirname, "../data/test.sqlite"),
      `${tmpPath}/test.sqlite`
    );

    await page.goto(`tree/${tmpPath}`);

    await page.getByRole("tab", { name: "SQL Sources" }).click();
    // Use the button displayed when no sources is set
    await page.getByRole("button", { name: "Add a SQL source" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await dialog.getByRole("option", { name: "SQLite" }).click();
    await dialog.locator("#root_connectionName").fill("test");
    await dialog.locator("#root_database").fill("test.sqlite");
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
  });

  test.only("should add and remove a new SQL source", async ({ page }) => {
    // Create a notebook and add a SQL cell to check
    // the sources list gets updated
    await page.notebook.createNew();

    const secondCell = page.getByLabel("Code Cell Content").nth(1);
    await secondCell.click();
    await page.getByLabel("Cell type").selectOption("SQL");

    // Adding a SQL source through the button in the empty panel
    // is handle in before each. So here we use the toolbar button.

    await page.getByRole("button", { name: "Add a new SQL source" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await dialog.getByRole("option", { name: "PostgreSQL" }).click();
    // Adding a new source with an existing name should fail
    await dialog.locator("#root_connectionName").fill("test");

    // FIXME custom validation is not triggered
    // await expect
    //   .soft(dialog.getByText("A source with this name already exists."))
    //   .toBeVisible();
    // await expect
    //   .soft(dialog.getByRole("button", { name: "Add", exact: true }))
    //   .toBeDisabled();

    await dialog.locator("#root_connectionName").fill("testpg");

    await dialog.locator("#root_username").fill("john");
    await dialog.locator("#root_password").fill("123456");
    await dialog.locator("#root_host").fill("localhost");
    await dialog.locator("#root_port").fill("5432");
    await dialog.locator("#root_database").fill("testdb");
    await dialog.getByRole("button", { name: "Add", exact: true }).click();

    await secondCell.getByRole("combobox", {}).click();
    await expect.soft(secondCell.getByRole("option")).toHaveCount(2);
    await expect
      .soft(secondCell.getByRole("option", { name: "testpg" }))
      .toBeVisible();
    await page.keyboard.press("Escape");

    // Deleting a SQL source
    await page.getByLabel("testpg").getByRole("button").last().click();
    await secondCell.getByRole("combobox", {}).click();
    await expect(secondCell.getByRole("option")).toHaveCount(1);
  });

  test("should handle SQL datasource", async ({ page }) => {
    await expect
      .soft(page.getByRole("listitem", { name: "test" }))
      .toHaveText("testSQLite: test.sqlite");

    await page.notebook.createNew();

    const secondCell = page.getByLabel("Code Cell Content").nth(1);
    await secondCell.waitFor({ state: "visible" });
    // Execute the first cell
    await page.getByLabel("Code Cell Content").first().click();
    await page.keyboard.press("Shift+Enter");

    // Focus on the second cell
    await secondCell.click();
    await page.getByLabel("Cell type").selectOption("SQL");
    await secondCell.getByRole("combobox", {}).click();
    await secondCell.getByRole("option", { name: "test" }).click();
    await secondCell
      .getByLabel("Variable name")
      .getByRole("textbox")
      .fill("df");
    await page.pause();
    await secondCell.locator(".cm-editor").click();
    await page.keyboard.type("\nSELECT\n*\nFROM repositories");
    // FIXME need to generate a real config file for the magic to work
    await page.keyboard.press("Shift+Enter");
    await expect
      .soft(page.getByLabel("Code Cell Content with Output").last())
      .toContainText("Connecting to 'test'");
    await expect
      .soft(page.getByLabel("Code Cell Content with Output").last())
      .toContainText("stars");

    await page.keyboard.type("df");
    await page.keyboard.press("Shift+Enter");
    await expect(
      page.getByLabel("Code Cell Content with Output").last()
    ).toContainText("stars");
  });

  test("should update the cell magic", async ({ page }) => {});
});
