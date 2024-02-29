import { FrameLocator, Page, expect, test } from '@playwright/test';
import { getMitoFrameWithTypeCSV, createNewColumn, clickButtonAndAwaitResponse, setColumnFormulaUsingCellEditor, getCellAtRowIndexAndColumnName, getValuesInColumn, getMitoFrameWithTestCSV, awaitResponse } from './utils';


test('Set constant formula to new column using cell editor', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTypeCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);
    await setColumnFormulaUsingCellEditor(page, mito, columnHeader, '=5');

    // Check that the value in columnHeader are '5'
    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(Array(cellValues.length).fill('5'));

    // Test that reopening the cell editor displays the formula
    const cell = await getCellAtRowIndexAndColumnName(mito, 0, columnHeader);
    await cell.dblclick();
    await expect(mito.locator('#cell-editor-input')).toHaveValue('=5');

    // Check that the formula bar also displays the formula
    expect(await (mito.locator('.formula-bar-formula')).textContent()).toEqual('=5');

    // Test that using escape closes the cell editor
    await expect(mito.locator('#cell-editor-input')).toBeVisible();
    await mito.locator('#cell-editor-input').press('Escape');
    await expect(mito.locator('#cell-editor-input')).not.toBeVisible();
});

test('Set constant formula to existing column using cell editor', async ({ page }) => {
    const columnHeader = 'Column1';

    const mito = await getMitoFrameWithTypeCSV(page);
    await setColumnFormulaUsingCellEditor(page, mito, columnHeader, '=5');

    // Check that the value in columnHeader are '5'
    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(Array(cellValues.length).fill('5'));
});

test('Set formula referencing other columns (typing column headers) and then update it', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);
    
    // In this test, we reference the columns just by the column header without the row number
    await setColumnFormulaUsingCellEditor(page, mito, columnHeader, '=Column1 + Column2');

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['3', '9', '15', '21']);

    await setColumnFormulaUsingCellEditor(page, mito, columnHeader, '=Column1');
    const newCellValues = await getValuesInColumn(mito, columnHeader);
    expect(newCellValues).toEqual(['1', '4', '7', '10']);
});

test('Set formula with spreadsheet formula', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    // In this test, we reference the columns by column header and row number
    await setColumnFormulaUsingCellEditor(page, mito, columnHeader, '=SUM(Column10 + Column20)');

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['3', '9', '15', '21']);
});

test('Setting formula with invalid formula displays error message', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    await setColumnFormulaUsingCellEditor(page, mito, columnHeader, '=UNSUPPORTED_FORMULA()');
    await expect(mito.getByText(/Sorry, mito does not currently support the function/)).toBeVisible();
});

test('Reference cell by clicking on it', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    const cell = await getCellAtRowIndexAndColumnName(mito, 0, columnHeader);
    await cell.dblclick();

    await (mito.locator('.mito-grid-cell').first()).click();
    await mito.locator('#cell-editor-input').press('Enter');
    await awaitResponse(page);

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['1', '4', '7', '10']);
});

test('Reference column by clicking on column header', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    const cell = await getCellAtRowIndexAndColumnName(mito, 0, columnHeader);
    await cell.dblclick();
    await mito.getByRole('textbox').fill('=SUM(');

    await (mito.getByText('Column1')).click();
    // Type the rest of the formula
    await (mito.getByRole('textbox')).press(')')
    await mito.locator('#cell-editor-input').press('Enter');
    await awaitResponse(page);

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['22', '22', '22', '22']);
});

test('Reference cell in previous row by clicking on it', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    const cell = await getCellAtRowIndexAndColumnName(mito, 1, columnHeader);
    await cell.dblclick();

    await (mito.locator('.mito-grid-cell').first()).click();
    await mito.locator('#cell-editor-input').press('Enter');
    await awaitResponse(page);

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['0', '1', '4', '7']);
});

test('Use arrow keys to select cell', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    const cell = await getCellAtRowIndexAndColumnName(mito, 0, columnHeader);
    await cell.dblclick();
    await mito.getByRole('textbox').fill('=');

    await page.keyboard.press('ArrowLeft');

    await mito.locator('#cell-editor-input').press('Enter');
    await awaitResponse(page);

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['3', '6', '9', '12']);
});

test('Use arrow keys to select rolling range', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    const cell = await getCellAtRowIndexAndColumnName(mito, 0, columnHeader);
    await cell.dblclick();
    await mito.getByRole('textbox').fill('=SUM(');

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press(')');

    await mito.locator('#cell-editor-input').press('Enter');
    await awaitResponse(page);

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['5', '11', '17', '23']);
});


test('No formula around rolling range displays [object Object]', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    const cell = await getCellAtRowIndexAndColumnName(mito, 0, columnHeader);
    await cell.dblclick();
    await mito.getByRole('textbox').fill('=');

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');

    await mito.locator('#cell-editor-input').press('Enter');
    await awaitResponse(page);

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['[object Object]', '[object Object]', '[object Object]', '[object Object]']);
});
