import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:8888/lab?');
  await page.goto('http://localhost:8888/lab');
  await page.locator('.jp-LauncherCard-icon').first().click();
  await page.getByPlaceholder('Ask your personal Python').fill('create a new df');
  await page.getByRole('button', { name: 'Apply CMD+Y' }).click();
  await page.getByPlaceholder('Follow up on the conversation').click();
  await page.getByPlaceholder('Follow up on the conversation').fill('create a second df');
});

    // await page.getByPlaceholder('Ask your personal Python').fill(message);

