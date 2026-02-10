/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { test, expect } from '../fixtures';
import {
    createAndRunNotebookWithCells,
    getCodeFromCell,
    runCell,
    waitForIdle,
} from '../jupyter_utils/jupyterlab_utils';
import { executeJupyterCommand } from './utils';

const CHART_CODE = `!pip install matplotlib --quiet
import pandas as pd
# === CHART CONFIG ===
TITLE = 'Original Title'
X_LABEL = 'X Axis'
Y_LABEL = 'Y Axis'
# === END CONFIG ===
df = pd.DataFrame({'x': [1, 2, 3, 4, 5], 'y': [2, 4, 1, 5, 3]})
ax = df.plot(x='x', y='y', kind='line', title=TITLE)
ax.set_xlabel(X_LABEL)
ax.set_ylabel(Y_LABEL)`;

test.describe.parallel('Chart Wizard', () => {

    test.beforeEach(async ({ page }) => {
        await createAndRunNotebookWithCells(page, []);
        await waitForIdle(page);
    });

    test('Open Chart Wizard and update title', async ({ page }) => {
        await page.notebook.setCell(0, 'code', CHART_CODE);

        // Run the cell to generate the chart
        await runCell(page, 0);
        await waitForIdle(page);

        // Wait for the chart output to appear (matplotlib charts take a moment to render)
        const chartOutputContainer = page.locator('.chart-wizard-output-container').first();
        await expect(chartOutputContainer).toBeVisible({ timeout: 10000 });

        // Hover over the chart output to make the button visible
        await chartOutputContainer.hover();

        // Wait for the Chart Wizard button to become visible (opacity changes on hover)
        const chartWizardButton = page.locator('.chart-wizard-button-container').getByRole('button', { name: 'Chart Wizard' });
        await expect(chartWizardButton).toBeVisible();

        // Click the Chart Wizard button
        await chartWizardButton.click();
        await waitForIdle(page);

        // Verify the Chart Wizard panel is open (check for tab label or widget)
        const chartWizardTab = page.locator('.lm-TabBar-tabLabel').filter({ hasText: 'Chart Wizard' });
        const chartWizardWidget = page.locator('[id="mito-ai-chart-wizard"]');
        // Either the tab or the widget should be visible
        const hasTab = await chartWizardTab.count() > 0;
        const hasWidget = await chartWizardWidget.count() > 0;
        expect(hasTab || hasWidget).toBeTruthy();

        // Wait for the Chart Wizard content to load
        await chartWizardWidget.waitFor({ state: 'visible', timeout: 5000 });

        // Find the Title input field (label "Title" corresponds to TITLE variable)
        // Find the input row that contains a label with text "Title"
        const titleLabel = chartWizardWidget.locator('.chart-wizard-input-label').filter({ hasText: 'Title' });
        await expect(titleLabel).toBeVisible({ timeout: 5000 });

        // Find the input field in the same row as the Title label
        // The structure is: .chart-wizard-input-row > .chart-wizard-input-label + .chart-wizard-text-input
        const titleInput = chartWizardWidget
            .locator('.chart-wizard-input-row')
            .filter({ hasText: 'Title' })
            .locator('.chart-wizard-text-input');

        await expect(titleInput).toBeVisible();

        // Update the title to a new value
        const newTitle = 'Updated Chart Title';
        await titleInput.clear();
        await titleInput.fill(newTitle);

        // Wait for the debounced update (500ms) plus cell execution
        // The debounced update will update the cell and re-execute it
        await page.waitForTimeout(600); // Wait for debounce
        await waitForIdle(page); // Wait for cell execution to complete

        // Expand all code cells so getCodeFromCell can read the code
        await executeJupyterCommand(page, 'notebook:show-all-cell-code');

        // Verify the code cell has been updated with the new title
        const updatedCode = await getCodeFromCell(page, 0);
        expect(updatedCode).toContain(`TITLE = '${newTitle}'`);
    });
});
