/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import { expect, test } from '@playwright/test';
import { awaitResponse, checkColumnCount, checkColumnExists, checkOpenTaskpane, clickButtonAndAwaitResponse, clickTab, getColumnHeaderContainer, getMitoFrame, getMitoFrameWithTestCSV, importCSV } from '../utils';


test.describe('Data Tab Buttons', () => {
  
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

  test('Test Sort Descending', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await clickButtonAndAwaitResponse(page, mito, 'Sort');
    await mito.getByRole('button', { name: 'Descending' }).click();

    // Check that the first .mito-grid-cell has text 10
    await expect(mito.locator('.mito-grid-cell').first()).toHaveText('10');
  });

  test('Test Sort Ascending', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await clickButtonAndAwaitResponse(page, mito, 'Sort');
    await mito.getByRole('button', { name: 'Ascending' }).click();

    // Check that the first .mito-grid-cell has text 1
    await expect(mito.locator('.mito-grid-cell').first()).toHaveText('1');
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
    await awaitResponse(page);

    // Check that there are 4 columns
    await checkColumnCount(mito, 4);
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
    await checkColumnCount(mito, 6);
  });

  test('Test Reset and Keep Index', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Data');

    await mito.getByRole('button', { name: '▾ Reset Index' }).click();
    await mito.getByText('Reset and Keep Index').click();
    await awaitResponse(page);

    // Check there is a header called index
    await checkColumnExists(mito, 'index');
  });

  test('Test Reset and Drop Index', async ({ page }) => {
      const mito = await getMitoFrameWithTestCSV(page);
      await clickTab(page, mito, 'Data');

      // Sort descending
      await mito.getByTitle('Sort a column in descending order.').click();
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