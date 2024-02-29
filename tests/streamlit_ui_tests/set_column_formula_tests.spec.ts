import { FrameLocator, Page, expect, test } from '@playwright/test';
import { getMitoFrameWithTypeCSV, createNewColumn, clickButtonAndAwaitResponse, setColumnFormulaUsingCellEditor, getCellAtRowIndexAndColumnName, getValuesInColumn } from './utils';


test.only('Set constant formula to new column using cell editor', async ({ page }) => {
    const columnHeader = 'Column4';

    const mito = await getMitoFrameWithTypeCSV(page);
    await createNewColumn(page, mito, 3, columnHeader);
    await setColumnFormulaUsingCellEditor(page, mito, columnHeader, '5');

    // Check that the value in columnHeader are '5'
    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(Array(cellValues.length).fill('5'));
});

test.only('Set constant formula to existing column using cell editor', async ({ page }) => {
    const columnHeader = 'Column1';

    const mito = await getMitoFrameWithTypeCSV(page);
    await setColumnFormulaUsingCellEditor(page, mito, columnHeader, '5');

    // Check that the value in columnHeader are '5'
    const cellValues = await getValuesInColumn(mito, columnHeader);
    expect(cellValues).toEqual(Array(cellValues.length).fill('5'));
});
