import { expect, test } from '@jupyterlab/galata';

test.describe.configure({ mode: 'parallel' });

test.describe('Mitosheet Tests', () => {
  test('Render a Mitosheet', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'import mitosheet\nmitosheet.sheet()')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('Add Col');
  });
});