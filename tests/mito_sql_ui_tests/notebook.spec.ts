import { expect, test } from "@jupyterlab/galata";

const MITO_AI_HELPER_TEXT_CODE_CELL = "Start writing python or Press Ctrl + E to ask Mito AI to write code for you."
const MITO_AI_HELPER_TEXT_MD_CELL = "Start writing markdown."

test.describe("Mito SQL cell", () => {
  test("should insert a SQL configuration cell", async ({ page }) => {
    await page.notebook.createNew("sqlConfig.ipynb");

    const firstCell = page.getByRole("main").getByRole("textbox").first();
    // Check configuration cell content
    await expect
      .soft(firstCell)
      .toHaveText(
        /# DO NOT EDIT this cell; it is required for Mito SQL cells to work.# It must be executed prior to any SQL cell.%load_ext sql%config SqlMagic.autopandas=True%config SqlMagic.dsn_filename=\"[\w\/]+\/.mito\/connections.ini\"/
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
    const secondCell = page.getByRole("main").getByRole("textbox").nth(1);
    await secondCell.click();

    // Check the cell type is code by default
    await expect.soft(typeSelector).toHaveValue("code");

    // Switch to SQL type
    await typeSelector.selectOption("SQL");
    await expect.soft(secondCell.locator(".cm-mito-sql-magic")).toHaveCount(1);
    await expect.soft(secondCell).toHaveText("SQL");

    // Switch to Code type should erase the magic
    await typeSelector.selectOption("Code");
    await expect.soft(secondCell).toHaveText(MITO_AI_HELPER_TEXT_CODE_CELL);

    // Switch to Markdown type should erase the magic
    await typeSelector.selectOption("SQL");
    await expect.soft(secondCell).toHaveText("SQL");
    await typeSelector.selectOption("Markdown");
    await expect.soft(secondCell).toHaveText(MITO_AI_HELPER_TEXT_MD_CELL);

    // Check that typing the magic does not trigger the SQL placeholder
    await secondCell.fill("%%sql");
    await expect.soft(secondCell).toHaveText("%%sql");
    await expect.soft(typeSelector).toHaveValue("markdown");

    // Back to code cell
    await secondCell.fill("");
    await typeSelector.selectOption("Code");

    // This time writing the magic should trigger the SQL placeholder
    await secondCell.fill("%%sql");
    await expect.soft(secondCell.locator(".cm-mito-sql-magic")).toHaveCount(1);
    await expect.soft(secondCell).toHaveText("SQL");
    await expect.soft(typeSelector).toHaveValue("sql");

    // Clearing the placeholder should switch back to code cell
    await page.keyboard.press("Backspace");
    await expect.soft(secondCell).toHaveText(MITO_AI_HELPER_TEXT_CODE_CELL);
    await expect(typeSelector).toHaveValue("code");
  });
});
