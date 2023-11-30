import { test, expect, Page, FrameLocator } from '@playwright/test';

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

  test.skip('Copy Button', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await mito.getByTitle('Column1').click();
    await clickButtonAndAwaitResponse(page, mito, 'Copy')

    // TODO: figure out how to check the clipboard properly...
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
  });

  test('Color Dataframe', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Format', exact: true })

    await checkOpenTaskpane(mito, 'Color Dataframe');
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
  });

  test('Open Filter', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Filter' })

    await checkOpenTaskpane(mito, 'Column1');
  });

  test('Open Find & Replace', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Find & Replace' })

    await expect(mito.getByPlaceholder('Find...')).toBeVisible()
  });

  test('Change Dtype Dropdown', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickButtonAndAwaitResponse(page, mito, { name: '▾ Dtype' })
    await mito.getByText('float').click();
    
    await expect(mito.getByText('1.00')).toBeVisible();
  });
  
  test('Open Pivot Table', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Pivot' })
    
    await checkOpenTaskpane(mito, 'Create Pivot Table test_pivot');
    
    await expect(mito.getByText('No data in dataframe.')).toBeVisible();
  });
  
  test('Open Merge (horizontal)', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await importCSV(page, mito, 'test.csv');
    
    await clickButtonAndAwaitResponse(page, mito, { name: '▾ Merge' })
    await mito.getByText('Merge (horizontal)').click();

    await expect(mito.getByText('Merge Dataframes')).toBeVisible();
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
