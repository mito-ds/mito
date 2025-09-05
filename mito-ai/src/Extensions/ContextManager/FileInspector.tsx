/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { PathExt } from '@jupyterlab/coreutils';
import { JupyterFrontEnd } from "@jupyterlab/application";
import { NotebookPanel } from "@jupyterlab/notebook";


export type File = {
    file_name: string;
}


/* 
    Fetches all files in the current directory and updates the state of the files.
*/
export const getFiles = async (
    app: JupyterFrontEnd, 
    notebookPanel: NotebookPanel, 
): Promise<File[]> => {
    
    const fileManager = app.serviceManager.contents;
    const relativeNotebookPath = notebookPanel.context.path;
    const relativeDirectoryPath = PathExt.dirname(relativeNotebookPath);

    try {
        const contents = await fileManager.get(relativeDirectoryPath);
        if (contents.type === 'directory') {
            // Filter for only csv and Excel files
            const data_files = contents.content.filter((file: any) => {
                const extension = file.name.split('.').pop()?.toLowerCase();
                return extension === 'csv' ||
                    extension === 'xlsx' ||
                    extension === 'xls' ||
                    extension === 'xlsm';
            });

            // Map the files to the File type
            const files = data_files.map((file: any) => ({
                file_name: file.name
            }));

            // Update the state of the files
            return files;
        } else {
            // If the contents are not a directory, set the files to an empty array
            return [];
        }
        
    } catch (error) {
        console.error('Error listing directory contents:', error);
        return [];
    }
};

