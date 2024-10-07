
import { expect, test } from '@playwright/test';
import { awaitResponse, checkColumnExists, checkOpenTaskpane, clickButtonAndAwaitResponse, clickTab, getMitoFrameWithTestCSV, importCSV } from '../utils';


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
      await checkColumnExists(mito, ['variable', 'value']);
  
      // Toggle .multi-toggle-box-row with text Column1
      await mito.locator('.multi-toggle-box-row').filter({ hasText: 'Column1' }).first().click();
      await awaitResponse(page);
  
      // Check that column1 is now in the variable column
      await checkColumnExists(mito, 'Column1');
    });
  
    test('Test Transpose', async ({ page }) => {
      const mito = await getMitoFrameWithTestCSV(page);
      await clickTab(page, mito, 'Insert');
  
      await clickButtonAndAwaitResponse(page, mito, 'Transpose');
  
      await checkColumnExists(mito, '0');
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
  
      await expect(mito.locator('#mito-center-content-container', { hasText: 'Select Data' })).toBeVisible();
      // We test graph functionality elsewhere, so we skip here
    });
  
    test('Test Graph (scatter)', async ({ page }) => {
      const mito = await getMitoFrameWithTestCSV(page);
      await clickTab(page, mito, 'Insert');
  
      await mito.getByTitle('Create an interactive scatter plot.').click();
      await awaitResponse(page);

      await expect(mito.locator('#mito-center-content-container', { hasText: 'Select Data' })).toBeVisible();
    });
  
    test('Test Graph (line)', async ({ page }) => {
      const mito = await getMitoFrameWithTestCSV(page);
      await clickTab(page, mito, 'Insert');

      await mito.getByTitle('Create an interactive line graph.').click();
      await awaitResponse(page);

      await expect(mito.locator('#mito-center-content-container', { hasText: 'Select Data' })).toBeVisible();
    });
})