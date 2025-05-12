/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@jupyterlab/galata';
import { 
  createAndRunNotebookWithCells, 
  waitForIdle,
} from '../jupyter_utils/jupyterlab_utils';

test.describe('App Builder Integration Test', () => {
  test('Convert notebook to Streamlit and run the app', async ({ page }) => {

    const notebookCode = 'x = 10'
    await createAndRunNotebookWithCells(page, [notebookCode]);
    await waitForIdle(page);
    
    // Click the Build App button in the toolbar
    await page.getByTitle('Convert to Streamlit').click();
    
    // Get the notebook name from the tab title
    const tabTitle = await page.locator('#tab-key-2-1').textContent()
    const notebookName = tabTitle?.replace('.ipynb', '') || 'test_file';
    
    // Expected file names in JupyterLab's file system
    const streamlitAppFileName = `${notebookName}-streamlit-app.py`;
    const requirementsFileName = 'requirements.txt';
    
    // Check the file browser to verify files were created
    // Navigate to the file browser tab first - using partial text match
    await page.getByRole('tab', { name: /File Browser/ }).click();
    
    // Wait for the file to appear in the file browser
    await page.getByLabel('File Browser Section').getByText(streamlitAppFileName).waitFor({ state: 'visible' });
    await page.getByLabel('File Browser Section').getByText(requirementsFileName).waitFor({ state: 'visible' });
    
    // Open the streamlit app file to verify its contents
    // Double-click on the streamlit app file to open it
    await page.getByLabel('File Browser Section').getByText(streamlitAppFileName).dblclick();
    
    // Check its contents
    const editorContent = await page.getByText('import streamlit as stst.').textContent();
    expect(editorContent).toContain('import streamlit as st');
    expect(editorContent).toContain('st.title(');
    expect(editorContent).toContain('x = 10');
  });
}); 