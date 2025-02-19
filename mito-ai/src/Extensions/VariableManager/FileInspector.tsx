import { JupyterFrontEnd } from "@jupyterlab/application";


export type File = {
    path: string;
}



// Function to list all files in the current directory
export const listCurrentDirectoryFiles = async (app: JupyterFrontEnd) => {
    
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
            console.log(data_files)
            return data_files;
        }
        return [];
    } catch (error) {
        console.error('Error listing directory contents:', error);
        return [];
    }
};

