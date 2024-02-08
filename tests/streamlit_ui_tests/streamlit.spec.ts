import { test, expect } from '@playwright/test';
import { awaitResponse, checkOpenTaskpane, clickButtonAndAwaitResponse, clickTab, getColumnHeaderContainer, getMitoFrame, getMitoFrameWithTestCSV, getMitoFrameWithTypeCSV, importCSV } from './utils'

test.describe.configure({ mode: 'parallel' });


test('Can render Mito spreadsheet', async ({ page }) => {

  const mito = await getMitoFrame(page);
  await mito.getByRole('button', { name: 'Import Files' }).click();
  await expect(mito.getByText('test.csv')).toBeVisible();
});


test.describe('Home Tab Buttons', () => {

  test('Import CSV File (Double Click)', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await mito.getByRole('button', { name: 'Import Files' }).click();
    await mito.getByText('test.csv').dblclick();
    await expect(mito.getByTitle('Column1')).toBeVisible();
  });

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

    await mito.getByTitle('Column1').click();
    await clickButtonAndAwaitResponse(page, mito, { name: 'Delete' })

    await expect(mito.getByText('Column1')).not.toBeVisible();
  });

  test('Insert Column', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await mito.getByTitle('Column1').click();
    await mito.locator('[id="mito-toolbar-button-add\\ column\\ to\\ the\\ right"]').getByRole('button', { name: 'Insert' }).click();
    await awaitResponse(page);

    // Expect there to be 4 column headers
    await expect(mito.locator('.endo-column-header-container')).toHaveCount(4);

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
    await mito.locator('#mito-center-content-container').getByRole('button').first().click();
    await mito.getByPlaceholder('Replace...').fill('13');
    await mito.getByRole('button', { name: 'Replace in Selected Columns' }).click();
    await expect(mito.getByText('Column13')).not.toBeVisible();
    await expect(mito.locator('.mito-grid-cell').filter({ hasText: /^13$/ }).first()).not.toBeVisible();

    // Then, replace all, should work
    await mito.getByRole('button', { name: 'Replace All' }).click();
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
    const ch1 = await getColumnHeaderContainer(mito, 'Column1');
    await expect(ch1).toBeVisible();
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

    await expect(mito.locator('#mito-center-content-container').getByText('Select Data')).toBeVisible();
    await mito.getByTitle('Select columns to graph on the X axis.').getByText('+ Add').click();
    await mito.locator('.mito-dropdown-item').first().click();
    await expect(mito.locator('.plotly-graph-div').first()).toBeVisible();
  });

  test('Graph from selection', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await mito.getByTitle('Column1').click();
    await mito.getByTitle('Column2').click({ modifiers: ['Shift']});
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('p.select-text').getByText('Column1')).toBeVisible();
    await expect(mito.locator('p.select-text').getByText('Column2')).toBeVisible();
  })

  test('Graph from selection with columns selected in reverse order', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await mito.getByTitle('Column2').click();
    await mito.getByTitle('Column1').click({ modifiers: ['Shift']});
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('.graph-sidebar-toolbar-content .select-container').nth(1)).toHaveText('Column1');
    await expect(mito.locator('.graph-sidebar-toolbar-content .select-container').nth(2)).toHaveText('Column2');
  })

  test('Change Chart type to Linear', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
    await mito.getByText('Line').hover();
    await clickButtonAndAwaitResponse(page, mito, { name: 'Linear' })

    await expect(mito.getByText('Column1 line')).toBeVisible();
  });

  test('Change Chart type to Horizontal Line Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
    await mito.getByText('Line').hover();
    await clickButtonAndAwaitResponse(page, mito, { name: 'Horizontal' })

    await expect(mito.getByText('Column1 line')).toBeVisible();
  });

  test('Change Chart type to vertical grouped bar Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
    await mito.getByRole('button', { name: 'Bar' }).hover();
    await mito.getByRole('button', { name: 'Grouped' }).first().click();
    await awaitResponse(page);

    await expect(mito.getByText('Column1 bar')).toBeVisible();
  });


  test('Change Chart type to horizontal grouped bar Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
    await mito.getByRole('button', { name: 'Bar' }).hover();
    await mito.getByRole('button', { name: 'Grouped' }).nth(1).click();
    await awaitResponse(page);

    await expect(mito.getByText('Column1 bar')).toBeVisible();
  });

  test('Change Chart type to scatter', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
    await clickButtonAndAwaitResponse(page, mito, { name: 'Scatter' })

    await expect(mito.getByText('Column1 scatter plot')).toBeVisible();
  });

  test('Close Select Data taskpane then open it again', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('#mito-center-content-container').getByText('Select Data')).toBeVisible();
    await mito.locator('.spacing-row', { hasText: 'Select Data' }).locator('svg').click();
    await expect(mito.locator('.spacing-row', { hasText: 'Select Data' })).not.toBeVisible();

    await clickButtonAndAwaitResponse(page, mito, { name: 'Select Data' })
    await expect(mito.locator('.spacing-row', { hasText: 'Select Data' })).toBeVisible();
  });

  test('Scatter plot from selection', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await mito.getByTitle('Column1').click();
    await mito.getByTitle('Column2').click({ modifiers: ['Shift']});
    
    await clickTab(page, mito, 'Insert');
    await clickButtonAndAwaitResponse(page, mito, { name: 'Create an interactive scatter plot.' })

    await expect(mito.locator('p.select-text').getByText('Column1')).toBeVisible();
    await expect(mito.locator('p.select-text').getByText('Column2')).toBeVisible();
  })

  test('Update Graph Title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByText('Column1 bar chart').dblclick();

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('My Graph Title');
    await mito.locator('.popup-input').press('Enter');

    await awaitResponse(page);
    await expect(mito.getByText('My Graph Title')).toBeVisible();
  });

  test('Update X axis Title on double click', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.locator('.g-xtitle', { hasText: 'count' }).dblclick();

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('X axis Title');
    await mito.locator('.popup-input').press('Enter');

    await awaitResponse(page);
    await expect(mito.locator('.g-xtitle', { hasText: 'X axis Title' })).toBeVisible();
  });

  test('Update Y axis Title with double click', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.locator('.g-ytitle', { hasText: 'Column1' }).dblclick();

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('Y axis Title');
    await mito.locator('.popup-input').press('Enter');

    await awaitResponse(page);
    await expect(mito.locator('.g-ytitle', { hasText: 'Y axis Title' })).toBeVisible();
  });

  test('Update X axis title through toolbar', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.locator('.g-xtitle', { hasText: 'count' })).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Axis Titles' }).hover();
    await mito.getByRole('button', { name: 'Edit X Axis Title' }).click();
    await awaitResponse(page);

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('X axis Title');
    await mito.locator('.popup-input').press('Enter');

    await awaitResponse(page);
    await expect(mito.locator('.g-xtitle', { hasText: 'X axis Title' })).toBeVisible();
  });

  test('Update Y axis title through toolbar', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.locator('.g-ytitle', { hasText: 'Column1' })).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Axis Titles' }).hover();
    await mito.getByRole('button', { name: 'Edit Y Axis Title' }).click();
    await awaitResponse(page);

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('Y axis Title');
    await mito.locator('.popup-input').press('Enter');

    await awaitResponse(page);
    await expect(mito.locator('.g-ytitle', { hasText: 'Y axis Title' })).toBeVisible();
  });

  test('Hide X axis title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('count')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Axis Titles' }).hover();
    await mito.getByRole('button', { name: 'Horizontal' }).click();
    await awaitResponse(page);

    await expect(mito.getByText('count')).not.toBeVisible();
  });

  test('Hide Y axis title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.locator('.g-ytitle', { hasText: 'Column1' })).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Axis Titles' }).hover();
    await mito.getByRole('button', { name: 'Vertical' }).click();
    await awaitResponse(page);

    await expect(mito.locator('.g-ytitle', { hasText: 'Column1' })).not.toBeVisible();
  });

  test('Hide graph title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart' })).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Chart Title' }).hover();
    await mito.getByRole('button', { name: 'Display Title' }).click();
    await awaitResponse(page);

    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart' })).not.toBeVisible();
  });

  test('Hide range slider', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.locator('.rangeslider-slidebox')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Show Range Slider' }).hover();
    await mito.getByRole('button', { name: 'None' }).click();
    await awaitResponse(page);

    await expect(mito.locator('.rangeslider-slidebox')).not.toBeVisible();
  });

  test('Escape key closes graph title input', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByText('count').dblclick();

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('Y axis Title');
    await mito.locator('.popup-input').press('Escape');

    await awaitResponse(page);
    await expect(mito.getByText('count')).toBeVisible();
  });

  test('AI Not Exist on Enterprise', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    // Check there is no AI button
    await expect(mito.getByRole('button', { name: 'AI' })).not.toBeVisible();
  });

});

test.describe('Insert Tab Buttons', () => {

  test('Test Pivot', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, { name: 'Pivot', exact: true });

    await checkOpenTaskpane(mito, 'Create Pivot Table test_pivot');
    // We test functionality elsewhere, so we skip here
  });

  test('Test Unpivot', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, 'Unpivot');
    await checkOpenTaskpane(mito, 'Unpivot Dataframe');

    // Check that column headers variable and value exist
    const variable = await getColumnHeaderContainer(mito, 'variable');
    await expect(variable).toBeVisible();
    const value = await getColumnHeaderContainer(mito, 'value');
    await expect(value).toBeVisible();

    // Toggle .multi-toggle-box-row with text Column1
    await mito.locator('.multi-toggle-box-row').filter({ hasText: 'Column1' }).first().click();
    await awaitResponse(page);

    // Check that column1 is now in the variable column
    const Column1 = await getColumnHeaderContainer(mito, 'Column1');
    await expect(Column1).toBeVisible();
  });

  test('Test Transpose', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, 'Transpose');

    // Check that the .endo-column-header-container with text Column1 exists
    const Column0 = await getColumnHeaderContainer(mito, '0');
    await expect(Column0).toBeVisible();
  });

  test('Test Merge', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, { name: 'Merge', exact: true });

    await expect(mito.getByText('Merge Dataframes')).toBeVisible();
    // We test merge functionality elsewhere, so we skip here
  });

  test('Test Concat', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, 'Concat');

    await expect(mito.getByText('Concatenate Sheet')).toBeVisible();
    // We test concat functionality elsewhere, so we skip here

  });

  test('Test Anti-merge', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, 'Anti-merge');

    await checkOpenTaskpane(mito, 'Merge Dataframes');
    await expect(mito.getByText('unique in left')).toBeVisible();
    // We test anti-merge functionality elsewhere, so we skip here
  });

  test('Test Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph', exact: true });

    await expect(mito.locator('#mito-center-content-container').getByText('Select Data')).toBeVisible();
    // We test graph functionality elsewhere, so we skip here
  });

  test('Test Graph (scatter)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, { name: 'Create an interactive scatter plot.' });
    await expect(mito.locator('#mito-center-content-container').getByText('Select Data')).toBeVisible();

    await clickButtonAndAwaitResponse(page, mito, { name: 'Change Chart Type' });
    // Check that there are 2 icons under the "checked" div in the chart type dropdown
    await expect(mito.locator('.mito-dropdown-item-icon-and-title-container', { hasText: 'Scatter' }).locator('svg')).toHaveCount(2);
  });

  test('Test Graph (line)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, { name: 'Create an interactive line graph.' });
    await expect(mito.locator('#mito-center-content-container').getByText('Select Data')).toBeVisible();

    await clickButtonAndAwaitResponse(page, mito, { name: 'Change Chart Type' });
    // Check that there are 2 icons under the "checked" div in the chart type dropdown
    await expect(mito.locator('.mito-dropdown-item-icon-and-title-container', { hasText: 'Line' }).locator('svg')).toHaveCount(2);
  });

})

test.describe('Data Tab Buttons', () => {

  test('Test Import Files', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await clickButtonAndAwaitResponse(page, mito, 'Import Files');
    await expect(mito.getByText('test.csv')).toBeVisible();
  });
  
  test('Test Import Dataframes', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await clickButtonAndAwaitResponse(page, mito, 'Import Dataframes');
    // Check Import Dataframes is open taskpane
    await checkOpenTaskpane(mito, 'Import Dataframes');

    // TODO: Test functionality
  });

  test('Test Snowflake Import', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await clickButtonAndAwaitResponse(page, mito, 'Snowflake Import');
    // Check Snowflake Import is open taskpane
    await checkOpenTaskpane(mito, 'Import from Snowflake');

    // TODO: Test functionality
  });

  test('Test Change Imports', async ({ page }) => {
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

  test('Test Sort Descending', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await mito.getByRole('button', { name: 'Sort a column in descending order.' }).click();

    // Check that the first .mito-grid-cell has text 10
    await expect(mito.locator('.mito-grid-cell').first()).toHaveText('10');
  });

  test('Test Sort Ascending', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await mito.getByRole('button', { name: 'Sort a column in descending order.' }).click();
    await mito.getByRole('button', { name: 'Sort a column in ascending order.' }).click();

    // Check that the first .mito-grid-cell has text 1
    await expect(mito.locator('.mito-grid-cell').first()).toHaveText('1');
  });

  test('Test Sort', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await mito.getByRole('button', { name: 'Sort', exact: true }).click();

    // Expect that Column1 is open taskpane
    await checkOpenTaskpane(mito, 'Column1');
  });

  test('Test Filter', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await mito.getByRole('button', { name: 'Filter', exact: true }).click();

    // Expect that Column1 is open taskpane
    await checkOpenTaskpane(mito, 'Column1');
  });

  test('Test Text To Columns', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await importCSV(page, mito, 'strings.csv');
    await clickTab(page, mito, 'Data');

    await mito.getByText('Column2').click();
    await mito.getByRole('button', { name: 'Text to Columns' }).click();
    await mito.locator('input[name="Dash"]').check();
    await mito.getByRole('button', { name: 'Split on delimiter' }).click();

    // Check that there are 4 columsn
    await expect(mito.locator('.endo-column-header-container')).toHaveCount(4);
  });

  test('Test Bulk Rename Columns', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await mito.getByRole('button', { name: 'Rename Columns' }).click();

    await mito.getByRole('button', { name: 'Uppercase 3 Headers' }).click();
    await expect(mito.getByText('COLUMN1', { exact: true}).first()).toBeVisible();

    await mito.getByRole('button', { name: 'Lowercase 3 Headers' }).click();
    await expect(mito.getByText('column1', { exact: true}).first()).toBeVisible();

    await mito.getByRole('textbox').first().fill('column');
    await mito.getByRole('textbox').nth(1).fill('dork');
    await mito.getByRole('button', { name: 'Replace in 3 Headers' }).click();
    await expect(mito.getByText('dork1', { exact: true}).first()).toBeVisible();
  });

  test('Test Remove Duplicates', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await importCSV(page, mito, 'strings.csv');
    await clickTab(page, mito, 'Data');

    await mito.getByRole('button', { name: 'Remove Duplicates' }).click();
    await mito.getByRole('button', { name: 'Drop duplicates in 2 columns' }).click();

    // Check that Removed 1 rows. is visible
    await expect(mito.getByText('Removed 1 rows.')).toBeVisible();
  });

  test('Test Fill Missing Values', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await importCSV(page, mito, 'types.csv');
    await clickTab(page, mito, 'Data');

    // Check there is one NaN
    await expect(mito.getByText('NaN', { exact: true}).first()).toBeVisible();

    await mito.getByText('Column2').click();

    await mito.getByRole('button', { name: 'Fill Missing Values' }).click();
    await mito.getByRole('button', { name: 'Fill NaNs in Column2' }).click();

    // Check there are no NaNs
    await expect(mito.getByText('NaN', { exact: true}).first()).not.toBeVisible();
  });

  test('Test One-hot Encoding', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await importCSV(page, mito, 'types.csv');
    await clickTab(page, mito, 'Data');

    await mito.getByText('Column3').click();
    await mito.getByRole('button', { name: 'One-hot Encoding' }).click();

    // Check there are 6 columns
    await expect(mito.locator('.endo-column-header-container')).toHaveCount(6);
  });

  test('Test Reset and Keep Index', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await mito.getByRole('button', { name: '▾ Reset Index' }).click();
    await mito.getByText('Reset and Keep Index').click();
    await awaitResponse(page);

    // Check there is a header called index
    const indexColumnHeader = await getColumnHeaderContainer(mito, 'index');
    await expect(indexColumnHeader).toBeVisible();
  });

  test('Test Reset and Drop Index', async ({ page }) => {
      const mito = await getMitoFrameWithTestCSV(page);
      await clickTab(page, mito, 'Data');

      // Sort descending
      await mito.getByRole('button', { name: 'Sort a column in descending order.' }).click();
      await awaitResponse(page);

      // Reset and Drop Index
      await mito.getByRole('button', { name: '▾ Reset Index' }).click();
      await mito.getByText('Reset and Drop Index').click();
      await awaitResponse(page);

      // Check there is no header called index
      const indexColumnHeader = await getColumnHeaderContainer(mito, 'index');
      await expect(indexColumnHeader).not.toBeVisible();

      // Check that the first .mito-grid-cell has text 10
      await expect(mito.locator('.mito-grid-cell').first()).toHaveText('10');

      // Check the first .index-header-container has text 0
      await expect(mito.locator('.index-header-container').first()).toHaveText('0');
  });

});
test.describe('Code Tab Buttons', () => {

  test('Test Copy Code', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Code');

    await mito.getByRole('button', { name: 'Copy Code' }).click();
    // Check the code is copied to the clipboard
    // TODO: There are some bugs with Playwrite, that make it hard to check the clipboard contents
  });

  test('Test Configure Code', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Code');

    await mito.getByRole('button', { name: 'Configure Code' }).click();
    await checkOpenTaskpane(mito, 'Generated Code Options');

    await mito.locator('.toggle').first().click();
    await mito.getByRole('textbox').fill('new name');
    // Wanna check some output

  });

  test('Test Code Snippets', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Code');

    await mito.getByRole('button', { name: 'Code Snippets' }).click();
    await checkOpenTaskpane(mito, 'Code Snippets');
  });

  test('Test Schedule Automation', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Code');

    await mito.getByRole('button', { name: 'Schedule Automation' }).click();
    await checkOpenTaskpane(mito, 'Schedule on Github');
  });
});
  
test.describe('Keyboard Shortcuts', () => {
  test('Select Column', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.getByText('5', { exact: true }).click();
    await page.keyboard.press('Control+ ');
    await expect(mito.locator('.endo-column-header-container-selected .endo-column-header-final-text')).toHaveText('Column2');
  })

  test('Select Row', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.getByTitle('5', { exact: true }).click();
    await page.keyboard.press('Shift+ ');
    await expect(mito.locator('.index-header-selected')).toHaveText('1');
  })

  test('Select Row with multiple rows', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.getByTitle('5', {exact: true}).click();
    await mito.getByTitle('8').click({ modifiers: ['Shift']});
    await page.keyboard.press('Shift+ ');
    await expect(mito.locator('.index-header-selected')).toHaveCount(2);
    await expect(mito.locator('.index-header-selected').first()).toHaveText('1');
    await expect(mito.locator('.index-header-selected').nth(1)).toHaveText('2');
  })

  test.skip('Select All', async ({ page, browserName }) => {
    if (browserName === 'webkit') {
      test.skip()
    }

    const mito = await getMitoFrameWithTestCSV(page);
    await page.keyboard.press('Control+a');
    await expect(mito.locator('.endo-column-header-container-selected')).toHaveCount(3);
  });
  
  test('Next Sheet', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');

    // Check that the tab with .tab-selected is the second tab, 
    // with the text test_1
    await expect(mito.locator('.tab-selected').locator('div').filter({ hasText: "test_1" }).first()).toBeVisible();

    await page.keyboard.press('Alt+ArrowRight');

    // Check that the tab with .tab-selected is the first tab
    // with the text test
    await expect(mito.locator('.tab-selected').locator('div').filter({ hasText: "test" }).first()).toBeVisible();
  });

  test('Previous Sheet', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');
    await importCSV(page, mito, 'test.csv');

    await page.keyboard.press('Alt+ArrowLeft');
    await expect(mito.locator('.tab-selected').locator('div').filter({ hasText: "test_1" }).first()).toBeVisible();
  });

  test('Find and Replace', async ({ page, browserName }) => {
    if (browserName === 'webkit') {
      test.skip()
    }

    const mito = await getMitoFrameWithTestCSV(page);
    await page.keyboard.press('Control+Shift+h');
    await awaitResponse(page);
    await expect(mito.getByPlaceholder('Find...')).toBeVisible()
    await expect(mito.getByPlaceholder('Replace...')).toBeVisible()
  })

  test('Create Graph', async ({ page, browserName }) => {
    if (browserName === 'webkit') {
      test.skip()
    }

    const mito = await getMitoFrameWithTestCSV(page);
    await page.keyboard.press('Alt+F1');
    await awaitResponse(page);
    await expect(mito.locator('#mito-center-content-container').getByText('Select Data')).toBeVisible();
  })

  test('Open File Import', async ({ page, browserName}) => {
    if (browserName === 'webkit') {
      test.skip()
    }
    const mito = await getMitoFrameWithTestCSV(page);
    await page.keyboard.press('Control+o');
    await awaitResponse(page);
    await expect(mito.getByText('Import Files')).toBeVisible();
  });

  test('Create a Filter', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await page.keyboard.press('Alt+ArrowDown');
    await awaitResponse(page);
    await expect(mito.getByText('Add Filter')).toBeVisible();
  });

  test('Merge', async ({ page, browserName }) => {
    if (browserName === 'webkit') {
      test.skip()
    }
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');

    await page.keyboard.press('Control+m');
    await awaitResponse(page);
    await expect(mito.getByText('Merge Dataframes')).toBeVisible();
  });
  
  test('Set Number Format', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.getByTitle('Column1').click();

    await page.keyboard.press('Control+Shift+1');
    await awaitResponse(page);
    await expect(mito.getByText('1.00', { exact: true })).toBeVisible();

    await page.keyboard.press('Control+Shift+4');
    await awaitResponse(page);
    await expect(mito.getByText('$1.00', { exact: true })).toBeVisible();

    await page.keyboard.press('Control+Shift+5');
    await awaitResponse(page);
    await expect(mito.getByText('100.00%', { exact: true })).toBeVisible();

    await page.keyboard.press('Control+Shift+^');
    await awaitResponse(page);
    await expect(mito.getByText('1.00e+0', { exact: true })).toBeVisible();

    await page.keyboard.press('Control+Shift+`');
    await awaitResponse(page);
    await expect(mito.getByText('1.00', { exact: true })).toBeVisible();
  });

  test('Set Datetime Dtype', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await mito.getByTitle('Column1').click();

    await page.keyboard.press('Control+Shift+@');
    await awaitResponse(page);
    await expect(mito.locator('.endo-column-header-container-selected')).toHaveText(/date/);
    await expect(mito.locator('#root')).toContainText('1990-10-12 00:00:00');
    await expect(mito.locator('#root')).toContainText('2000-01-02 00:00:00');
    await expect(mito.locator('#root')).toContainText('1961-12-29 00:00:00');
  });

  test('Select All isn\'t triggered when column header is editing', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.getByTitle('Column1').dblclick();
    await page.keyboard.press('Control+a');
    await expect(mito.locator('.endo-column-header-container-selected')).toHaveCount(1);
  });
});

test.describe('Resize taskpane', () => {
  test.skip('Resize taskpane', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.getByText('Format').first().click();
    expect(mito.locator('.taskpane-resizer-container')).toBeVisible();
    expect(mito.locator('.default-taskpane-div')).toHaveCSS('width', '300px' );
    await mito.locator('.taskpane-resizer-container').dragTo(mito.getByText('Column2').first());
    expect(mito.locator('.default-taskpane-div')).toHaveCSS('width', '497.117px' );
  });
})

test.describe('Context Menus', () => {
  test('Column Header', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await expect(mito.locator('.mito-dropdown')).not.toBeVisible();
    await mito.getByTitle('Column1').click({ button: 'right' });
    await expect(mito.locator('.mito-dropdown')).toBeVisible();
    await expect(mito.locator('.mito-dropdown')).toHaveText(/Sort A to Z/);
  })

  test('Index Header', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.locator('.endo-index-headers-container').first().getByTitle('1', { exact: true }).click({ button: 'right' });
    await expect(mito.locator('.mito-dropdown')).toBeVisible();
    await expect(mito.locator('.mito-dropdown')).toHaveText(/Reset Index/);
  })

  test('Cell', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.locator('.endo-renderer-container').first().getByTitle('1', { exact: true }).click({ button: 'right' });
    await expect(mito.locator('.mito-dropdown')).toBeVisible();
    await expect(mito.locator('.mito-dropdown')).toHaveText(/Copy/);
  });

  test('Cell (with multiple cells)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.locator('.endo-renderer-container').first().getByTitle('1', { exact: true }).click({ button: 'right' });
    await mito.locator('.endo-renderer-container').first().getByTitle('2', { exact: true }).click({ button: 'right' });
    await expect(mito.locator('.mito-dropdown')).toBeVisible();
    await expect(mito.locator('.mito-dropdown')).toHaveText(/Copy/);
  });

  test('Open cell context menu then open column header context menu', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.locator('.endo-renderer-container').first().getByTitle('1', { exact: true }).click({ button: 'right' });
    await expect(mito.locator('.mito-dropdown')).toBeVisible();
    await expect(mito.locator('.mito-dropdown')).toHaveText(/Copy/);

    // Open the column header context menu and check for the contents
    await mito.getByTitle('Column1').click({ button: 'right' });
    await expect(mito.locator('.mito-dropdown')).toHaveCount(1);
    await expect(mito.locator('.mito-dropdown')).toHaveText(/Sort A to ZSort Z to A/);
  });


  test('Open sheet tab context menu then open number format dropdown', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.getByText('test').click({ button: 'right' });
    await expect(mito.locator('.mito-dropdown')).toBeVisible();
    await expect(mito.locator('.mito-dropdown')).toHaveText(/Create graph/);

    await mito.getByText('Default').click();
    await expect(mito.getByText('Currency')).toBeVisible();
    await expect(mito.locator('.mito-dropdown')).toHaveCount(1);
  });

});
