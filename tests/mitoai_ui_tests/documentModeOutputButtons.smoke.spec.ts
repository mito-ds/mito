/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { test, expect } from '../fixtures';
import {
    createAndRunNotebookWithCells,
    runCell,
    waitForIdle,
} from '../jupyter_utils/jupyterlab_utils';

const CHART_CODE = `!pip install matplotlib --quiet
import pandas as pd
df = pd.DataFrame({'x': [1, 2, 3, 4, 5], 'y': [2, 4, 1, 5, 3]})
ax = df.plot(x='x', y='y', kind='line', title='Smoke test chart')
ax.set_xlabel('X')
ax.set_ylabel('Y')`;

test.describe('Document mode output buttons smoke', () => {
    test('chart output shows View code, Chart Wizard, and Comment in one toolbar', async ({ page }) => {
        await createAndRunNotebookWithCells(page, []);
        await waitForIdle(page);

        await page.notebook.setCell(0, 'code', CHART_CODE);
        await runCell(page, 0);
        await waitForIdle(page);

        const chartMarker = page.locator('.chart-wizard-output-container').first();
        await expect(chartMarker).toBeVisible({ timeout: 10000 });

        const documentTab = page.locator('.mode-switcher-segment').filter({ hasText: 'Document' });
        await documentTab.click();
        await waitForIdle(page);

        const outputWrapper = chartMarker.locator('xpath=ancestor::div[contains(@class,"jp-Cell-outputWrapper")]');
        await outputWrapper.hover();

        const toolbar = outputWrapper.locator('.mito-output-actions-toolbar');
        await expect(toolbar).toBeVisible();

        await expect(toolbar.locator('.mito-output-action-slot-viewCode').getByRole('button', { name: 'View code' })).toBeVisible();
        await expect(toolbar.locator('.mito-output-action-slot-chartWizard').getByRole('button', { name: 'Chart Wizard' })).toBeVisible();
        await expect(toolbar.locator('.mito-output-action-slot-comment').getByRole('button', { name: 'Comment' })).toBeVisible();
    });
});
