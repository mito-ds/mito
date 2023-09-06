import { MitoAPI } from "../../../api/api";
import { AnalysisData, UserProfile } from "../../../types";
import { isAtLeastBenchmarkVersion, isExcelImportEnabled } from "../../../utils/packageVersion";
import { fuzzyMatch } from "../../../utils/strings";
import { FileBrowserState } from "../../import/FileBrowser/FileBrowserBody";
import { FileElement } from "./FileImportTaskpane";

const PARENT_FOLDER_NAME = 'Parent Folder';


/* 
    Helper function that gets an ending of a file, or
    undefined if no such file ending exists
*/
export const getFileEnding = (elementName: string): string | undefined => {
    try {
        // Take just the file ending
        const nameSplit = elementName.split('.');
        return nameSplit[nameSplit.length - 1];
    } catch {
        return undefined;
    }
}


/* 
    Helper function that, for a given file, returns if there is an 
    error in importing the file. 

    Helpful in displaying in-place errors that tells users they cannot
    import xlsx files.
*/
export const getInvalidFileError = (
    selectedElement: FileElement, 
    userProfile: UserProfile,
): string | undefined => {
    // We do not display an error on directories, as you cannot
    // import them but we don't want to overload you
    if (selectedElement.isDirectory) {
        return undefined;
    }
    
    const VALID_FILE_ENDINGS = [
        'csv',
        'tsv',
        'txt',
        'tab',
    ]

    // If excel import is enabled, then add it as a valid ending
    if (isExcelImportEnabled(userProfile)) {
        VALID_FILE_ENDINGS.push('xlsx');
        if (userProfile.pandasVersion !== undefined && isAtLeastBenchmarkVersion(userProfile.pandasVersion, '1.0.0')) {
            VALID_FILE_ENDINGS.push('xlsm');
        }
    }

    // Check if the file ending is a type that we support out of the box
    for (const ending of VALID_FILE_ENDINGS) {
        if (selectedElement.name.toLowerCase().endsWith(ending)) {
            return undefined;
        }
    }

    // We try and get the ending from the file
    const fileEnding = getFileEnding(selectedElement.name);
    if (fileEnding === undefined) {
        return 'Sorry, we don\'t support that file type.'
    } else if (fileEnding == 'xlsx') {
        return 'Upgrade to pandas>=0.25.0 and Python>3.6 to import Excel files.'
    } else {
        return `Sorry, we don't support ${fileEnding} files.`
    }
}

/* 
    Helper function that returns if the import button is usable, 
    and also the message to display on the button based on which
    element is selected.
*/
export const getImportButtonStatus = (selectedElement: FileElement | undefined, userProfile: UserProfile, loadingImport: boolean, isUpdate: boolean): {disabled: boolean, buttonText: string} => {
    if (selectedElement === undefined) {
        return {
            disabled: true,
            buttonText: 'Select a File to Import'
        };
    }
    if (selectedElement.isDirectory) {
        return {
            disabled: true,
            buttonText: 'That\'s a Directory. Select a File'
        };
    }
    const invalidFileError = getInvalidFileError(selectedElement, userProfile);
    if (invalidFileError !== undefined) {
        return {
            disabled: true,
            buttonText: 'Select a Supported File Type'
        };
    }

    if (loadingImport) {
        return {
            disabled: false,
            buttonText: 'Importing...'
        };
    }

    return {
        disabled: false,
        buttonText: (!isUpdate ? 'Import ' : 'Update to ') + selectedElement.name
    };
}

export const isExcelFile = (element: FileElement | undefined): boolean => {
    return element !== undefined && !element?.isDirectory && 
        (element?.name.toLowerCase().endsWith('.xlsx') ||
        element?.name.toLowerCase().endsWith('.xlsm'))
}

export const getElementsToDisplay = (importState: FileBrowserState, analysisData: AnalysisData): FileElement[] => {

    const allElements: FileElement[] = [...importState.pathContents.elements];

    // If we're not in the top folder, add the parent folder
    if (!inRootFolder(importState.pathContents.path_parts) && !inImportFolder(importState.pathContents.path_parts, analysisData.importFolderData?.pathParts)) {
        allElements.push({
            isDirectory: true,
            isParentDirectory: true,
            name: PARENT_FOLDER_NAME,
            lastModified: 0
        })
    }

    // Filter to what is searched for
    const searchedElements = allElements.filter(element => {
        return fuzzyMatch(element.name, importState.searchString) > .8;
    });

    // Sort (making sure to keep the parent folder at the top, no matter what
    return searchedElements.sort((elementOne, elementTwo) => {
        if (elementOne.name === PARENT_FOLDER_NAME) {
            return -1;
        } else if (elementTwo.name === PARENT_FOLDER_NAME) {
            return 1;
        }

        if (importState.sort === 'name_ascending') {
            return elementOne.name < elementTwo.name ? -1 : 1;
        } else if (importState.sort === 'name_descending') {
            return elementOne.name >= elementTwo.name ? -1 : 1;
        } else if (typeof elementOne.lastModified !== 'number' || typeof elementTwo.lastModified !== 'number') {
            return 1;
        } else if (importState.sort === 'last_modified_ascending') {
            return elementOne.lastModified < elementTwo.lastModified ? -1 : 1;
        } else {
            return elementOne.lastModified >= elementTwo.lastModified ? -1 : 1;
        }
    })
}

export const inRootFolder = (pathParts: string[]): boolean => {
    pathParts = pathParts.filter(pathPart => pathPart !== '')
    return pathParts.length === 1 && (pathParts[0] === '/' || pathParts[0] === '\\');
}

export const inImportFolder = (pathParts: string[], importFolderDataPathParts: string[] | undefined): boolean => {

    if (importFolderDataPathParts === undefined) {
        return false;
    }
    
    if (pathParts.length !== importFolderDataPathParts.length) {
        return false;
    }

    for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] !== importFolderDataPathParts[i]) {
            return false;
        }
    }
    return true 
}



export const getFilePath = async (mitoAPI: MitoAPI, pathParts: string[], file: FileElement | undefined): Promise<string | undefined> => {
    const fullPath = [...pathParts];
    if (file === undefined) {
        return;
    }
    fullPath.push(file?.name)

    const response = await mitoAPI.getPathJoined(fullPath);
    return 'error' in response ? undefined : response.result;
}