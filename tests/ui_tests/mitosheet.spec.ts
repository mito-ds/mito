import { expect, test } from '@jupyterlab/galata';
import { clickToolbarButton, createNewNotebook, dfCreationCode, getNumberOfColumns, waitForCodeToBeWritten, waitForIdle } from './utils';

test.describe.configure({ mode: 'parallel' });

test.describe('Mitosheet functionality', () => {
  test('pass a dataframe', async ({ page, tmpPath }) => {
    await createNewNotebook(page, `${dfCreationCode}import mitosheet\nmitosheet.sheet(df)`);
    await getNumberOfColumns(page, 0).then((num) => expect(num).toBe(2));
  });

  test('import a CSV', async ({ page, tmpPath }) => {    
    await createNewNotebook(page, `${dfCreationCode}df.to_csv('df.csv', index=False)\nimport mitosheet\nmitosheet.sheet()`);
    await page.locator('.mito-container').click();
    await page.getByRole('button', { name: 'Import Files', disabled: false }).click();

    await page.locator('.file-browser-element-list > div:nth-child(2)').dblclick();

    await waitForCodeToBeWritten(page, 1);
    await getNumberOfColumns(page, 0).then((num) => expect(num).toBe(2));

  });

  test('delete a col', async ({ page, tmpPath }) => {
    await createNewNotebook(page, `${dfCreationCode}import mitosheet\nmitosheet.sheet(df)`);
    await clickToolbarButton(page, 'Del Col');
    await waitForIdle(page);
    await getNumberOfColumns(page, 0).then((num) => expect(num).toBe(1));
  });
});