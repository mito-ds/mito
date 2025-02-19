import { JupyterFrontEnd } from "@jupyterlab/application";
import { INotebookTracker } from "@jupyterlab/notebook";


export type File = {
    path: string;
}


/* 
    Fetches all files in the current directory and updates the state of the files.
*/
export const fetchFilesAndUpdateState = async (
    app: JupyterFrontEnd, 
    notebookTracker: INotebookTracker, 
    setFiles: (files: File[]) => void
): Promise<void> => {
    
    const fileManager = app.serviceManager.contents;

    try {
        const contents = await fileManager.get('');
        if (contents.type === 'directory') {
            // Filter for only csv and Excel files
            const data_files = contents.content.filter((file: any) => {
                const extension = file.name.split('.').pop()?.toLowerCase();
                return extension === 'csv' ||
                    extension === 'xlsx' ||
                    extension === 'xls' ||
                    extension === 'xlsm';
            });
            setFiles(data_files);
        }

        // If the contents are not a directory, set the files to an empty array
        setFiles([]);
    } catch (error) {
        console.error('Error listing directory contents:', error);
        setFiles([]);
    }
};

