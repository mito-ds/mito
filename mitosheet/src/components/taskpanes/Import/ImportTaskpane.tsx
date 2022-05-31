// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
// Import 
import MitoAPI, { PathContents } from '../../../jupyter/api';
import { AnalysisData, UIState, UserProfile } from '../../../types';
import TextButton from '../../elements/TextButton';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneFooter from '../DefaultTaskpane/DefaultTaskpaneFooter';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import FileBrowser from './FileBrowser';
import { getElementsToDisplay, getFileEnding, getImportButtonStatus } from './importUtils';
import XLSXImport from './XLSXImport';



interface ImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;
    analysisData: AnalysisData;
}

type FileSort = 'name_ascending' | 'name_descending' | 'last_modified_ascending' | 'last_modified_descending';

export interface ImportTaskpaneState {
    pathContents: PathContents,
    sort: FileSort,
    searchString: string,
    selectedElementIndex: number,
    loadingFolder: boolean,
    loadingImport: boolean,
}

// When storing what is selected, we store if it is a file 
// or folder, as well as it's name (which is not the full
// path to the file, just the file name).
export interface FileElement {
    isDirectory: boolean,
    isParentDirectory?: boolean,
    name: string,
    lastModified: number;
}

function ImportTaskpane(props: ImportTaskpaneProps): JSX.Element {

    const [importState, setImportState] = useState<ImportTaskpaneState>({
        pathContents: {
            path_parts: props.currPathParts,
            elements: []
        },
        sort: 'last_modified_descending',
        searchString: '',
        selectedElementIndex: -1,
        loadingFolder: false,
        loadingImport: false
    })

    // If the file being imported is an XLSX, we need additional configuration
    // and so we use an import wizard for help
    const [fileForImportWizard, setFileForImportWizard] = useState<string | undefined>(undefined);
    // It is very convenient to have the full joined path for the file, so this state and the 
    // effect below it make it possible to access this easily
    const [fullFileNameForImportWizard, setFullFileNameForImportWizard] = useState<string | undefined>(undefined)

    useEffect(() => {
        const getFullFileNameForImportWizard = async (fileForImportWizard: string): Promise<void> => {
            const finalPath = [...props.currPathParts];
            finalPath.push(fileForImportWizard);
            const fullFileName = await props.mitoAPI.getPathJoined(finalPath);
            setFullFileNameForImportWizard(fullFileName);
        }
        if (fileForImportWizard !== undefined) {
            void getFullFileNameForImportWizard(fileForImportWizard);
        } else {
            setFullFileNameForImportWizard(undefined);
        }
    }, [fileForImportWizard])

    // We make sure to get the elements that are displayed and use the index on that to get the correct element
    const selectedElement: FileElement | undefined = getElementsToDisplay(importState)[importState.selectedElementIndex];



    /* 
        Any time the current path changes, we update
        the files that are displayed
    */
    useEffect(() => {
        // When the current path changes, we reload the path contents
        void loadPathContents(props.currPathParts)
        // We also unselect anything that might be selected
        setImportState(prevImportState => {
            return {
                ...prevImportState,
                selectedElementIndex: -1
            }
        })
        // Log how long the path is
        void props.mitoAPI.log('curr_path_changed', {'path_parts_length': props.currPathParts.length})
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
        void props.mitoAPI.log(
            'selected_element_changed',
            {'selected_element': selectedElementName}
        )

    }, [selectedElement])
    

    // Loads the path data from the API and sets it for the file browser
    async function loadPathContents(currPathParts: string[]) {
        setImportState(prevImportState => {
            return {
                ...prevImportState,
                loadingFolder: true
            }
        })
        const _pathContents = await props.mitoAPI.getPathContents(currPathParts);
        if (_pathContents) {
            setImportState(prevImportState => {
                return {
                    ...prevImportState,
                    pathContents: _pathContents,
                    loadingFolder: false
                }
            })
        } else {
            setImportState(prevImportState => {
                return {
                    ...prevImportState,
                    loadingFolder: false
                }
            })
        }
    }

    async function importElement(element: FileElement | undefined): Promise<void> {
        const importButtonStatus = getImportButtonStatus(element, props.userProfile.excelImportEnabled, importState.loadingImport);
        // Quit early if the selected thing is not importable, or if there
        // is nothing even selected
        if (importButtonStatus.disabled || element === undefined) {
            return;
        }

        if (!element?.isDirectory && element?.name.toLowerCase().endsWith('.xlsx')) {
            setFileForImportWizard(element.name);
            return;
        }

        // Do the actual import
        const finalPath = [...props.currPathParts];
        finalPath.push(element.name);
        const joinedPath = await props.mitoAPI.getPathJoined(finalPath);
        if (joinedPath === undefined) {
            return;
        }
        // And then actually import it
        setImportState(prevImportState => {
            return {
                ...prevImportState,
                loadingImport: true
            }
        })
        await props.mitoAPI.editSimpleImport([joinedPath])
        setImportState(prevImportState => {
            return {
                ...prevImportState,
                loadingImport: false
            }
        })
    }

    const importButtonStatus = getImportButtonStatus(selectedElement, props.userProfile.excelImportEnabled, importState.loadingImport);
    
    if (fullFileNameForImportWizard !== undefined) {
        return (
            <XLSXImport
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                fileName={fullFileNameForImportWizard}
                fileForImportWizard={fileForImportWizard}
                setFileForImportWizard={setFileForImportWizard}
                setImportState={setImportState}
                setUIState={props.setUIState} 
                importState={importState}
            />
        )
    }
    
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header='Import Files'
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody noScroll>
                <FileBrowser
                    mitoAPI={props.mitoAPI}
                    setCurrPathParts={props.setCurrPathParts}
                    importState={importState}
                    setImportState={setImportState}
                    importElement={importElement}
                    userProfile={props.userProfile}
                />
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
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
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>            
    )
}

export default ImportTaskpane;