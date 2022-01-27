// Copyright (c) Mito

import React, { useEffect, useState } from 'react';

// Import 
import MitoAPI from '../../../api';
import DefaultTaskpane from '../DefaultTaskpane';
import { PathContents } from '../../../api';
import FileBrowser from './FileBrowser';
import { getFileEnding, getInvalidFileError } from './FileBrowserElement';
import TextButton from '../../elements/TextButton';
import { UIState } from '../../../types';
import XLSXImport from './XLSXImport';

// CSS
import '../../../../css/taskpanes/Import/ImportTaskpane.css'

interface ImportTaskpaneProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;
}

// When storing what is selected, we store if it is a file 
// or folder, as well as it's name (which is not the full
// path to the file, just the file name).
export interface FileElement {
    isDirectory: boolean,
    name: string,
    lastModified: number;
}

/* 
    Helper function that returns if the import button is usable, 
    and also the message to display on the button based on which
    element is selected.
*/
const getImportButtonStatus = (selectedElement: FileElement | undefined): {disabled: boolean, buttonText: string} => {
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
    const invalidFileError = getInvalidFileError(selectedElement);
    if (invalidFileError !== undefined) {
        return {
            disabled: true,
            buttonText: 'Select a Supported File Type'
        };
    }
    return {
        disabled: false,
        buttonText: 'Import ' + selectedElement.name
    };
}

/* 
    Imports the selected element by:
    1. Combining the path into one path string
    2. Passing this combined path into a simple import
*/
export async function doImport(mitoAPI: MitoAPI, currPathParts: string[], element: FileElement | undefined): Promise<void> {
    const importButtonStatus = getImportButtonStatus(element);
    // Quit early if the selected thing is not importable, or if there
    // is nothing even selected
    if (importButtonStatus.disabled || element === undefined) {
        return;
    }

    // Construct the final path that must be imported
    const finalPath = [...currPathParts];
    finalPath.push(element.name);
    const joinedPath = await mitoAPI.getPathJoined(finalPath);
    if (joinedPath === undefined) {
        return;
    }
    // And then actually import it
    await mitoAPI.sendSimpleImportMessage([joinedPath])
}

/* 
    Provides a import modal that allows users to import data
    using a file browser
*/
function ImportTaskpane(props: ImportTaskpaneProps): JSX.Element {

    // The path data for the currently selected path
    const [pathContents, setPathContents] = useState<PathContents | undefined>(undefined);

    // The file/folder that is currently selected 
    const [selectedElement, setSelectedElement] = useState<FileElement | undefined>(undefined);

    // If the file being imported is an XLSX, we need additional configuration
    // and so we use an import wizard for help
    const [fileForImportWizard, setFileForImportWizard] = useState<string | undefined>(undefined);
 
    // Loads the path data from the API and sets it for the file browser
    async function loadPathContents(currPathParts: string[]) {
        const _pathContents = await props.mitoAPI.getPathContents(currPathParts);
        setPathContents(_pathContents);
    }

    async function importElement(element: FileElement | undefined): Promise<void> {
        if (!element?.isDirectory && element?.name.toLowerCase().endsWith('.xlsx')) {
            setFileForImportWizard(element.name);
            return;
        }

        // Do the actual import
        await doImport(props.mitoAPI, props.currPathParts, element);
        // And then clear the selected element
        setSelectedElement(undefined);
    }

    
    /* 
        Any time the current path changes, we update
        the files that are displayed
    */
    useEffect(() => {
        // When the current path changes, we reload the path contents
        void loadPathContents(props.currPathParts)
        // We also unselect anything that might be selected
        setSelectedElement(undefined)
        // Log how long the path is
        void props.mitoAPI.sendLogMessage('curr_path_changed', {'path_parts_length': props.currPathParts.length})
    }, [props.currPathParts])

    /* 
        Any time the selected element changes we log the file
        ending (or none, if it has none).
    */
    useEffect(() => {
        let selectedElementName = '';
        if (selectedElement === undefined) {
            selectedElementName = 'undefined';
        } else if (selectedElement.isDirectory) {
            selectedElementName = 'directory';
        } else {
            const fileEnding = getFileEnding(selectedElement.name);
            if (fileEnding !== undefined) {
                selectedElementName = fileEnding;
            } else {
                selectedElementName = 'No File Ending';
            }
        }
        void props.mitoAPI.sendLogMessage(
            'selected_element_changed',
            {'selected_element': selectedElementName}
        )
    }, [selectedElement])


    const importButtonStatus = getImportButtonStatus(selectedElement);

    return (
        <DefaultTaskpane
            header = {fileForImportWizard === undefined ? 'Import Files' : `Import ${fileForImportWizard}`}
            setUIState={props.setUIState}
            noScroll={true}
            backCallback={fileForImportWizard === undefined ? undefined : () => {
                setFileForImportWizard(undefined);
            }}
            taskpaneBody = {
                <div className='import-taskpane flexbox-column flexbox-space-between'>
                    {fileForImportWizard === undefined &&
                        <>
                            <FileBrowser
                                mitoAPI={props.mitoAPI}
                                setCurrPathParts={props.setCurrPathParts}
                                pathParts={pathContents?.path_parts}
                                elements={pathContents?.elements || []}
                                selectedElement={selectedElement}
                                setSelectedElement={setSelectedElement}
                                importElement={importElement}
                            />
                            <div className='import-taskpane-import-button-container' >
                                <TextButton
                                    variant='dark'
                                    width='block'
                                    onClick={() => {
                                        void importElement(selectedElement);
                                    }}
                                    disabled={importButtonStatus.disabled}
                                >
                                    {importButtonStatus.buttonText}
                                </TextButton>
                            </div>
                        </>
                    }
                    {fileForImportWizard !== undefined &&
                        <XLSXImport
                            mitoAPI={props.mitoAPI}
                            pathParts={[...props.currPathParts, fileForImportWizard]}
                        />
                    }
                </div>
            }
        />
    )
}

export default ImportTaskpane;