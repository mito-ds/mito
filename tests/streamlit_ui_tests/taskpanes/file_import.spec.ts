
import { expect, test } from '@playwright/test';
import { checkOpenTaskpane, clickButtonAndAwaitResponse, clickTab, getMitoFrame, getMitoFrameWithTestCSV } from '../utils';


test.describe('File Import Taskpane', () => {

  test('Test import CSV file', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await clickButtonAndAwaitResponse(page, mito, 'Import Files');
    await expect(mito.getByText('test.csv')).toBeVisible();
  });

  test('Test import CSV File with double click', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await mito.getByRole('button', { name: 'Import Files' }).click();
    await mito.getByText('test.csv').dblclick();
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
});