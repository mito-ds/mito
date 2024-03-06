import { FrameLocator, Page, expect, test } from '@playwright/test';
import { 
    getMitoFrameWithTypeCSV, 
    createNewColumn, 
    setFormulaUsingCellEditor, 
    getCellAtRowIndexAndColumnName, 
    getValuesInColumn, 
    getMitoFrameWithTestCSV, 
    awaitResponse, 
    toggleEditEntireColumn, 
    importCSV,
    checkColumnCellsHaveExpectedValues
} from '../utils';


test('Set constant formula to new column using cell editor', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTypeCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);
    await setFormulaUsingCellEditor(page, mito, columnHeader, '=5');

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
    await setFormulaUsingCellEditor(page, mito, columnHeader, '=5');

    // Check that the value in columnHeader are '5'
    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(Array(cellValues.length).fill('5'));
});

test('Set formula referencing other columns (typing column headers) and then update it', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);
    
    // In this test, we reference the columns just by the column header without the row number
    await setFormulaUsingCellEditor(page, mito, columnHeader, '=Column1 + Column2');

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['3', '9', '15', '21']);

    await setFormulaUsingCellEditor(page, mito, columnHeader, '=Column1');
    const newCellValues = await getValuesInColumn(mito, columnHeader);
    expect(newCellValues).toEqual(['1', '4', '7', '10']);
});

test('Set formula with spreadsheet formula', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    // In this test, we reference the columns by column header and row number
    await setFormulaUsingCellEditor(page, mito, columnHeader, '=SUM(Column10 + Column20)');

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['3', '9', '15', '21']);
});

test('Setting formula with invalid formula displays error message', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    await setFormulaUsingCellEditor(page, mito, columnHeader, '=UNSUPPORTED_FORMULA()');
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

test('Edit individual cell only applied to edited cell and preserves formula and toggle on next open of cell editor', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    await setFormulaUsingCellEditor(page, mito, columnHeader, '5', 0, 'individual cell');

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['5', '0', '0', '0']);

    // Reopening the cell editor should leave the edit entire column toggle OFF
    // and contain the formula
    const cell = await getCellAtRowIndexAndColumnName(mito, 0, columnHeader);
    await cell.dblclick();
    await expect(mito.locator('label div')).not.toHaveClass('checked');
    await expect(mito.locator('#cell-editor-input')).toHaveValue('5');

});

test('Edit single cell can overwrite formula', async ({ page }) => {

    const columnHeader = 'Column4';
    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);
    await setFormulaUsingCellEditor(page, mito, columnHeader, '=Column1 + Column2');

    await setFormulaUsingCellEditor(page, mito, columnHeader, '=100', 0, 'individual cell');

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['100', '9', '15', '21']);

});

test('Toggling edit entire column does not overwrite formula', async ({ page }) => {
    const columnHeader = 'Column4';
    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    const cell = await getCellAtRowIndexAndColumnName(mito, 0, columnHeader);
    await cell.dblclick();
    await mito.getByRole('textbox').fill('=10');
    
    await toggleEditEntireColumn(mito);
    await expect(mito.locator('#cell-editor-input')).toHaveValue('=10');
    await toggleEditEntireColumn(mito);
    await expect(mito.locator('#cell-editor-input')).toHaveValue('=10');
});

test.skip('Write spreadsheet formula (referencing entire column) applied to individual cell', async ({ page }) => {
    const columnHeader = 'Column4';
    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    const cell = await getCellAtRowIndexAndColumnName(mito, 0, columnHeader);
    await cell.dblclick();
    await toggleEditEntireColumn(mito);
    await mito.getByRole('textbox').fill('=SUM(');
    await (mito.getByText('Column1')).click();
    await (mito.getByRole('textbox')).press(')')
    await mito.locator('#cell-editor-input').press('Enter');
    await awaitResponse(page);

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['1', '0', '0', '0']);
});

test('Write spreadsheet formula applied to individual cell', async ({ page }) => {
    const columnHeader = 'Column4';
    const mito = await getMitoFrameWithTestCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);

    const cell = await getCellAtRowIndexAndColumnName(mito, 0, columnHeader);
    await cell.dblclick();
    await toggleEditEntireColumn(mito);
    await mito.getByRole('textbox').fill('=SUM(');
    await (mito.locator('.mito-grid-cell').first()).click();
    await (mito.getByRole('textbox')).press(')')
    await mito.locator('#cell-editor-input').press('Enter');
    await awaitResponse(page);

    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(['1', '0', '0', '0']);
});

test('Cross-sheet formula with VLOOKUP', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'merge.csv');

    // Add a new column to put the VLOOKUP call in 
    await mito.locator('.mito-toolbar-button', { hasText: 'Insert' }).click();
    await mito.locator('.mito-grid-cell[mito-col-index="1"]').first().dblclick();

    // Start the VLOOKUP formula
    await mito.locator('input#cell-editor-input').fill('=VLOOKUP(');
    // Click on the first cell in Column1 to reference it as the first argument
    await mito.locator('.mito-grid-cell[mito-col-index="0"]').first().click();
    // Type the comma to separate the arguments
    await mito.locator('input#cell-editor-input').press(',');

    // Navigate to the other sheet and select the range of columns
    await mito.locator('.tab', { hasText: 'test' }).click();
    await expect(mito.locator('.endo-column-header-final-text', { hasText: /new-column/ })).not.toBeVisible();
    await mito.locator('.endo-column-header-final-text', { hasText: 'Column1' }).click();
    await mito.locator('.endo-column-header-final-text', { hasText: 'Column3' }).click({ modifiers: ['Shift'] });
    // Finish the formula
    await mito.locator('input#cell-editor-input').pressSequentially(', 2)');

    // Navigate back to the first sheet and check that the values are correct
    await mito.locator('.tab', { hasText: 'merge' }).click();
    await mito.locator('input#cell-editor-input').press('Enter');
    await checkColumnCellsHaveExpectedValues(mito, 1, ['2.00', '5.00', '5.00', 'NaN', '11.00'])
});


test('Cross-sheet formula with VLOOKUP - pressing enter from another sheet', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'merge.csv');

    // Add a new column to put the VLOOKUP call in 
    await mito.locator('.mito-toolbar-button', { hasText: 'Insert' }).click();
    await mito.locator('.mito-grid-cell[mito-col-index="1"]').first().dblclick();

    // Start the VLOOKUP formula
    await mito.locator('input#cell-editor-input').fill('=VLOOKUP(');
    // Click on the first cell in Column1 to reference it as the first argument
    await mito.locator('.mito-grid-cell[mito-col-index="0"]').first().click();
    // Type the comma to separate the arguments
    await mito.locator('input#cell-editor-input').press(',');

    // Navigate to the other sheet and select the range of columns
    await mito.locator('.tab', { hasText: 'test' }).click();
    await expect(mito.locator('.endo-column-header-final-text', { hasText: /new-column/ })).not.toBeVisible();
    await mito.locator('.endo-column-header-final-text', { hasText: 'Column1' }).click();
    await mito.locator('.endo-column-header-final-text', { hasText: 'Column3' }).click({ modifiers: ['Shift'] });
    // Finish the formula
    await mito.locator('input#cell-editor-input').pressSequentially(', 2)');
    await mito.locator('input#cell-editor-input').press('Enter');

    // Expect that it navigated automatically back to the original sheet and that the values are correct
    await checkColumnCellsHaveExpectedValues(mito, 1, ['2.00', '5.00', '5.00', 'NaN', '11.00'])
});

test('Can\'t use cross-sheet formula for non-vlookup calls', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'merge.csv');

    await mito.locator('.mito-grid-cell[mito-col-index="1"]').first().dblclick();
    await mito.locator('input#cell-editor-input').fill('=SUM(');
    await mito.locator('.tab', { hasText: 'test' }).click();
    await mito.locator('.mito-grid-cell[mito-col-index="0"]').first().click();
    await mito.locator('input#cell-editor-input').press('Enter');
    await expect(mito.getByText('Cross-sheet references are only allowed in calls to VLOOKUP')).toBeVisible();
});
