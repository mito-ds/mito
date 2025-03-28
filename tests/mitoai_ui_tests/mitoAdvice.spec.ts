/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@jupyterlab/galata';

test('should display an advice message in empty code cell', async ({
  page
}) => {
  await page.notebook.createNew();
  await page.notebook.enterCellEditingMode(0);

  // Should display the advice message by default
  await expect
    .soft((await page.notebook.getCellLocator(0))!.getByRole('textbox'))
    .toContainText(
      'Start writing python or Press'
    );

  await page.notebook.setCell(0, 'code', '\nprint("Hello, World!")');

  await expect
    .soft((await page.notebook.getCellLocator(0))!.getByRole('textbox'))
    .toHaveText('print("Hello, World!")');

  await page.notebook.enterCellEditingMode(0);
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');

  // Should display the advice message if cell content is erased
  await expect
    .soft((await page.notebook.getCellLocator(0))!.getByRole('textbox'))
    .toContainText(
      'Start writing python or Press'
    );

  await page.keyboard.press('ControlOrMeta+e');
  // Should open the Mito AI chat tab
  expect(await page.sidebar.isTabOpen('mito_ai')).toEqual(true);
});

test('should display an advice message in empty markdown cell', async ({
  page
}) => {
  await page.notebook.createNew();
  await page.notebook.setCellType(0, 'markdown');
  await page.notebook.enterCellEditingMode(0);

  // Should display the advice message by default
  await expect
    .soft((await page.notebook.getCellLocator(0))!.getByRole('textbox'))
    .toHaveText('Start writing markdown.');

  await page.notebook.setCell(0, 'markdown', '# Hello World');

  await expect
    .soft((await page.notebook.getCellLocator(0))!.getByRole('textbox'))
    .toHaveText('# Hello World');

  await page.notebook.enterCellEditingMode(0);
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');

  // Should display the advice message if cell content is erased
  await expect((await page.notebook.getCellLocator(0))!.getByRole('textbox'))
    .toHaveText('Start writing markdown.');
});

test('should not display an advice message in raw cell', async ({ page }) => {
  await page.notebook.createNew();
  await page.notebook.setCellType(0, 'raw');
  await page.notebook.enterCellEditingMode(0);

  // Should display the advice message by default
  await expect(
    (await page.notebook.getCellLocator(0))!.getByRole('textbox')
  ).toHaveText('');
});
