/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@jupyterlab/galata';
import { createNewMitosheetOnlyTest, dfCreationCode, getNumberOfColumns } from '../jupyter_utils/mitosheet_utils';

test.describe.configure({ mode: 'parallel' });

test.describe('Mitosheet functionality', () => {
  test('pass a dataframe', async ({ page, tmpPath }) => {
    await createNewMitosheetOnlyTest(page, `${dfCreationCode}import mitosheet\nmitosheet.sheet(df)`);
    await getNumberOfColumns(page, 0).then((num) => expect(num).toBe(2));
  });
});