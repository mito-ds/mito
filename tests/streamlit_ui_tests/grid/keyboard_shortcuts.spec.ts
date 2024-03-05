import { expect, test } from '@playwright/test';
import { awaitResponse, getMitoFrameWithTestCSV, getMitoFrameWithTypeCSV, importCSV } from "../utils";


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
      await expect(mito.locator('#mito-center-content-container', { hasText: 'Select Data' })).toBeVisible();
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