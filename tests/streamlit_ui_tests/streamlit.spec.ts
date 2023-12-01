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

  test('Formatting Butons', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await clickButtonAndAwaitResponse(page, mito, 'Format all of the selected columns as currency. This only changes the display of the data, and does not effect the underlying dataframe.')
    await expect(mito.getByText('$1')).toBeVisible();
    await clickButtonAndAwaitResponse(page, mito, 'Format all of the selected columns as percentage. This only changes the display of the data, and does not effect the underlying dataframe.')
    await expect(mito.getByText('100%')).toBeVisible();
    await clickButtonAndAwaitResponse(page, mito, 'Increase the number of decimal places that are displayed in the selected number columns.')
    await expect(mito.getByText('100.0%')).toBeVisible();
    await clickButtonAndAwaitResponse(page, mito, 'Decrease the number of decimal places that are displayed in the selected number columns.')
    await expect(mito.getByText('100%')).toBeVisible();
    await mito.getByText('100%').click();
  });

  test('Conditional Formatting', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await clickButtonAndAwaitResponse(page, mito, 'Conditional Formatting')

    await checkOpenTaskpane(mito, 'Conditional Formatting');

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

  test('Color Dataframe', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Format', exact: true })

    await checkOpenTaskpane(mito, 'Color Dataframe');

    await mito.locator('div:nth-child(3) > svg').click();

    // Check that the .mito-grid-row has a background of 
    // background-color: rgb(208, 227, 201)
    await expect(mito.locator('.mito-grid-row').first()).toHaveAttribute('style', /background-color: rgb\(208, 227, 201\)/);
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
    await clickButtonAndAwaitResponse(page, mito, { name: 'Insert' })

    // Expect there to be 4 column headers
    await expect(mito.locator('.endo-column-header-container')).toHaveCount(4);
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
  
  test.only('Open Merge (horizontal)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');
    
    await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
    await mito.getByText('Merge (horizontal)').click();

    await expect(mito.getByText('Merge Dataframes')).toBeVisible();

    // Check that Column1 exists
    const ch1 = await getColumnHeaderContainer(mito, 'Column1');
    await expect(ch1).toBeVisible();
    
    await mito.locator('p').filter({ hasText: 'Column1' }).nth(1).click();
    await mito.locator('.mito-dropdown-item-icon-and-title-container').nth(1).click();
    await mito.locator('p').filter({ hasText: 'Column1' }).nth(1).click();
    await mito.locator('.mito-dropdown-item-icon-and-title-container').nth(1).click();

    // Check that Column2 now exists
    const ch2 = await getColumnHeaderContainer(mito, 'Column2');
    await expect(ch2).toBeVisible();
  });

  test('Open Concat (vertical)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');
    
    await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
    await mito.getByText('Concat (vertical)').click();

    await expect(mito.getByText('Concatenate Sheet')).toBeVisible();
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


});
