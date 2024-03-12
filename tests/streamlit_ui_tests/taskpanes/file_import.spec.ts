
import { expect, test } from '@playwright/test';
import { awaitResponse, checkColumnCellsHaveExpectedValues, checkOpenTaskpane, clickButtonAndAwaitResponse, clickTab, getMitoFrame, getMitoFrameWithTestCSV } from '../utils';

const openImportTaskpaneAndSelectData = async (mito: any, file: string) => {
  await mito.locator('.mito-toolbar-button', { hasText: 'Import' }).click();
  await mito.locator('.mito-dropdown-item', { hasText: 'Import Files' }).click();
  await mito.getByText(file, { exact: true }).dblclick();
}

test.describe('File Import Taskpane', () => {
  
  test('Test import CSV file', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await clickButtonAndAwaitResponse(page, mito, 'Import Files');
    await expect(mito.getByText('test.csv')).toBeVisible();
  });

  test('Test import CSV File with double click', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await openImportTaskpaneAndSelectData(mito, 'test.csv')
    await expect(mito.getByTitle('Column1')).toBeVisible();
  });

  test('Test change imports', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await clickButtonAndAwaitResponse(page, mito, 'Change Imports');
    // Check Change Imports is open taskpane
    await checkOpenTaskpane(mito, 'Change Imports');

    await mito.getByText('test.csv').click();
    await mito.getByText('Replace with file').click();
    await mito.getByText('strings.csv').dblclick();
    await mito.getByRole('button', { name: 'Change Imports', exact: true }).click();
    await mito.getByText('Successfully replayed analysis on new data').click();
  });

  test('Import XLSX file with multiple sheets', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await mito.locator('.mito-toolbar-button', { hasText: 'Import' }).click();
    await mito.locator('.mito-dropdown-item', { hasText: 'Import Files' }).click();
    await mito.getByText('test.xlsx').dblclick();

    await mito.getByText('Import 2 Selected Sheets').click();

    await expect(mito.locator('.tab', { hasText: 'Sheet1' })).toBeVisible();
    await expect(mito.locator('.tab', { hasText: 'Sheet2' })).toBeVisible();
    await expect(mito.locator('.endo-column-header-text', { hasText: 'Column4' })).toBeVisible();
  });

  test('Import XLSX file with single sheet', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await openImportTaskpaneAndSelectData(mito, 'test.xlsx')
    await mito.getByText('Sheet1').click();

    await mito.getByText('Import 1 Selected Sheet').click();

    await expect(mito.locator('.tab', { hasText: 'Sheet1' })).not.toBeVisible();
    await expect(mito.locator('.tab', { hasText: 'Sheet2' })).toBeVisible();
    await expect(mito.locator('.endo-column-header-text', { hasText: 'Column4' })).toBeVisible();
  });

  test('Import XLSX file with configurations', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await openImportTaskpaneAndSelectData(mito, 'test.xlsx')

    // Turn 'Has Header Row' off
    await mito.locator('.spacing-row', { hasText: 'Has Header Row'}).locator('.select-text').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'No' }).click();
    
    await mito.locator('.spacing-row', { hasText: 'Rows to Skip'}).locator('input').fill('2');
    await mito.getByText('Import 2 Selected Sheets').click();

    // Check that the configurations are applied
    await expect(mito.locator('.tab', { hasText: 'Sheet1' })).toBeVisible();
    await expect(mito.locator('.tab', { hasText: 'Sheet2' })).toBeVisible();
    await checkColumnCellsHaveExpectedValues(mito, 0, ['lmnop', 'wxyz'])
    await expect(mito.locator('.endo-column-header-text', { hasText: '0' })).toBeVisible();
    
    // Check that the configurations are applied to the other sheet
    await mito.locator('.tab', { hasText: 'Sheet1'}).click();
    await expect(mito.locator('.endo-column-header-text', { hasText: '0' })).toBeVisible();
    await checkColumnCellsHaveExpectedValues(mito, 0, ['2', '3', '4', '5'])
  });

  test('Range Import with one sheet selected', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await openImportTaskpaneAndSelectData(mito, 'test.xlsx');
    await mito.getByText('Sheet1').click();

    // Click on Range Import
    await mito.getByText('Click here to import multiple ranges.').click();
    
    // Fill in the range and name
    await mito.locator('.spacing-row', { hasText: 'Name' }).locator('input').fill('Range Test')
    await mito.locator('.spacing-row', { hasText: 'Excel Range' }).locator('input').fill('B2:C3');
    await mito.getByText('Import Ranges').click();
  
    await expect(mito.locator('.tab', { hasText: 'Range_Test' })).toBeVisible();
    await checkColumnCellsHaveExpectedValues(mito, 0, ['qrs'])
    await checkColumnCellsHaveExpectedValues(mito, 1, ['tuv'])
  });

  test('Import multiple ranges', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await openImportTaskpaneAndSelectData(mito, 'test.xlsx');
    await mito.getByText('Sheet1').click();

    // Click on Range Import
    await mito.getByText('Click here to import multiple ranges.').click();
    
    // Fill in the range and name
    await mito.locator('.spacing-row', { hasText: 'Name' }).locator('input').fill('Range Test')
    await mito.locator('.spacing-row', { hasText: 'Excel Range' }).locator('input').fill('B2:C3');

    // Add the second range
    await mito.getByText('Add').click();
    await mito.locator('.spacing-row', { hasText: 'Name' }).locator('input').fill('Other Range')
    await mito.locator('.spacing-row', { hasText: 'Locate By' }).locator('.select-text').click();
    await mito.getByText('Dynamic', { exact: true }).click();
    await mito.locator('.spacing-row', { hasText: 'Value' }).locator('input').fill('lmnop');
    
    await mito.getByText('Import Ranges').click();

    // Check that the tabs appear
    await expect(mito.locator('.tab', { hasText: 'Range_Test' })).toBeVisible();
    await expect(mito.locator('.tab', { hasText: 'Other_Range' })).toBeVisible();
    
    // Check the first range (the Other_Range will automatically open)
    await checkColumnCellsHaveExpectedValues(mito, 0, ['wxyz'])
    await checkColumnCellsHaveExpectedValues(mito, 1, ['123'])
    await checkColumnCellsHaveExpectedValues(mito, 2, ['456'])

    // Check the second range
    await mito.getByText('Range_Test').click();
    await checkColumnCellsHaveExpectedValues(mito, 0, ['qrs'])
    await checkColumnCellsHaveExpectedValues(mito, 1, ['tuv'])
  });

  test('Configure CSV imports', async ({ page }) => {
    const mito = await getMitoFrame(page);

    // Open the configure taskpane for the csv with special delimiters
    await mito.locator('.mito-toolbar-button', { hasText: 'Import' }).click();
    await mito.locator('.mito-dropdown-item', { hasText: 'Import Files' }).click();
    await mito.getByText('semicolon-delimiter.csv').click();
    await mito.getByText('Configure').click();

    // Change the delimiter to a semicolon
    await mito.locator('.spacing-row', { hasText: 'Delimiter' }).locator('input').fill(';');
    await mito.locator('.spacing-row', { hasText: 'Decimal Separator' }).locator('.select-text').click();
    await mito.getByText('Comma').click();
    
    // Click the import button and check that the data is correct
    await mito.locator('button', { hasText: 'Import semicolon-delimiter.csv' }).click();
    await checkColumnCellsHaveExpectedValues(mito, 0, [1.00, 4.12, 7.46, 10.30])
  });
});