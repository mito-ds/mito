import { FrameLocator, Page, expect, test } from '@playwright/test';
import { awaitResponse, clickButtonAndAwaitResponse, clickTab, fillInput, getMitoFrameWithTestCSV, getMitoFrameWithTypeCSV } from '../utils';

test.describe.configure({ mode: 'parallel' });

const openPopupAndEditTitle = async (mito: any, selector: string, newTitle: string) => {
    await mito.locator(selector).dblclick();
    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill(newTitle);
    await mito.locator('.popup-input').press('Enter');

    await expect(mito.locator('.popup-input')).not.toBeVisible();
    await expect(mito.locator(selector, { hasText: newTitle })).toBeVisible();
}

const testEditTitleThroughContextMenu = async (page, selector) => {
  const mito = await getMitoFrameWithTypeCSV(page);

  await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
  await expect(mito.getByText('Column1 bar chart')).toBeVisible();

  await mito.locator(selector).click({ button: 'right' });
  await mito.getByRole('button', { name: 'Edit Title' }).click();
  await awaitResponse(page);

  await expect(mito.locator('.popup-input')).toBeVisible();
  await mito.locator('.popup-input').fill('New Title');
  await mito.locator('.popup-input').press('Enter');

  await awaitResponse(page);
  await expect(mito.locator(selector, { hasText: 'New Title' })).toBeVisible();
};

const testDeleteTitleThroughContextMenu = async (page, selector) => {
  const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await mito.locator(selector).click({ button: 'right' });
    await mito.getByRole('button', { name: 'Delete Title' }).click();
    await awaitResponse(page);

    await expect(mito.locator(selector)).not.toBeVisible();
};

const addColumnToAxis = async (mito: FrameLocator, page: Page, axis: 'X' | 'Y', columnName: string) => {
  await mito.locator('.spacing-row', { hasText: `${axis} axis` }).locator('.mito-dropdown-button').click();
  await mito.locator('.mito-dropdown-item', { hasText: columnName }).click();
  await awaitResponse(page);
}

const openGraphEditor = async (mito: FrameLocator, page: Page) => {
  await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

  // Note: This won't work if there isn't a column selected when we open the graph editor, 
  // because the graph will be empty and won't render anything. 
  // Context: We are checking that the graph renders here because there isn't
  // a loading indicator that we can wait on. 
  await expect(mito.locator('.g-gtitle')).toBeVisible();
}

const changeChartType = async (mito: FrameLocator, page: Page, chartType: string, chartSubType?: string, orientation?: 'horizontal' | 'vertical') => {
  await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
  if (chartSubType !== undefined) {
    await mito.getByText(chartType, { exact: true }).hover();
    await mito.locator('.mito-dropdown-item-vertical')
              .getByText(chartSubType, { exact: true })
              .nth((orientation === undefined || orientation === 'vertical') ? 0 : 1)
              .click();
  } else {
    await mito.getByText(chartType).click();
  }
  await awaitResponse(page);
}

const addChartElement = async (mito: FrameLocator, page: Page, chartElement: string, chartSubElement?: string) => {
  await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
  await mito.getByRole('button', { name: chartElement }).hover();
  await mito.getByRole('button', { name: chartSubElement }).click();
  await awaitResponse(page);
}

test.describe('Graph Functionality', () => {
    test('Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await openGraphEditor(mito, page);

    await mito.getByTitle('Select columns to graph on the X axis.').getByText('+ Add').click();
    await mito.locator('.mito-dropdown-item').first().click();
    await expect(mito.locator('.plotly-graph-div').first()).toBeVisible();
  });

  test('Graph from selection', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await mito.getByTitle('Column1').click();
    await mito.getByTitle('Column2').click({ modifiers: ['Shift']});
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('p.select-text').getByText('Column1')).toBeVisible();
    await expect(mito.locator('p.select-text').getByText('Column2')).toBeVisible();
  })

  test('Graph from selection with columns selected in reverse order', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await mito.getByTitle('Column2').click();
    await mito.getByTitle('Column1').click({ modifiers: ['Shift']});
    
    await openGraphEditor(mito, page);

    await expect(mito.locator('.graph-sidebar-toolbar-content .select-container').nth(1)).toHaveText('Column1');
    await expect(mito.locator('.graph-sidebar-toolbar-content .select-container').nth(2)).toHaveText('Column2');  
  })

  test('Change Chart type to Linear', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await changeChartType(mito, page, 'Line', 'Linear');
    await expect(mito.getByText('Column1 line')).toBeVisible();
  });

  test('Change Chart type to Horizontal Line Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await changeChartType(mito, page, 'Line', 'Horizontal');
    await expect(mito.getByText('Column1 line')).toBeVisible();
  });

  test('Change Chart type to vertical grouped bar Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await changeChartType(mito, page, 'Bar', 'Grouped', 'vertical');

    await expect(mito.getByText('Column1 bar')).toBeVisible();
  });


  test('Change Chart type to horizontal grouped bar Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);
    await changeChartType(mito, page, 'Bar', 'Grouped', 'horizontal');

    await expect(mito.getByText('Column1 bar')).toBeVisible();
  });

  test('Change Chart type to scatter', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await changeChartType(mito, page, 'Scatter');
    await expect(mito.getByText('Column1 scatter plot')).toBeVisible();
  });

  test('Close Select Data taskpane then open it again and make an edit', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await openGraphEditor(mito, page);
    await mito.locator('.spacing-row', { hasText: 'Select Data' }).locator('svg').click();
    await expect(mito.locator('.spacing-row', { hasText: 'Select Data' })).not.toBeVisible();

    await clickButtonAndAwaitResponse(page, mito, { name: 'Select Data' })
    await expect(mito.locator('.spacing-row', { hasText: 'Select Data' })).toBeVisible();

    // Add a column to the graph
    await mito.locator('.spacing-row', { hasText: 'Y Axis' }).getByText('+ Add').click();
    await mito.locator('.mito-dropdown-item').getByText('Column2').click();

    // Check that the graph has been updated by checking the legend
    await expect(mito.locator('.legend')).toHaveText('variableColumn1Column2');
  });

  test('Make a histogram and change the histogram specific configurations', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await openGraphEditor(mito, page);
    await changeChartType(mito, page, 'Histogram', 'Grouped', 'vertical');

    // Change the aggregation function
    await mito.locator('.mito-graph-configuration-container').getByText('count').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'sum' }).click();
    await expect(mito.locator('.g-ytitle')).toHaveText('sum of None');

    // Change the bin size
    // Plotly renders each bar as a g element with class "point" (and then in the range slider has the same number of points),
    // so we're checking that there are initially 3 bars (and 3 bars in the range slider), then when
    // we change the bin size to 1, there are 2 bars (and 2 bars in the range slider)
    await expect(mito.locator('g.point')).toHaveCount(6);
    await mito.locator('.mito-graph-configuration-container').locator('input[type="number"]').fill('1');
    await awaitResponse(page);
    await expect(mito.locator('g.point')).toHaveCount(4);
  });

  test('Make a box plot and change the box plot specific configurations', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await openGraphEditor(mito, page);
    await changeChartType(mito, page, 'Box', 'Box');

    // Change the points
    await expect(mito.locator('path.point')).toHaveCount(0);
    await mito.getByText('outliers').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'all' }).click();
    await awaitResponse(page);
    await expect(mito.locator('path.point')).toHaveCount(8);
  });

  test('Switch between graph and data tab', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await openGraphEditor(mito, page);
    
    // Open a data tab
    await mito.locator('.footer').getByText('test' ).click();
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart'})).not.toBeVisible();
    
    // Go back to the graph tab
    await mito.locator('.footer').getByText('graph0' ).click();
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart'})).toBeVisible();
  });

  test('Update graph when data changes', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await openGraphEditor(mito, page);
    await expect(mito.locator('g.point')).toHaveCount(8);
    
    await mito.locator('.footer').getByText('test' ).click();

    // Apply a filter to the data
    await mito.locator('.endo-column-header-final-container').first().getByTitle('Edit Filters').click();
    await mito.getByText('Add Filter').click();
    await mito.getByText('Add a Filter').click();
    await fillInput(mito, 'Where', '1');
    await expect(mito.locator('.mito-grid-cell-selected')).toHaveCount(3);

    // Check that the graph has been updated
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart'})).not.toBeVisible();
    await mito.locator('.footer').getByText('graph0').click();

    await awaitResponse(page);
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart'})).toBeVisible();
    await expect(mito.locator('g.point')).toHaveCount(6);
  });

  test('Select Data taskpane still visible after toggling full screen', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await openGraphEditor(mito, page);

    // Toggle fullscreen on and off
    await mito.getByTitle('Enter fullscreen mode to see more of your data.').click();
    await expect(mito.locator('#mito-center-content-container').getByText('Select Data')).toBeVisible();
    await mito.getByTitle('Enter fullscreen mode to see more of your data.').click();
    await expect(mito.locator('#mito-center-content-container').getByText('Select Data')).toBeVisible();
  });

  test('Scatter plot from selection', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await mito.getByTitle('Column1').click();
    await mito.getByTitle('Column2').click({ modifiers: ['Shift']});
    
    await clickTab(page, mito, 'Insert');
    await clickButtonAndAwaitResponse(page, mito, { name: 'Create an interactive scatter plot.' })

    await expect(mito.locator('p.select-text').getByText('Column1')).toBeVisible();
    await expect(mito.locator('p.select-text').getByText('Column2')).toBeVisible();
  })

  test('Update Graph Title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await openPopupAndEditTitle(mito, '.g-gtitle', 'My Graph Title');
  });

  test('Update X axis Title on double click', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await openPopupAndEditTitle(mito, '.g-xtitle', 'X axis Title');
  });

  test('Update Y axis Title with double click', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await openPopupAndEditTitle(mito, '.g-ytitle', 'Y axis Title');
  });

  test('Update graph title with context menu', async ({ page }) => {
    await testEditTitleThroughContextMenu(page, '.g-gtitle');
  });

  test('Update X axis title with context menu', async ({ page }) => {
    await testEditTitleThroughContextMenu(page, '.g-xtitle');
  });

  test('Update Y axis title with context menu', async ({ page }) => {
    await testEditTitleThroughContextMenu(page, '.g-ytitle');
  });

  test('Delete graph title with context menu', async ({ page }) => {
    await testDeleteTitleThroughContextMenu(page, '.g-gtitle');
  });

  test('Delete x axis title with context menu', async ({ page }) => {
    await testDeleteTitleThroughContextMenu(page, '.g-xtitle');
  });

  test('Delete y axis title with context menu', async ({ page }) => {
    await testDeleteTitleThroughContextMenu(page, '.g-ytitle');
  });

  test('Update Y axis Title with double click after interacting with the legend', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    // Add a column to the graph
    await mito.locator('.spacing-row', { hasText: 'Y Axis' }).getByText('+ Add').click();
    await mito.locator('.mito-dropdown-item').getByText('Column2').click();

    // Interact with the legend
    await mito.locator('.legend .groups').first().click();

    await openPopupAndEditTitle(mito, '.g-ytitle', 'Y axis Title');
  });

  test('Update X axis title through toolbar', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);
    await expect(mito.locator('.g-xtitle', { hasText: 'count' })).toBeVisible();

    await addChartElement(mito, page, 'Axis Titles', 'Edit X Axis Title');

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('X axis Title');
    await mito.locator('.popup-input').press('Enter');

    await awaitResponse(page);
    await expect(mito.locator('.g-xtitle', { hasText: 'X axis Title' })).toBeVisible();
  });

  test('Update Y axis title through toolbar', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);
    await expect(mito.locator('.g-ytitle', { hasText: 'Column1' })).toBeVisible();

    await addChartElement(mito, page, 'Axis Titles', 'Edit Y Axis Title');

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('Y axis Title');
    await mito.locator('.popup-input').press('Enter');

    await awaitResponse(page);
    await expect(mito.locator('.g-ytitle', { hasText: 'Y axis Title' })).toBeVisible();
  });

  test('Hide Graph title through selecting and pressing delete', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await openGraphEditor(mito, page);

    await mito.locator('.g-gtitle').click();
    await mito.locator('.g-gtitle').press('Backspace');
    await expect(mito.getByText('Column1 bar chart')).not.toBeVisible();
  });

  test('Hide x axis title through selecting and pressing delete', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await openGraphEditor(mito, page);

    await mito.locator('.g-xtitle').click();
    await mito.locator('.g-xtitle').press('Backspace');
    await expect(mito.locator('.g-xtitle', { hasText: 'count' })).not.toBeVisible();
  });

  test('Hide y axis title through selecting and pressing delete', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await openGraphEditor(mito, page);

    await mito.locator('.g-ytitle').click();
    await mito.locator('.g-ytitle').press('Backspace');
    await expect(mito.locator('.g-ytitle', { hasText: 'count' })).not.toBeVisible();
  });

  test('Hide X axis title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await addChartElement(mito, page, 'Axis Titles', 'Horizontal');
    await expect(mito.getByText('count')).not.toBeVisible();
  });

  test('Hide Y axis title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await addChartElement(mito, page, 'Axis Titles', 'Vertical');
    await expect(mito.locator('.g-ytitle', { hasText: 'Column1' })).not.toBeVisible();
  });

  test('Hide graph title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await addChartElement(mito, page, 'Chart Title', 'Display Title');
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart' })).not.toBeVisible();
  });

  test('Hide and show range slider', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);
    await expect(mito.locator('.rangeslider-slidebox')).toBeVisible();

    await addChartElement(mito, page, 'Show Range Slider', 'None');
    await expect(mito.locator('.rangeslider-slidebox')).not.toBeVisible();

    await addChartElement(mito, page, 'Show Range Slider', 'Horizontal');
    await expect(mito.locator('.rangeslider-slidebox')).toBeVisible();
  });

  test('Hide and show gridlines', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    // Check that the gridlines are visible (by default)
    await openGraphEditor(mito, page);
    await expect(mito.locator('.xgrid.crisp')).toHaveCount(5);
    await expect(mito.locator('.ygrid.crisp')).toHaveCount(4);

    // Hide the y gridlines
    await addChartElement(mito, page, 'Grid Lines', 'Horizontal');

    // check that the y gridlines are hidden and the x gridlines are not affected
    await expect(mito.locator('.ygrid.crisp')).toHaveCount(0);
    await expect(mito.locator('.xgrid.crisp')).toHaveCount(5);

    // Hide the x gridlines
    await addChartElement(mito, page, 'Grid Lines', 'Vertical');

    // check that the x gridlines are hidden and the y gridlines are not affected
    await expect(mito.locator('.ygrid.crisp')).toHaveCount(0);
    await expect(mito.locator('.xgrid.crisp')).toHaveCount(0);

    // Show the y gridlines
    await addChartElement(mito, page, 'Grid Lines', 'Horizontal');

    // Check that the y gridlines are visible and the x gridlines are not affected
    await expect(mito.locator('.ygrid.crisp')).toHaveCount(4);
    await expect(mito.locator('.xgrid.crisp')).toHaveCount(0);

    // Show the x gridlines
    await addChartElement(mito, page, 'Grid Lines', 'Vertical');

    // Check that the x gridlines are visible and the y gridlines are not affected
    await expect(mito.locator('.ygrid.crisp')).toHaveCount(4);
    await expect(mito.locator('.xgrid.crisp')).toHaveCount(5);
  });

  test('Escape key closes graph title input', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await openGraphEditor(mito, page);

    await mito.locator('.g-xtitle', { hasText: 'count' }).dblclick();

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('Y axis Title');
    await mito.locator('.popup-input').press('Escape');

    await awaitResponse(page);
    await expect(mito.locator('.g-xtitle', { hasText: 'count' })).toBeVisible();
  });

  test('Change font color of the graph title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await openGraphEditor(mito, page);

    await clickTab(page, mito, 'Format');
    await mito.getByText('Text Fill').click();
    await mito.locator('#color-picker-').fill('#1c5bd9');
    await mito.locator('.mito-toolbar-bottom').click();
    await expect(mito.getByText('Column1 bar chart')).toHaveCSS('fill', 'rgb(42, 63, 95)');
  });

  test('Update x axis columns', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await openGraphEditor(mito, page);

    await addColumnToAxis(mito, page, 'X', 'Column2');
    await expect(mito.locator('.g-xtitle', { hasText: 'Column2' })).toBeVisible();

    await addColumnToAxis(mito, page, 'X', 'Column3');
    await expect(mito.locator('.g-gtitle', { hasText: 'Column2,  Column3, Column1 bar chart' })).toBeVisible();
  });

  test('Update y axis columns', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await openGraphEditor(mito, page);

    await addColumnToAxis(mito, page, 'Y', 'Column2');
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1,  Column2 bar chart' })).toBeVisible();

    await addColumnToAxis(mito, page, 'Y', 'Column3');
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1,  Column2,  Column3 bar chart' })).toBeVisible();
  });

  test('deleting the source data deletes the graph', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await openGraphEditor(mito, page);

    await mito.locator('.footer').getByText('test' ).click();
    await mito.locator('.tab', { hasText: 'test'}).click({ button: 'right' });
    await mito.locator('.mito-dropdown-item', { hasText: 'Delete' }).click();
    await awaitResponse(page);
    await expect(mito.getByText('Delete Sheet and Dependant Graphs')).toBeVisible();
    await mito.getByText('Delete Sheet and Graphs').click();
    await awaitResponse(page);
    await expect(mito.getByRole('button', { name: 'Import Files' })).toBeVisible();
    await expect(mito.locator('.tab')).toHaveCount(0);
  });

  // Commented out because it doesn't work in CI
  // test('Graph size changes when window resizes', async ({ page }) => {
  //   const mito = await getMitoFrameWithTestCSV(page);
  //   await openGraphEditor(mito, page);

  //   // Check that the graph has the default width
  //   await page.setViewportSize({ width: 1200, height: 600 });
  //   await awaitResponse(page);
  //   await expect(mito.locator('.plotly-graph-div')).toHaveCSS('width', '712px');

  //   // Change the window size and check that the graph has been updated
  //   await page.setViewportSize({ width: 1000, height: 800 });
  //   await awaitResponse(page);
  //   await expect(mito.locator('.plotly-graph-div')).toHaveCSS('width', '512px');
  // });

  test('Delete a column that is being used in a graph', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    await openGraphEditor(mito, page);
    await addColumnToAxis(mito, page, 'X', 'Column2');
    await expect(mito.locator('.g-gtitle', { hasText: 'Column2,  Column1 bar chart' })).toBeVisible();

    // Switch to data tab and delete on of the columns
    await mito.locator('.footer').getByText('test').click();
    await mito.locator('.endo-column-header-final-container').getByText('Column2').click();
    await page.keyboard.press('Delete');
    await awaitResponse(page);

    // Switch back to graph tab and check that the graph has been updated
    await mito.locator('.footer').getByText('graph0').click();
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart' })).toBeVisible();
  });

  test('Invalid numbers in graph format', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await openGraphEditor(mito, page);

    await clickTab(page, mito, 'Format');
    await mito.getByText('Chart Title').click();
    await mito.getByText('Legend').click();

    // Try to update the legend x position to an invalid number
    await mito.locator('input[type="number"]').first().fill('-3');
    await awaitResponse(page);

    // Check that the invalid number has not been applied
    await expect(mito.locator('input[type="number"]').first()).toHaveValue('');
  });
});
