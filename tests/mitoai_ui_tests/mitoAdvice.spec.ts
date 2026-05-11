/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { IJupyterLabPageFixture } from '@jupyterlab/galata';
import { test, expect } from '../fixtures';

/**
 * Galata's `setCellType` expects `.jp-Notebook-toolbarCellTypeDropdown` inside the
 * notebook panel. Mito's top toolbar hosts the cell-type control elsewhere, so that
 * helper returns false and leaves the cell as code. Command-mode shortcuts match
 * stock JupyterLab behavior and work with Mito's layout.
 */
const setCellTypeViaCommandMode = async (
  page: IJupyterLabPageFixture,
  cellIndex: number,
  cellType: 'markdown' | 'raw'
): Promise<void> => {
  await page.notebook.selectCells(cellIndex);
  await page.keyboard.press('Escape');
  await page.keyboard.press(cellType === 'markdown' ? 'm' : 'r');
  await expect
    .poll(async () => await page.notebook.getCellType(cellIndex))
    .toBe(cellType);
};

test('should display an advice message in empty code cell', async ({
  page
}) => {
  await page.notebook.createNew();
  await page.notebook.enterCellEditingMode(0);

  // Should display the advice message by default
  await expect
    .soft((await page.notebook.getCellLocator(0))!.getByRole('textbox'))
    .toContainText(
      'Write Python or Press'
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
      'Write Python or Press'
    );

  await page.keyboard.press('ControlOrMeta+e');
  // Should open the Mito AI chat tab
  expect(await page.sidebar.isTabOpen('mito_ai')).toEqual(true);
});

test('should display an advice message in empty markdown cell', async ({
  page
}) => {
  await page.notebook.createNew();
  await setCellTypeViaCommandMode(page, 0, 'markdown');
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
  await setCellTypeViaCommandMode(page, 0, 'raw');
  await page.notebook.enterCellEditingMode(0);

  // Should display the advice message by default
  await expect(
    (await page.notebook.getCellLocator(0))!.getByRole('textbox')
  ).toHaveText('');
});
