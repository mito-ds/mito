import { expect, test } from '@jupyterlab/galata';
import { createNewMitosheetOnlyTest, dfCreationCode, getNumberOfColumns } from './utils';

test.describe.configure({ mode: 'parallel' });

test.describe('Mitosheet functionality', () => {
  test('pass a dataframe', async ({ page, tmpPath }) => {
    await createNewMitosheetOnlyTest(page, `${dfCreationCode}import mitosheet\nmitosheet.sheet(df)`);
    await getNumberOfColumns(page, 0).then((num) => expect(num).toBe(2));
  });
});