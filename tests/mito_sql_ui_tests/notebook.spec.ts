/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from "@jupyterlab/galata";

test.describe("Mito SQL cell", () => {
  test("should insert a SQL configuration cell", async ({ page }) => {
    await page.notebook.createNew("sqlConfig.ipynb");

    const firstCell = page.getByRole("main").getByRole("textbox").first();
    await expect.soft(firstCell).toHaveText(""); // Check that the cell is empty

    // Insert a SQL cell
    await page.notebook.addCell("code", "%%sql");

    // Check configuration cell was set
    await expect
      .soft(firstCell)
      .toHaveText(
        /# DO NOT EDIT this cell; it is required for Mito SQL cells to work.# It must be executed prior to any SQL cell.%load_ext mito_sql_cell/
      );

    await firstCell.click();
    await page.getByRole("tab", { name: "Property Inspector" }).click();
    await page.getByText("Common Tools").click();
    // Check configuration cell tags
    await expect(page.locator(".jp-CellTags-Tag").first()).toHaveText(
      "mito-sql-cell-configuration"
    );
  });

  test("should switch to and from SQL type", async ({ page }) => {
    await page.notebook.createNew("sqlSelector.ipynb");

    const typeSelector = page.getByLabel("Cell type");
    // There are two textbox in the cell - the cell editor and the variable name editor
    const sqlCell = page
      .getByRole("main")
      .getByLabel("Code Cell Content")
      .last()
      .getByRole("textbox")
      .first();
    await sqlCell.click();

    // Check the cell type is code by default
    await expect.soft(typeSelector).toHaveValue("code");

    // Switch to SQL type
    await typeSelector.selectOption("SQL");
    await expect.soft(sqlCell.locator(".cm-mito-sql-magic")).toHaveCount(1);
    await expect.soft(sqlCell).toHaveText(/^SQL/);

    // Focus SQL cell
    await sqlCell.click();

    // Switch to Code type should erase the magic
    await typeSelector.selectOption("Code");
    await expect.soft(sqlCell).not.toHaveText(/^SQL/);

    // Switch to Markdown type should erase the magic
    await typeSelector.selectOption("SQL");
    await expect.soft(sqlCell).toHaveText(/^SQL/);
    await typeSelector.selectOption("Markdown");
    // sqlCell locator does not work anymore as the aria label was changed.
    const mdCell = page
      .getByRole("main")
      .getByLabel("Markdown Cell Content")
      .getByRole("textbox");
    await expect.soft(mdCell).not.toHaveText(/^SQL/);

    // Check that typing the magic does not trigger the SQL placeholder
    await mdCell.fill("%%sql");
    await expect.soft(mdCell).toHaveText("%%sql");
    await expect.soft(typeSelector).toHaveValue("markdown");

    // Back to code cell
    await mdCell.fill("");
    await typeSelector.selectOption("Code");

    // This time writing the magic should trigger the SQL placeholder
    await sqlCell.fill("%%sql"); // SQL cell locator should work again
    await expect.soft(sqlCell.locator(".cm-mito-sql-magic")).toHaveCount(1);
    await expect.soft(sqlCell).toHaveText(/^SQL/);
    await expect.soft(typeSelector).toHaveValue("sql");

    // Clearing the placeholder should switch back to code cell
    await page.keyboard.press("Backspace");
    await expect.soft(sqlCell).not.toHaveText(/^SQL/);
    await expect(typeSelector).toHaveValue("code");
  });
});
