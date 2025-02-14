import { expect, galata, test } from "@jupyterlab/galata";
import * as path from "path";

test.describe("Mito SQL datasources", () => {
  const sources = [];

  test.beforeEach(async ({ page, request, tmpPath }) => {
    // Capture requests to the server
    await page.route(/.*\/mito-sql-cell\/databases\/(?<connection_name>\w[\w-]*)?/, () => {
      // FIXME
    })

    // Upload test sqlite file
    const contents = galata.newContentsHelper(request);
    await contents.uploadFile(
      path.resolve(__dirname, "../data/test.sqlite"),
      `${tmpPath}/test.sqlite`
    );

    await page.getByRole("tab", { name: "SQL Sources" }).click();
    await page.getByRole("button", { name: "Add a new SQL source" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await dialog.getByRole("option", { name: "SQLite" }).click();
    await dialog.locator("#root_connectionName").fill("test");
    await dialog.locator("#root_database").fill("test.sqlite");
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
  });

  test("should handle SQL datasource", async ({ page }) => {
    await expect
      .soft(page.getByRole("listitem", { name: "test" }))
      .toHaveText("testSQLite: test.sqlite");

    const secondCell = page.getByLabel("Code Cell Content").nth(1);
    await secondCell.getByRole("combobox", {}).click();
    await secondCell.getByRole("option", { name: "test" }).click();
    await secondCell
      .getByLabel("Variable name")
      .getByRole("textbox")
      .fill("df");
    await secondCell.getByRole("textbox").click();
    await page.keyboard.type("\nSELECT\n*\nFROM repositories");

    await page.keyboard.press("Shift+Enter");
    await expect(
      page.getByLabel("Code Cell Content with Output").last()
    ).toContainText("Connecting to 'test'");

    await page.keyboard.type("df");
    await page.keyboard.press("Shift+Enter");
    await expect(
      page.getByLabel("Code Cell Content with Output").last()
    ).toContainText("stars");
  });

  test("should update the cell magic", async ({ page }) => {});
});
