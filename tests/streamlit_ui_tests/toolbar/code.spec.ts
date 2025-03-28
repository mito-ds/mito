/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import { test } from '@playwright/test';
import { checkOpenTaskpane, clickTab, getMitoFrameWithTestCSV } from '../utils';

test.describe('Code Tab Buttons', () => {

  test('Test Copy Code', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await clickTab(page, mito, 'Code');

    await mito.getByRole('button', { name: 'Copy Code' }).click();
    // Check the code is copied to the clipboard
    // TODO: There are some bugs with Playwrite, that make it hard to check the clipboard contents
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
  