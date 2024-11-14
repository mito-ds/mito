import { expect, test } from '@jupyterlab/galata';

test('should display an advice message on empty cell', async ({ page }) => {
  await page.notebook.createNew();
  await page.notebook.enterCellEditingMode(0);

  // Should display the advice message by default
  await expect
    .soft((await page.notebook.getCellLocator(0))!.getByRole('textbox'))
    .toHaveText(
      'Press Ctrl + E to ask Mito AI to do something. Start typing to dismiss.'
    );

  await page.notebook.setCell(0, 'code', 'print("Hello, World!")');

  await expect
    .soft((await page.notebook.getCellLocator(0))!.getByRole('textbox'))
    .toHaveText('print("Hello, World!")');

  await expect
    .soft((await page.notebook.getCellLocator(0))!.getByRole('textbox'))
    .not.toHaveText(
      'Press Ctrl + E to ask Mito AI to do something. Start typing to dismiss.'
    );

  await page.notebook.enterCellEditingMode(0);
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');

  // Should display the advice message if cell content is erased
  await expect.soft((await page.notebook.getCellLocator(0))!.getByRole('textbox')).toHaveText(
    'Press Ctrl + E to ask Mito AI to do something. Start typing to dismiss.'
  );

  await page.keyboard.press('ControlOrMeta+e');
  // Should open the Mito AI chat tab
  expect(await page.sidebar.isTabOpen('mito_ai')).toEqual(true);
});
