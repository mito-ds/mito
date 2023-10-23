import { test, expect } from '@playwright/test';

test('Can render Mito spreadsheet', async ({ page }) => {
  await page.goto('http://localhost:1001/');
  const frame = await page.frameLocator('iframe[title="mitosheet\\.streamlit\\.v1\\.spreadsheet\\.my_component"]');
  await frame.getByRole('button', { name: 'Import Files' }).click();

  await expect(frame.getByText('To use the file browser, configure the folder you want to allow users to import ')).toBeVisible();
});