
import { expect, test } from '@playwright/test';
import { awaitResponse, checkOpenTaskpane, clickButtonAndAwaitResponse, clickTab, getColumnHeaderContainer, getMitoFrameWithTestCSV, importCSV } from '../utils';


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
  
      await expect(mito.locator('#mito-center-content-container', { hasText: 'Select Data' })).toBeVisible();
      // We test graph functionality elsewhere, so we skip here
    });
  
    test('Test Graph (scatter)', async ({ page }) => {
      const mito = await getMitoFrameWithTestCSV(page);
      await clickTab(page, mito, 'Insert');
  
      await clickButtonAndAwaitResponse(page, mito, { name: 'Create an interactive scatter plot.' });
  
      await expect(mito.locator('#mito-center-content-container', { hasText: 'Select Data' })).toBeVisible();

      await clickButtonAndAwaitResponse(page, mito, { name: 'Change Chart Type' });
      // Check that there are 2 icons under the "checked" div in the chart type dropdown
      await expect(mito.locator('.mito-dropdown-item-icon-and-title-container', { hasText: 'Scatter' }).locator('svg')).toHaveCount(2);      });
  
    test('Test Graph (line)', async ({ page }) => {
      const mito = await getMitoFrameWithTestCSV(page);
      await clickTab(page, mito, 'Insert');
  
      await clickButtonAndAwaitResponse(page, mito, { name: 'Create an interactive line graph.' });
  
      await expect(mito.locator('#mito-center-content-container', { hasText: 'Select Data' })).toBeVisible();

      await clickButtonAndAwaitResponse(page, mito, { name: 'Change Chart Type' });
      // Check that there are 2 icons under the "checked" div in the chart type dropdown
      await expect(mito.locator('.mito-dropdown-item-icon-and-title-container', { hasText: 'Line' }).locator('svg')).toHaveCount(2);  
    });
})