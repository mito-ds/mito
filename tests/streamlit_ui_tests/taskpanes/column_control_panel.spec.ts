import { FrameLocator, Page, expect, test } from '@playwright/test';
import { awaitResponse, getMitoFrameWithTestCSV, checkColumnCellsHaveExpectedValues, fillInput, updateSelectedValue } from '../utils';

const openColumnControlPanel = async (mito: any, columnName: string) => {
    const columnHeader = await mito.locator('.endo-column-header-final-container', { hasText: columnName });
    await columnHeader.getByTitle('Edit filters').click();
    await expect(mito.locator('.spacing-col', { hasText: 'Dtype' })).toBeVisible();
};

const changeDtypeInColumnControlPanel = async (mito: FrameLocator, page: Page, dtype: string) => {
    await updateSelectedValue(mito, 'Dtype', dtype);
}

const changeNumTypeInColumnControlPanel = async (mito: FrameLocator, page: Page, numType: string) => {
    await updateSelectedValue(mito, 'Num Type', numType);
}

const checkValuesTabHasExpectedValues = async (mito: FrameLocator, expectedValues: any[]) => {
    const values = await mito.locator('.multi-toggle-box').locator('.multi-toggle-box-row').all();
    for (const valueIndex in values) {
        const value = values[valueIndex];
        await expect(value).toHaveText(expectedValues[valueIndex]);
    }
};

test.describe('Column Control Panel', () => {
    test('Changing dtype', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        
        await openColumnControlPanel(mito, 'Column1');
        
        await changeDtypeInColumnControlPanel(mito, page, 'bool');
        await checkColumnCellsHaveExpectedValues(mito, 0, ['true', 'true', 'true', 'true']);

        await changeDtypeInColumnControlPanel(mito, page, 'str');
        await checkColumnCellsHaveExpectedValues(mito, 0, ['1', '4', '7', '10']);
    
        await changeDtypeInColumnControlPanel(mito, page, 'float');
        await checkColumnCellsHaveExpectedValues(mito, 0, ['1.00', '4.00', '7.00', '10.00']);
    
        await changeDtypeInColumnControlPanel(mito, page, 'datetime');
        await checkColumnCellsHaveExpectedValues(mito, 0, ['1970-01-01 00:00:01', '1970-01-01 00:00:04', '1970-01-01 00:00:07', '1970-01-01 00:00:10']);
    })

    test('Adding filter', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        
        await openColumnControlPanel(mito, 'Column1');
        
        await mito.getByText('Add Filter').click();
        await mito.getByText('Add a Filter').click();
        await fillInput(mito, 'Where', '4');
        await awaitResponse(page);

        await checkColumnCellsHaveExpectedValues(mito, 0, ['7', '10']);
    });

    test('Adding a group of filters', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        
        await openColumnControlPanel(mito, 'Column1');
        
        await mito.getByText('Add Filter').click();
        await mito.getByText('Add a Group').click();
        await fillInput(mito, 'Where', '7');
        await awaitResponse(page);

        await checkColumnCellsHaveExpectedValues(mito, 0, ['10']);

        // Add another filter to the group
        await mito.getByText('Add a Filter').click();

        // Change the "and" to an "or" for the second condition
        await mito.locator('.filter-group .spacing-row').nth(1).locator('.select-text', { hasText: 'And' }).click();
        await mito.getByText('Or', { exact: true }).click();

        // Add a filter to the second condition
        await mito.locator('.filter-group .spacing-row').nth(1).locator('.select-text', { hasText: '>' }).click();
        await mito.locator('.mito-dropdown-item', { hasText: '<' }).click();
        await mito.locator('.filter-group .spacing-row').nth(1).locator('input').fill('4');
        await awaitResponse(page);
        await checkColumnCellsHaveExpectedValues(mito, 0, ['1', '10']);
    });

    test('Sorting', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        
        await openColumnControlPanel(mito, 'Column1');
    
        await mito.getByText('Descending').click();
        await awaitResponse(page);

        await checkColumnCellsHaveExpectedValues(mito, 0, ['10', '7', '4', '1']);

        await mito.getByText('Ascending').click();
        await awaitResponse(page);

        await checkColumnCellsHaveExpectedValues(mito, 0, ['1', '4', '7', '10']);
    });

    test('Change the number type', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await openColumnControlPanel(mito, 'Column1');

        await changeNumTypeInColumnControlPanel(mito, page, 'Currency');
        await awaitResponse(page);
        await checkColumnCellsHaveExpectedValues(mito, 0, ['$1', '$4', '$7', '$10']);

        await changeNumTypeInColumnControlPanel(mito, page, 'Accounting');
        await awaitResponse(page);
        await checkColumnCellsHaveExpectedValues(mito, 0, ['$1', '$4', '$7', '$10']);

        await changeNumTypeInColumnControlPanel(mito, page, 'Percent');
        await awaitResponse(page);
        await checkColumnCellsHaveExpectedValues(mito, 0, ['100%', '400%', '700%', '1,000%']);

        await changeNumTypeInColumnControlPanel(mito, page, 'Scientific Notation');
        await awaitResponse(page);
        await checkColumnCellsHaveExpectedValues(mito, 0, ['1e+0', '4e+0', '7e+0', '1e+1']);
    });

    test('Values tab: filtering values by clicking on them', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await openColumnControlPanel(mito, 'Column1');

        await mito.locator('.control-panel-taskpane-tab', { hasText: 'Values'}).click();
        await checkValuesTabHasExpectedValues(mito, ['1', '4', '7', '10']);

        await mito.locator('.multi-toggle-box-row', { hasText: '4' }).locator('input[type="checkbox"]').click();
        await awaitResponse(page);
        await checkColumnCellsHaveExpectedValues(mito, 0, ['1', '7', '10']);
    })

    test('Loads summary stats', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await openColumnControlPanel(mito, 'Column1');

        await mito.locator('.control-panel-taskpane-tab', { hasText: 'Stats'}).click();
        await expect(mito.locator('.column-describe-table-row', { hasText: 'mean' })).toContainText('5.5')
        await expect(mito.locator('.column-describe-table-row', { hasText: 'std' })).toContainText('3.87')
        await expect(mito.locator('.column-describe-table-row', { hasText: 'min' })).toContainText('1.0')
    })

    test('Updates the taskpane when selected column changes', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await openColumnControlPanel(mito, 'Column1');
        await expect(mito.locator('.default-taskpane-header-div', { hasText: 'Column1' })).toBeVisible();
        
        // Navigate to the stats tab
        await mito.locator('.control-panel-taskpane-tab', { hasText: 'Stats'}).click();

        // Click on another column
        await mito.locator('.endo-column-header-final-container', { hasText: 'Column2' }).click();
        
        // Expect the tab to still be "Stats" and the header to be "Column2"
        await expect(mito.locator('.default-taskpane-header-div', { hasText: 'Column2' })).toBeVisible();
        await expect(mito.getByText('Column Summary Statistics', { exact: true })).toBeVisible();
    });
});