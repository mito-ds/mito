/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { test, expect } from '../fixtures';
import {
  createAndRunNotebookWithCells,
  waitForIdle,
  getCodeFromCell,
} from '../jupyter_utils/jupyterlab_utils';

test.describe('Chart Wizard', () => {

  test('Create graph, open Chart Wizard, change title, verify update', async ({ page }) => {
    // Create a notebook with a pandas chart that uses the Chart Wizard config format
    // Use \n for newlines since page.keyboard.type() handles them as Enter key presses
    const chartCode = "import pandas as pd\n" +
      "# === CHART CONFIG ===\n" +
      "TITLE = 'Original Title'\n" +
      "X_LABEL = 'X Axis'\n" +
      "Y_LABEL = 'Y Axis'\n" +
      "# === END CONFIG ===\n" +
      "df = pd.DataFrame({'x': [1, 2, 3, 4, 5], 'y': [2, 4, 1, 5, 3]})\n" +
      "ax = df.plot(x='x', y='y', kind='line', title=TITLE)\n" +
      "ax.set_xlabel(X_LABEL)\n" +
      "ax.set_ylabel(Y_LABEL)";

    await createAndRunNotebookWithCells(page, [chartCode]);
    await waitForIdle(page);

    // Wait for the chart output to render
    await page.waitForTimeout(1000);

    // Find the chart output container (it has the class chart-wizard-output-container)
    const chartOutput = page.locator('.chart-wizard-output-container');
    await expect(chartOutput).toBeVisible();

    // Hover over the chart to make the Chart Wizard button visible
    await chartOutput.hover();

    // Click the Chart Wizard button that appears
    const chartWizardButton = page.locator('.chart-wizard-button-container button');
    await expect(chartWizardButton).toBeVisible();
    await chartWizardButton.click();

    // Wait for the Chart Wizard panel to open
    await page.waitForTimeout(500);
    const chartWizardPanel = page.locator('.chart-wizard-widget');
    await expect(chartWizardPanel).toBeVisible();

    // Find the Title input field (label is "Title" which is formatted from "TITLE")
    const titleInput = chartWizardPanel.locator('.chart-wizard-input-row').filter({ hasText: 'Title' }).locator('input');
    await expect(titleInput).toBeVisible();

    // Verify the initial value
    await expect(titleInput).toHaveValue('Original Title');

    // Clear and type a new title
    await titleInput.fill('Updated Chart Title');

    // Wait for the debounced update to apply (the hook has 500ms debounce)
    await page.waitForTimeout(1000);
    await waitForIdle(page);

    // Verify the code in the cell has been updated with the new title
    const updatedCode = await getCodeFromCell(page, 0);
    expect(updatedCode).toContain("TITLE = 'Updated Chart Title'");
  });
});
