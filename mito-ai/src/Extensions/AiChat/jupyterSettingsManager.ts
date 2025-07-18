/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ISettingRegistry } from "@jupyterlab/settingregistry";
import { IDocumentManager } from "@jupyterlab/docmanager";

// Document manager plugin ID
const DOCMANAGER_PLUGIN_ID = '@jupyterlab/docmanager-extension:plugin';

// Set renameUntitledFileOnSave to false when the extension loads
export const setRenameUntitledFileOnSave = async (settingRegistry: ISettingRegistry, _documentManager: IDocumentManager): Promise<void> => {
    // Note we don't use the documentManager, but we require it as a parameter to make sure
    // that we leave the documentManager as a required token in the AiChatPlugin.ts file.
    
    try {
        await settingRegistry.set(DOCMANAGER_PLUGIN_ID, 'renameUntitledFileOnSave', false);
    } catch (error) {
        console.error('Failed to set renameUntitledFileOnSave setting:', error);
    }
};