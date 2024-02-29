import { FrameLocator, Page, expect, test } from '@playwright/test';
import { getMitoFrameWithTypeCSV, createNewColumn, clickButtonAndAwaitResponse, setColumnFormulaUsingCellEditor, getCellAtRowIndexAndColumnName, getValuesInColumn, getMitoFrameWithTestCSV } from './utils';


test('Set constant formula to new column using cell editor', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTypeCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);
    await setColumnFormulaUsingCellEditor(page, mito, columnHeader, '=5');

    // Check that the value in columnHeader are '5'
    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(Array(cellValues.length).fill('5'));
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


