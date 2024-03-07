import { FrameLocator, Page, expect, test } from '@playwright/test';
import { awaitResponse, clickTab, getMitoFrame } from '../utils';

const createNewColumnWithName = async (page: Page, mito: FrameLocator, name: string) => {
    await clickTab(page, mito, 'Home');
    await mito.locator('.mito-toolbar-button', { hasText: 'Insert' }).click();
    await mito.locator('.endo-column-header-container', { hasText: /new-column/ }).dblclick();
    await mito.locator('.endo-column-header-container input').fill(name);
    await mito.locator('.endo-column-header-container input').press('Enter', { delay: 100 });
    await expect(mito.locator('.endo-column-header-container', { hasText: name })).toBeVisible();
};

test('Vanguard Demo', async ({ page }) => {
    const mito = await getMitoFrame(page);
    await mito.getByText('Import Files').click();
    await mito.getByText('vanguard-fund-performance').dblclick();
    await mito.getByText('fund_info.csv').dblclick();

    // Add custom import
    await clickTab(page, mito, 'Data');
    await mito.getByText('Get Performance Data').click();
    await mito.locator('.spacing-row', { hasText: 'Username' }).locator('input').fill('username');
    await mito.locator('.spacing-row', { hasText: 'Password' }).locator('input').fill('password');
    await mito.locator('.spacing-row', { hasText: 'Year' }).locator('input').fill('2020');
    await mito.locator('.text-button', { hasText: 'Import Data' }).click();

    // Add vlookup of Portfolio Manager to performance data
    await mito.getByText('MoM Return').click();
    await createNewColumnWithName(page, mito, 'Portfolio Manager');
    await mito.locator('.mito-grid-cell[mito-col-index="3"]').first().dblclick();
    await mito.locator('#cell-editor-input').fill('=VLOOKUP(');
    await mito.locator('.mito-grid-cell[mito-col-index="1"]').first().click();
    await mito.locator('#cell-editor-input').pressSequentially(', ');
    await mito.locator('.tab', { hasText: 'fund_info' }).click();
    await mito.getByText('Fund Name').click();
    await mito.getByText('Ongoing Charge').click({ modifiers: ['Shift'] });
    await mito.locator('#cell-editor-input').pressSequentially(', 2)');
    await mito.locator('#cell-editor-input').press('Enter');

    // Use the Separate Row On Delimiter custom edit to split the portfolio managers into separate rows on the delimiter , .
    await clickTab(page, mito, 'Custom Edits');
    await mito.getByText('Separate Row On Delimiter').click();
    await mito.locator('.spacing-row', { hasText: 'Dataframe' }).locator('.select-text').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'df1' }).click();
    await awaitResponse(page);
    await mito.locator('.spacing-row', { hasText: 'Attribute' }).locator('.select-text').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'Portfolio Manager' }).click();
    await awaitResponse(page);
    await mito.locator('.spacing-row', { hasText: 'Delimiter' }).locator('input').fill(',');
    await mito.locator('.text-button', { hasText: 'Separate Row on Delimiter' }).click();
    await awaitResponse(page);

    // Use the GET_EMAIL custom sheet function to get the email of each fund manager
    await mito.locator('.endo-column-header-container', { hasText: 'Portfolio Manager' }).click();
    await createNewColumnWithName(page, mito, 'Email');
    await mito.locator('.mito-grid-cell[mito-col-index="4"]').first().dblclick();
    await mito.locator('#cell-editor-input').fill('=GET_EMAIL(');
    await mito.locator('.mito-grid-cell[mito-col-index="3"]').first().click();
    await mito.locator('#cell-editor-input').press('Enter');

    /**
     * Create a pivot table with the configuration below:
        * Rows: Fund Manager, email, Fund
        * Columns: Date (Grouped by Month)
        * Values: sum of MoM Return
    */
    await mito.locator('.mito-toolbar-button', { hasText: 'Pivot' }).click();
    await mito.locator('.spacing-row', { hasText: 'Rows' }).getByText('Add').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'Portfolio Manager' }).click();
    await mito.locator('.spacing-row', { hasText: 'Rows' }).getByText('Add').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'Email' }).click();
    await awaitResponse(page);
    await mito.locator('.spacing-row', { hasText: 'Rows' }).getByText('Add').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'Fund' }).click();

    await mito.locator('.spacing-row', { hasText: 'Columns' }).getByText('Add').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'Date' }).click();
    await awaitResponse(page);
    await mito.locator('.spacing-row', { hasText: 'group by' }).locator('.select-text').click();
    await mito.locator('.mito-dropdown-item').getByText('month', { exact: true }).click();
    await awaitResponse(page);

    await mito.locator('.spacing-row', { hasText: 'Values' }).getByText('Add').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'MoM Return' }).click();
    await awaitResponse(page);

    await mito.locator('.select-text', { hasText: 'count' }).click();
    await mito.locator('.mito-dropdown-item', { hasText: 'sum' }).click();

    await page.locator('.element-container', { hasText: 'Provider Name' }).locator('input').fill('Vanguard');
    await page.getByText('Save Automation').click();

    /** Now check that the automation worked */
    await page.getByText('Use Existing Automation').click();
    await page.locator('.element-container', { hasText: 'Select an Automation'}).getByText('Cigna').click();
    await page.getByText('Vanguard').click();
});