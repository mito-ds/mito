
import { expect, test } from '@playwright/test';
import { awaitResponse, checkColumnCount, checkColumnExists, checkOpenTaskpane, clickButtonAndAwaitResponse, getColumnHeaderContainer, getMitoFrameWithTestCSV, importCSV } from '../utils';


test.describe('Home Tab Buttons', () => {


  test('Copy Button', async ({ page, browserName }) => {
    if (browserName === 'webkit') {
      test.skip()
    }
    
    const mito = await getMitoFrameWithTestCSV(page);

    await mito.getByTitle('Column1').click();
    await clickButtonAndAwaitResponse(page, mito, 'Copy')

    // TODO: There are some bugs with Playwrite 
    // https://github.com/microsoft/playwright/issues/18901
    // That make it hard to check the clipboard contents
    // But we can check that this has a black border
    // Check that the endo-column-header-final-container has, among it's style, 
    // the text 'border-top: 1px dashed black;'
    await expect(mito.locator('.endo-column-header-final-container').first()).toHaveAttribute('style', /border-top: 1px dashed black;/);
  });

  test('Formatting Buttons', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await clickButtonAndAwaitResponse(page, mito, 'Format all of the selected columns as currency. This only changes the display of the data, and does not effect the underlying dataframe.')
    await expect(mito.getByText('$1', {exact: true})).toBeVisible();
    await clickButtonAndAwaitResponse(page, mito, 'Format all of the selected columns as percentage. This only changes the display of the data, and does not effect the underlying dataframe.')
    await expect(mito.getByText('100%')).toBeVisible();
    await clickButtonAndAwaitResponse(page, mito, 'Increase the number of decimal places that are displayed in the selected number columns.')
    await expect(mito.getByText('100.0%')).toBeVisible();
    await clickButtonAndAwaitResponse(page, mito, 'Decrease the number of decimal places that are displayed in the selected number columns.')
    await expect(mito.getByText('100%')).toBeVisible();
  });

  test('Formatting Select', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await mito.getByText('Default').first().click();
    await mito.getByText('Currency').click();
    await awaitResponse(page);
    await expect(mito.getByText('$1', { exact: true })).toBeVisible();
  });

  test.skip('Conditional Formatting', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await clickButtonAndAwaitResponse(page, mito, 'Conditional Formatting')
    
    await checkOpenTaskpane(mito, 'Conditional Formatting');
    
    // This test is currently broken, for some reason this button won't click
    await mito.getByRole('button', { name: 'Add Conditional Formatting Rule' }).click();
    await mito.locator('div').filter({ hasText: /^Is not empty Applied to 0 columns\.$/ }).first().click();
    await mito.getByRole('checkbox').nth(1).check(); // Check the first column
    await mito.getByRole('textbox').nth(2).fill('#b32929'); // Set the color

    // Check that the .mito-grid-cell containing 1 has 
    // background-color: rgba(179, 41, 41, 0.4)
    await expect(mito.locator('.mito-grid-cell').filter({ hasText: /^1$/ }).first()).toHaveAttribute('style', /background-color: rgba\(179, 41, 41, 0.4\)/);
    // Check that the .mito-grid-cell containing 2 does not 
    // background-color: rgba(179, 41, 41, 0.4)
    await expect(mito.locator('.mito-grid-cell').filter({ hasText: /^2$/ }).first()).not.toHaveAttribute('style', /background-color: rgba\(179, 41, 41, 0.4\)/);  
  });

  test.skip('Color Dataframe', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Format', exact: true })

    await checkOpenTaskpane(mito, 'Color Dataframe');

    await mito.getByText('Column Headers').click();
    await mito.getByRole('textbox').first().fill('#3850b7');

    // Expect the first column header to have a background color of background-color: rgb(56, 80, 183)
    await expect(mito.locator('.endo-column-header-container').first()).toHaveAttribute('style', /background-color: rgb\(56, 80, 183\)/);
  });

  test('Delete Column', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await mito.getByTitle('Column2').click();
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Delete' })

    await expect(mito.getByText('Column2')).not.toBeVisible();
  });

  test('Insert Column', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await mito.getByTitle('Column1').click();
    await mito.locator('[id="mito-toolbar-button-add\\ column\\ to\\ the\\ right"]').getByRole('button', { name: 'Insert' }).click();
    await awaitResponse(page);

    // Expect there to be 4 column headers
    await checkColumnCount(mito, 4);

    // Check that the column with .endo-column-header-container-selected 
    // starts with new-column
    await expect(mito.locator('.endo-column-header-container-selected').first()).toHaveText(/^new-column/);

    // Check that the new column is after Column1
    await expect(mito.locator('.endo-column-header-container').first()).toHaveText(/^Column1/);
    await expect(mito.locator('.endo-column-header-container').nth(1)).toHaveText(/^new-column/);

  });

  test('Filter', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Filter' })

    await checkOpenTaskpane(mito, 'Column1');

    // Filter out all rows, with a > 10 filter
    await mito.getByText('+ Add Filter').click();
    await mito.locator('div').filter({ hasText: /^Add a Filter$/ }).first().click();
    await mito.getByRole('textbox').click();
    await mito.getByRole('textbox').fill('10');
    await mito.getByText('No rows in dataframe.').click();
    await expect(mito.getByText('Removed an additional 4 rows')).toBeVisible();

    // Add another filter and combine with an OR < 10
    await mito.getByText('+ Add Filter').click();
    await mito.locator('div').filter({ hasText: /^Add a Filter$/ }).first().click();
    await mito.getByText('And').click();
    await mito.getByText('Or', { exact: true }).click();
    await mito.getByText('>').nth(1).click();
    await mito.getByText('<').click();
    await mito.locator('div').filter({ hasText: /^Or<$/ }).getByRole('textbox').fill('12');

    // Check that the .mito-grid-cell containing 1 exists
    await expect(mito.locator('.mito-grid-cell').filter({ hasText: /^1$/ }).first()).toBeVisible();
    await expect(mito.getByText('Removed an additional 0 rows')).toBeVisible();
  });

  test('Find and Replace', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Find & Replace' })

    await expect(mito.getByPlaceholder('Find...')).toBeVisible()

    // Check finds 2 in both the cell and the header
    await mito.getByPlaceholder('Find...').fill('2');
    await expect(mito.getByText('0 of 3')).toBeVisible();

    // Replace in selected columns shouldn't work, as Column2 isn't selected
    await mito.locator('.mito-search-bar>.mito-search-button').click();
    await mito.getByPlaceholder('Replace...').fill('13');
    await mito.getByRole('button', { name: 'Replace in Selected Columns' }).click();
    await expect(mito.getByText('Column13')).not.toBeVisible();
    await expect(mito.locator('.mito-grid-cell').filter({ hasText: /^13$/ }).first()).not.toBeVisible();
    await awaitResponse(page);

    // Then, replace all, should work
    await mito.getByRole('button', { name: 'Replace All' }).click();
    await awaitResponse(page);

    await expect(mito.getByText('Column13')).toBeVisible();
    await expect(mito.locator('.mito-grid-cell').filter({ hasText: /^13$/ }).first()).toBeVisible();
  });

  test('Change Dtype Dropdown', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickButtonAndAwaitResponse(page, mito, { name: '▾ Dtype' })
    await mito.getByText('float').click();
    
    await expect(mito.getByText('1.00')).toBeVisible();
  });
  
  test('Pivot Table', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Pivot' })
    
    await checkOpenTaskpane(mito, 'Create Pivot Table test_pivot');

    // Check new empty tab
    await mito.getByText('test_pivot', { exact: true }).click();
    await expect(mito.getByText('test_pivot', { exact: true })).toBeVisible();
    await expect(mito.getByText('No data in dataframe.')).toBeVisible();
    
    // Add a row, column and value
    await mito.getByText('+ Add').first().click();
    await mito.getByText('Column1').click();
    await awaitResponse(page);
    await mito.getByText('+ Add').nth(1).click();
    await mito.getByText('Column2').click();
    await awaitResponse(page);
    await mito.getByText('+ Add').nth(2).click();
    await mito.getByText('Column3').click();
    await awaitResponse(page);

    // Check that the pivot table has been created
    await expect(mito.getByText('Column3 count 2')).toBeVisible();
  });
  
  test('Open Merge (horizontal)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');
    
    await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
    await mito.getByText('Merge (horizontal)').click();

    await expect(mito.getByText('Merge Dataframes')).toBeVisible();

    // Check that Column1 exists
    await checkColumnExists(mito, 'Column1');
  });

  test('Open Concat (vertical)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');
    
    await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
    await mito.getByText('Concat (vertical)').click();

    await expect(mito.getByText('Concatenate Sheet')).toBeVisible();

    // Test that the sheet is empty
    await expect(mito.getByText('No data in dataframe.')).toBeVisible();
  });
  
  test('Anti Merge (unique)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');
    
    await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
    await mito.getByText('Anti Merge (unique)').click();

    await expect(mito.getByText('Merge Dataframes')).toBeVisible();
    await expect(mito.getByText('unique in left')).toBeVisible();
  });

  test('Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('#mito-center-content-container', { hasText: 'Select Data' })).toBeVisible();
    await mito.getByTitle('Select columns to graph on the X axis.').getByText('+ Add').click();
    await mito.locator('.mito-dropdown-item').first().click();
    await expect(mito.locator('.plotly-graph-div').first()).toBeVisible();
  });

  test('AI Not Exist on Enterprise', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    // Check there is no AI button
    await expect(mito.getByRole('button', { name: 'AI' })).not.toBeVisible();
  });

});