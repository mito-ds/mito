/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { expect, test } from '@jupyterlab/galata';
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
    createAndRunNotebookWithCells,
    getCodeFromCell,
    waitForIdle,
} from '../jupyter_utils/jupyterlab_utils';
import {
    clickAcceptButton,
    clickPreviewButton,
    sendMessagetoAIChat,
    startNewMitoAIChat,
} from './utils';
import { CLAUDE_SONNET_DISPLAY_NAME } from '../../mito-ai/src/utils/models';

const MODEL = CLAUDE_SONNET_DISPLAY_NAME
const USER_JSON_PATH = path.join(os.homedir(), ".mito", "user.json");
const BACKUP_USER_JSON_PATH = path.join(os.homedir(), ".mito", "user.json.backup");

test.describe.parallel('User Signup', () => {

    test.beforeAll(async () => {
        // Backup the existing user.json file and modify user_email to empty string
        try {
            await fs.access(USER_JSON_PATH);
            await fs.copyFile(USER_JSON_PATH, BACKUP_USER_JSON_PATH);

            // Read the current user.json
            const userJsonContent = await fs.readFile(USER_JSON_PATH, 'utf-8');
            const userData = JSON.parse(userJsonContent);

            // Set user_email to empty string to trigger signup flow
            userData.user_email = "";

            // Write the modified user.json back
            await fs.writeFile(USER_JSON_PATH, JSON.stringify(userData, null, 2));
            console.log('Modified user.json to have empty user_email for signup testing');
        } catch (error) {
            console.log('No existing user.json found');
        }
    });

    test.beforeEach(async ({ page }) => {
        await createAndRunNotebookWithCells(page, []);
        await waitForIdle(page);

        await startNewMitoAIChat(page, MODEL);
    });

    test.afterAll(async () => {
        // Restore the original user.json file if it was backed up
        try {
            await fs.access(BACKUP_USER_JSON_PATH);
            await fs.copyFile(BACKUP_USER_JSON_PATH, USER_JSON_PATH);
            await fs.unlink(BACKUP_USER_JSON_PATH);
            console.log('Restored original user.json file');
        } catch (error) {
            // No backup file to restore, which is fine
            console.log('No backup user.json to restore');
        }
    });

    test('User can send message after signing up', async ({ page }) => {
        // First, we should see the signup form
        await expect(page.locator('[data-testid="signup-form-message"]')).toBeVisible();

        // Fill in the email field
        const emailInput = page.locator('.signup-form-input');
        await emailInput.fill('github@action.com');

        // Click the sign up button
        const signupButton = page.locator('.signup-form-button');
        await signupButton.click();

        // Wait for the signup form to disappear (indicating successful signup)
        await expect(page.locator('[data-testid="signup-form-message"]')).not.toBeVisible();

        await sendMessagetoAIChat(page, 'print("Hello, world!")');

        await clickPreviewButton(page);

        await clickAcceptButton(page);
        await waitForIdle(page);

        const code = await getCodeFromCell(page, 0);
        expect(code).toContain('print("Hello, world!")');
    });

});