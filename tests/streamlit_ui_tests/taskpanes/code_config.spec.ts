import { test } from '@playwright/test';
import { checkOpenTaskpane, clickTab, getMitoFrameWithTestCSV } from '../utils';


test.describe('Code Config', () => {
    test.skip('Test Configure Code', async ({ page }) => {
        const mito = await getMitoFrameWithTestCSV(page);
        await clickTab(page, mito, 'Code');
    
        await mito.getByRole('button', { name: 'Configure Code' }).click();
        await checkOpenTaskpane(mito, 'Generated Code Options');
    
        await mito.locator('.toggle').first().click();
        await mito.getByRole('textbox').fill('new name');
        
        // TODO: check some output
      });
});