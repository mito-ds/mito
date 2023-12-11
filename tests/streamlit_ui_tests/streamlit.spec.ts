import { test, expect, Page, FrameLocator, Locator } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

const getMitoFrame = async (page: Page): Promise<FrameLocator> => {
  await page.goto('http://localhost:8555/');
  return page.frameLocator('iframe[title="mitosheet\\.streamlit\\.v1\\.spreadsheet\\.my_component"]');
};

const importCSV = async (page: Page, mito: FrameLocator, filename: string): Promise<void> => {
  await mito.getByRole('button', { name: '▾ Import' }).click();
  await mito.getByTitle('Import Files').getByText('Import Files').click();
  await mito.getByText(filename).dblclick();
  await expect(mito.getByTitle('Column1')).toBeVisible(); 
  await awaitResponse(page);
  // Close the taskpane, by clicking default-taskpane-header-exit-button-div
  await mito.locator('.default-taskpane-header-exit-button-div').click();

}

const getMitoFrameWithTestCSV = async (page: Page): Promise<FrameLocator> => {
  const mito = await getMitoFrame(page);
  await importCSV(page, mito, 'test.csv');
  return mito;
}

const awaitResponse = async (page: Page): Promise<void> => {
  // Wait at least 25 ms for the message to send
  await page.waitForTimeout(100);
  // Then, wait for Streamlit to finish processing the message
  await expect(page.getByText("Running")).toHaveCount(0);
}

const clickButtonAndAwaitResponse = async (page: Page, mito: FrameLocator, nameOrOptions: string | any): Promise<void> => {
  const button = mito.getByRole('button', typeof nameOrOptions === 'string' ? { name: nameOrOptions} : nameOrOptions);
  // Scroll button into view
  await button.scrollIntoViewIfNeeded();
  // Click button
  await button.click();
  await awaitResponse(page);
}

const checkOpenTaskpane = async (mito: FrameLocator, taskpaneName: string): Promise<void> => {
  // Check there is a class default-taskpane-header-div, that contains a nested div with text "taskpaneName"
  await expect(mito.locator('.default-taskpane-header-div').locator('div').filter({ hasText: new RegExp(taskpaneName) }).first()).toBeVisible();
}

const getColumnHeaderContainer = async (mito: FrameLocator, columnName: string): Promise<Locator> => {
  return mito.locator('.endo-column-header-container').locator('div').filter({ hasText: columnName }).first();
}

const clickTab = async (page: Page, mito: FrameLocator, tabName: string): Promise<void> => {
  // Button with .mito-toolbar-tabbar-tabname that has text tabName
  await mito.locator('.mito-toolbar-tabbar-tabname').filter({ hasText: tabName }).first().click();
}


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

  test('Copy Button', async ({ page }) => {
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
    await expect(mito.getByText('$1')).toBeVisible();
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
    await expect(mito.getByText('$1')).toBeVisible();
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

    // Filter out all rows, with a > 4 filter
    await mito.getByText('+ Add Filter').click();
    await mito.locator('div').filter({ hasText: /^Add a Filter$/ }).first().click();
    await mito.getByRole('textbox').click();
    await mito.getByRole('textbox').fill('4');
    await mito.getByText('No rows in dataframe.').click();
    await expect(mito.getByText('Removed an additional 1 rows')).toBeVisible();

    // Add another filter and combine with an OR < 10
    await mito.getByText('+ Add Filter').click();
    await mito.locator('div').filter({ hasText: /^Add a Filter$/ }).first().click();
    await mito.getByText('And').click();
    await mito.getByText('Or', { exact: true }).click();
    await mito.getByText('>').nth(1).click();
    await mito.getByText('<').click();
    await mito.locator('div').filter({ hasText: /^Or<$/ }).getByRole('textbox').fill('10');

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
    await expect(mito.getByText('0 of 2')).toBeVisible();

    // Replace in selected columns shouldn't work, as Column2 isn't selected
    await mito.locator('#mito-center-content-container').getByRole('button').first().click();
    await mito.getByPlaceholder('Replace...').fill('4');
    await mito.getByRole('button', { name: 'Replace in Selected Columns' }).click();
    await expect(mito.getByText('Column4')).not.toBeVisible();
    await expect(mito.locator('.mito-grid-cell').filter({ hasText: /^4$/ }).first()).not.toBeVisible();

    // Then, replace all, should work
    await mito.getByRole('button', { name: 'Replace All' }).click();
    await expect(mito.getByText('Column4')).toBeVisible();
    await expect(mito.locator('.mito-grid-cell').filter({ hasText: /^4$/ }).first()).toBeVisible();
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
    await page.frameLocator('iframe[title="mitosheet\\.streamlit\\.v1\\.spreadsheet\\.my_component"]').getByText('test_pivot', { exact: true }).click();
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

    await expect(mito.getByText('Setup Graph')).toBeVisible();
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

    await expect(mito.getByText('Merge Dataframes')).toBeVisible();
    await expect(mito.getByText('unique in left')).toBeVisible();
    // We test anti-merge functionality elsewhere, so we skip here
  });

  test('Test Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph', exact: true });

    await expect(mito.getByText('Setup Graph')).toBeVisible();
    // We test graph functionality elsewhere, so we skip here
  });

  test('Test Graph (scatter)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, { name: 'Create an interactive scatter plot.' });

    await expect(mito.getByText('Setup Graph')).toBeVisible();
    await expect(mito.getByText('Scatter')).toBeVisible();
  });

  test('Test Graph (line)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Insert');

    await clickButtonAndAwaitResponse(page, mito, { name: 'Create an interactive line graph.' });

    await expect(mito.getByText('Setup Graph')).toBeVisible();
    await expect(mito.getByText('line', {exact: true})).toBeVisible();

  });

})


test.describe('Code Tab Buttons', () => {

  test('Test Copy Code', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Code');

    await mito.getByRole('button', { name: 'Copy Code' }).click();
    // Check the code is copied to the clipboard
    // TODO: There are some bugs with Playwrite, that make it hard to check the clipboard contents
  });

  test.only('Test Configure Code', async ({ page }) => {
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
