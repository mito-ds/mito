import { expect, test } from '@playwright/test';
import { getMitoFrameWithTestCSV } from './utils';

test.describe('Resize taskpane', () => {
  test.skip('Resize taskpane', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await mito.getByText('Format').first().click();
    expect(mito.locator('.taskpane-resizer-container')).toBeVisible();
    expect(mito.locator('.default-taskpane-div')).toHaveCSS('width', '300px' );
    await mito.locator('.taskpane-resizer-container').dragTo(mito.getByText('Column2').first());
    expect(mito.locator('.default-taskpane-div')).toHaveCSS('width', '497.117px' );
  });
})