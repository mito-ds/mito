import { expect, test } from '@jupyterlab/galata';
import { createAndRunNotebookWithCells, waitForIdle } from '../jupyter_utils/jupyterlab_utils';
import { updateCellValue } from '../jupyter_utils/mitosheet_utils';
const placeholderCellText = '# Empty code cell';

test.describe.configure({ mode: 'parallel' });

test.describe('Dataframe renders as mitosheet', () => {
  test('renders a mitosheet when hanging dataframe', async ({ page, tmpPath }) => {

    await createAndRunNotebookWithCells(page, ['import pandas as pd\ndf=pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})\ndf']);
    await waitForIdle(page);
    const cellOutput = await page.notebook.getCellOutput(0);
    expect(await cellOutput?.innerHTML()).toContain('Home');

    // The toolbar should be collapsed by default, so the Delete button should not be visible
    expect(await cellOutput?.innerHTML()).not.toContain('Delete');
  });
});