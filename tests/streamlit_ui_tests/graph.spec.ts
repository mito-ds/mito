import { expect, test } from '@playwright/test';
import { awaitResponse, clickButtonAndAwaitResponse, clickTab, getMitoFrameWithTestCSV, getMitoFrameWithTypeCSV } from './utils';

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

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.locator(selector).click({ button: 'right' });
    await mito.getByRole('button', { name: 'Delete Title' }).click();
    await awaitResponse(page);

    await expect(mito.locator(selector)).not.toBeVisible();
};

test.describe('Graph Functionality', () => {
    test('Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('#mito-center-content-container').getByText('Select Data')).toBeVisible();
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
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('.graph-sidebar-toolbar-content .select-container').nth(1)).toHaveText('Column1');
    await expect(mito.locator('.graph-sidebar-toolbar-content .select-container').nth(2)).toHaveText('Column2');
  })

  test('Change Chart type to Linear', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
    await mito.getByText('Line').hover();
    await clickButtonAndAwaitResponse(page, mito, { name: 'Linear' })

    await expect(mito.getByText('Column1 line')).toBeVisible();
  });

  test('Change Chart type to Horizontal Line Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
    await mito.getByText('Line').hover();
    await clickButtonAndAwaitResponse(page, mito, { name: 'Horizontal' })

    await expect(mito.getByText('Column1 line')).toBeVisible();
  });

  test('Change Chart type to vertical grouped bar Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
    await mito.getByRole('button', { name: 'Bar' }).hover();
    await mito.getByRole('button', { name: 'Grouped' }).first().click();
    await awaitResponse(page);

    await expect(mito.getByText('Column1 bar')).toBeVisible();
  });


  test('Change Chart type to horizontal grouped bar Graph', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
    await mito.getByRole('button', { name: 'Bar' }).hover();
    await mito.getByRole('button', { name: 'Grouped' }).nth(1).click();
    await awaitResponse(page);

    await expect(mito.getByText('Column1 bar')).toBeVisible();
  });

  test('Change Chart type to scatter', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
    await clickButtonAndAwaitResponse(page, mito, { name: 'Scatter' })

    await expect(mito.getByText('Column1 scatter plot')).toBeVisible();
  });

  test('Close Select Data taskpane then open it again and make an edit', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('#mito-center-content-container').getByText('Select Data')).toBeVisible();
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

  test('Make a histogram and change the aggregation function', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart' })).toBeVisible();
    await mito.getByRole('button', { name: '▾ Change Chart Type' }).click();
    await mito.getByRole('button', { name: 'Histogram' }).hover();
    await mito.getByRole('button', { name: 'Grouped' }).first().click();

    await mito.locator('.mito-graph-configuration-container').getByText('count').click();
    await mito.locator('.mito-dropdown-item', { hasText: 'sum' }).click();
    await expect(mito.locator('.g-ytitle')).toHaveText('sum of None');
  });

  test('Switch between graph and data tab', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart'})).toBeVisible();
    await mito.locator('.footer').getByText('test' ).click();

    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart'})).not.toBeVisible();
    await mito.locator('.footer').getByText('graph0' ).click();

    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart'})).toBeVisible();
  });

  test('Update graph when data changes', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart'})).toBeVisible();
    await expect(mito.locator('g.point')).toHaveCount(8);
    
    await mito.locator('.footer').getByText('test' ).click();

    // Apply a filter to the data
    await mito.locator('.endo-column-header-final-container').first().getByTitle('Edit Filters').click();
    await mito.getByText('Add Filter').click();
    await mito.getByText('Add a Filter').click();
    await mito.locator('.spacing-row', { hasText: 'Where' }).locator('input').fill('1');
    await expect(mito.locator('.mito-grid-cell-selected')).toHaveCount(3);

    // Check that the graph has been updated
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart'})).not.toBeVisible();
    await mito.locator('.footer').getByText('graph0').click();

    await awaitResponse(page);
    await awaitResponse(page);
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart'})).toBeVisible();
    await expect(mito.locator('g.point')).toHaveCount(6);
  });

  test('Select Data taskpane still visible after toggling full screen', async ({ page }) => {
    const mito = await getMitoFrameWithTestCSV(page);
    
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('#mito-center-content-container').getByText('Select Data')).toBeVisible();
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

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await openPopupAndEditTitle(mito, '.g-gtitle', 'My Graph Title');
  });

  test('Update X axis Title on double click', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await openPopupAndEditTitle(mito, '.g-xtitle', 'X axis Title');
  });

  test('Update Y axis Title with double click', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

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

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    // Add a column to the graph
    await mito.locator('.spacing-row', { hasText: 'Y Axis' }).getByText('+ Add').click();
    await mito.locator('.mito-dropdown-item').getByText('Column2').click();

    // Interact with the legend
    await mito.locator('.legend .groups').first().click();

    await openPopupAndEditTitle(mito, '.g-ytitle', 'Y axis Title');
  });

  test('Update X axis title through toolbar', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.locator('.g-xtitle', { hasText: 'count' })).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Axis Titles' }).hover();
    await mito.getByRole('button', { name: 'Edit X Axis Title' }).click();
    await awaitResponse(page);

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('X axis Title');
    await mito.locator('.popup-input').press('Enter');

    await awaitResponse(page);
    await expect(mito.locator('.g-xtitle', { hasText: 'X axis Title' })).toBeVisible();
  });

  test('Update Y axis title through toolbar', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.locator('.g-ytitle', { hasText: 'Column1' })).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Axis Titles' }).hover();
    await mito.getByRole('button', { name: 'Edit Y Axis Title' }).click();
    await awaitResponse(page);

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('Y axis Title');
    await mito.locator('.popup-input').press('Enter');

    await awaitResponse(page);
    await expect(mito.locator('.g-ytitle', { hasText: 'Y axis Title' })).toBeVisible();
  });

  test('Hide Graph title through selecting and pressing delete', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.getByText('Column1 bar chart')).toBeVisible();
    await mito.locator('.g-gtitle').click();
    await mito.locator('.g-gtitle').press('Backspace');
    await expect(mito.getByText('Column1 bar chart')).not.toBeVisible();
  });

  test('Hide x axis title through selecting and pressing delete', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('.g-xtitle', { hasText: 'count' })).toBeVisible();
    await mito.locator('.g-xtitle').click();
    await mito.locator('.g-xtitle').press('Backspace');
    await expect(mito.locator('.g-xtitle', { hasText: 'count' })).not.toBeVisible();
  });

  test('Hide y axis title through selecting and pressing delete', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await expect(mito.locator('.g-ytitle', { hasText: 'Column1' })).toBeVisible();
    await mito.locator('.g-ytitle').click();
    await mito.locator('.g-ytitle').press('Backspace');
    await expect(mito.locator('.g-ytitle', { hasText: 'count' })).not.toBeVisible();
  });

  test('Hide X axis title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('count')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Axis Titles' }).hover();
    await mito.getByRole('button', { name: 'Horizontal' }).click();
    await awaitResponse(page);

    await expect(mito.getByText('count')).not.toBeVisible();
  });

  test('Hide Y axis title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.locator('.g-ytitle', { hasText: 'Column1' })).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Axis Titles' }).hover();
    await mito.getByRole('button', { name: 'Vertical' }).click();
    await awaitResponse(page);

    await expect(mito.locator('.g-ytitle', { hasText: 'Column1' })).not.toBeVisible();
  });

  test('Hide graph title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart' })).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Chart Title' }).hover();
    await mito.getByRole('button', { name: 'Display Title' }).click();
    await awaitResponse(page);

    await expect(mito.locator('.g-gtitle', { hasText: 'Column1 bar chart' })).not.toBeVisible();
  });

  test('Hide and show range slider', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.locator('.rangeslider-slidebox')).toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Show Range Slider' }).hover();
    await mito.getByRole('button', { name: 'None' }).click();
    await awaitResponse(page);

    await expect(mito.locator('.rangeslider-slidebox')).not.toBeVisible();

    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Show Range Slider' }).hover();
    await mito.getByRole('button', { name: 'Horizontal' }).click();
    await awaitResponse(page);

    await expect(mito.locator('.rangeslider-slidebox')).toBeVisible();
  });

  test('Hide and show gridlines', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    // Check that the gridlines are visible (by default)
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.locator('.xgrid.crisp')).toHaveCount(5);
    await expect(mito.locator('.ygrid.crisp')).toHaveCount(4);

    // Hide the y gridlines
    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Grid Lines' }).hover();
    await mito.getByRole('button', { name: 'Horizontal' }).click();
    await awaitResponse(page);

    // check that the y gridlines are hidden and the x gridlines are not affected
    await expect(mito.locator('.ygrid.crisp')).toHaveCount(0);
    await expect(mito.locator('.xgrid.crisp')).toHaveCount(5);

    // Hide the x gridlines
    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Grid Lines' }).hover();
    await mito.getByRole('button', { name: 'Vertical' }).click();
    await awaitResponse(page);

    // check that the x gridlines are hidden and the y gridlines are not affected
    await expect(mito.locator('.ygrid.crisp')).toHaveCount(0);
    await expect(mito.locator('.xgrid.crisp')).toHaveCount(0);

    // Show the y gridlines
    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Grid Lines' }).hover();
    await mito.getByRole('button', { name: 'Horizontal' }).click();
    await awaitResponse(page);

    // Check that the y gridlines are visible and the x gridlines are not affected
    await expect(mito.locator('.ygrid.crisp')).toHaveCount(4);
    await expect(mito.locator('.xgrid.crisp')).toHaveCount(0);

    // Show the x gridlines
    await mito.getByRole('button', { name: '▾ Add Chart Element' }).click();
    await mito.getByRole('button', { name: 'Grid Lines' }).hover();
    await mito.getByRole('button', { name: 'Vertical' }).click();
    await awaitResponse(page);

    // Check that the x gridlines are visible and the y gridlines are not affected
    await expect(mito.locator('.ygrid.crisp')).toHaveCount(4);
    await expect(mito.locator('.xgrid.crisp')).toHaveCount(5);
  });

  test('Escape key closes graph title input', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);

    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })
    await expect(mito.getByText('Column1 bar chart')).toBeVisible();

    await mito.locator('.g-xtitle', { hasText: 'count' }).dblclick();

    await expect(mito.locator('.popup-input')).toBeVisible();
    await mito.locator('.popup-input').fill('Y axis Title');
    await mito.locator('.popup-input').press('Escape');

    await awaitResponse(page);
    await expect(mito.locator('.g-xtitle', { hasText: 'count' })).toBeVisible();
  });

  test('Change font color of the graph title', async ({ page }) => {
    const mito = await getMitoFrameWithTypeCSV(page);
    await clickButtonAndAwaitResponse(page, mito, { name: 'Graph' })

    await clickTab(page, mito, 'Format');
    await mito.getByText('Text Fill').click();
    await mito.locator('#color-picker-').fill('#1c5bd9');
    await mito.locator('.mito-toolbar-bottom').click();
    await expect(mito.getByText('Column1 bar chart')).toHaveCSS('fill', 'rgb(42, 63, 95)');
  });
});
