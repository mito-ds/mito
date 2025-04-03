import { expect, galata, test } from "@jupyterlab/galata";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { waitForIdle } from "../jupyter_utils/jupyterlab_utils";

const DATABASES_URL =
  /.*\/mito-sql-cell\/databases(\/(?<connectionName>\w[\w-]*))?/;
const TEMPORARY_DIRECTORY = os.tmpdir();
const MOCKED_CONFIGURATION_FILE = path.join(".mito", "connections.ini");

async function writeSources(file: string, data: any[]) {
  let content = "";
  for (const source of data) {
    content += `[${source.connectionName}]\n`;
    content += `database = ${source.database}\n`;
    content += `driver = ${source.driver}\n`;
    if (source.host) content += `host = ${source.host}\n`;
    if (source.port) content += `port = ${source.port}\n`;
    if (source.username) content += `username = ${source.username}\n`;
    if (source.password) content += `password = ${source.password}\n`;
  }

  await fs.writeFile(file, content);
}

test.describe("Mito SQL datasources", () => {
  test.use({ autoGoto: false });

  const sources = new Array<any>();

  test.afterEach(async ({}, testInfo) => {
    // Remove the temporary configuration
    const testFolder = path
      .basename(testInfo.outputDir)
      .replace(/-retry\d+$/i, "");

    const configurationFile = path.join(
      TEMPORARY_DIRECTORY,
      testFolder,
      MOCKED_CONFIGURATION_FILE
    );

    const content = await fs.readFile(configurationFile, "utf-8");
    console.info(`Configuration file for ${configurationFile} content:\n`, content);
    await fs.unlink(configurationFile);
  });

  test.beforeEach(async ({ page, request, tmpPath }, testInfo) => {
    const testFolder = path
      .basename(testInfo.outputDir)
      .replace(/-retry\d+$/i, "");

    const configurationFile = path.join(
      TEMPORARY_DIRECTORY,
      testFolder,
      MOCKED_CONFIGURATION_FILE
    );

    // Create a temporary directory for the configuration file
    await fs.mkdir(path.dirname(configurationFile), {
      recursive: true,
    });

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
              writeSources(configurationFile, sources).catch((reason) => {
                console.error("Failed to write sources");
              });
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
            writeSources(configurationFile, sources).catch((reason) => {
              console.error("Failed to write sources");
            });
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
                configurationFile,
              }),
            });
          case "POST": {
            const data = request.postDataJSON();
            sources.push(data);
            writeSources(configurationFile, sources).catch((reason) => {
              console.error("Failed to write sources");
            });
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

  test("should add and remove a new SQL source", async ({ page }) => {
    // Create a notebook and add a SQL cell to check
    // the sources list gets updated
    await page.notebook.createNew();

    // At first the last cell is the first as no SQL cell was set; hence
    // no configuration cell was added at the top.
    // Later the first cell will be the configuration cell and we want
    // to play with the second cell.
    const sqlCell = page.getByLabel("Code Cell Content").last();
    await sqlCell.click();
    await page.getByLabel("Cell type").selectOption("SQL");

    // Adding a SQL source through the button in the empty panel
    // is handle in before each. So here we use the toolbar button.
    await page.locator('[data-testid="sql-source-select"]').waitFor({state: 'visible'});
    await page.getByTestId('sql-source-select').selectOption('add-source');

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

    await expect.soft(page.getByTestId('sql-source-select').getByRole("option")).toHaveCount(3);

    // Deleting a SQL source
    await page.getByLabel("testpg").getByRole("button").last().click();
    await expect(
      sqlCell.getByRole("combobox", { name: "SQL source" }).getByRole("option")
    ).toHaveCount(2);
  });

  test("should handle SQL datasource", async ({ page }) => {
    await expect
      .soft(page.getByRole("listitem", { name: "test" }))
      .toHaveText("testSQLite: test.sqlite");

    await page.notebook.createNew();

    const sqlCell = page.getByLabel("Code Cell Content").last();
    await sqlCell.waitFor({ state: "visible" });
    await sqlCell.click();
    await page.getByLabel("Cell type").selectOption("SQL");
    // Execute the first cell that should contain the configuration
    const firstCell = page.getByLabel("Code Cell Content").first();
    await firstCell.getByRole("textbox").getByText("%load_ext mito_sql_cell").waitFor();
    await firstCell.click();
    await page.keyboard.press("Shift+Enter");
    await waitForIdle(page);

    // Focus on the SQL cell
    await sqlCell.click();
    await page.getByTestId('sql-source-select').selectOption('test');
    await page.getByTestId('sql-variable-name-input').getByPlaceholder('Variable name').fill('df');
    await sqlCell.locator(".cm-editor").click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.type("\nSELECT\n*\nFROM repositories");
    await page.keyboard.press("Shift+Enter");
    await expect
      .soft(page.getByLabel("Code Cell Content with Output").last())
      .toContainText("stars");

    await page.keyboard.type("df");
    await page.keyboard.press("Shift+Enter");
    await expect(
      page.getByLabel("Code Cell Content with Output").last()
    ).toContainText("stars");
  });

  test("should update the cell magic", async ({ page }) => {
    await page.notebook.createNew();

    const sqlCell = page.getByLabel("Code Cell Content").last();
    await sqlCell.waitFor({ state: "visible" });
    // Set valid jupysql magic with unsupported mito options
    await sqlCell.getByRole("textbox").fill(`%%sql
SELECT
  name,
  user
FROM repositories
WHERE
  stars > 25000`);

    // Execute the first cell that should contain the configuration
    const firstCell = page.getByLabel("Code Cell Content").first();
    await firstCell.getByRole("textbox").getByText("%load_ext mito_sql_cell").waitFor();
    await firstCell.click();
    await page.keyboard.press("Shift+Enter");

    // Focus on the SQL cell
    await sqlCell.click();

    // Setting the SQL options should update the magic
    await page.getByTestId('sql-source-select').selectOption('test');
    await page.getByTestId('sql-variable-name-input').getByPlaceholder('Variable name').fill('out');

    await sqlCell.click();
    await page.keyboard.press("Shift+Enter");
    await expect
      .soft(page.getByLabel("Code Cell Content with Output").getByRole("table"))
      .toContainText("handson-ml2");
  });
});
