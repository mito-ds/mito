// Copyright (c) Mito

import React, { useState } from 'react';
// Import 
import MitoAPI, { PathContents } from '../../../jupyter/api';
import { AnalysisData, MitoError, UIState, UserProfile } from '../../../types';
import { FileSort } from '../../import/FileBrowser/FileBrowserBody';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import { TaskpaneType } from '../taskpanes';
import { getImportName } from '../UpdateImports/ImportCard';
import { UpdatedImportObj } from '../UpdateImports/UpdateImportsTaskpane';
import { updateImportedDataWithFile } from '../UpdateImports/UpdateImportsUtils';
import CSVImport from './CSVImport';
import FileImportBodyAndFooter from './FileImportBodyAndFooter';
import { isExcelFile } from './importUtils';
import XLSXImport from './XLSXImport';


interface ImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;
    analysisData: AnalysisData;
    updateImportedData?: {
        updatedImportObjs: UpdatedImportObj[], 
        importIndex: number
    }
}


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
    lastModified?: number;
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
    const [fileForImportWizard, setFileForImportWizard] = useState<FileElement | undefined>(undefined);
    // It is very convenient to have the full joined path for the file, so this state and the 
    // effect below it make it possible to access this easily
    const [fullFileNameForImportWizard, setFullFileNameForImportWizard] = useState<string | undefined>(undefined)

    // Track if there has been an error
    const [importError, setImportError] = useState<MitoError | undefined>(undefined);
    
    // Check both the file and the full file name so that 
    // the screen does not flash when the back button is pressed
    // in the import wizard
    if (fileForImportWizard !== undefined && fullFileNameForImportWizard !== undefined && isExcelFile(fileForImportWizard)) {
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
                // If we're updating an existing import than pass a function to override the default edit function
                updateImportEdit={props.updateImportedData === undefined ? undefined : (newImportedData) => updateImportedDataWithFile(props.updateImportedData, newImportedData, props.setUIState)}
            />
        )
    } else if (fileForImportWizard !== undefined && fullFileNameForImportWizard !== undefined) {
        return (
            <CSVImport
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                fileName={fullFileNameForImportWizard}
                fileForImportWizard={fileForImportWizard}
                setFileForImportWizard={setFileForImportWizard}
                setImportState={setImportState}
                setUIState={props.setUIState} 
                importState={importState}
                error={importError}
                setError={setImportError}
                // If we're updating an existing import than pass a function to override the default edit function
                updateImportEdit={props.updateImportedData === undefined ? undefined : (newImportedData) => updateImportedDataWithFile(props.updateImportedData, newImportedData, props.setUIState)}
            />
        )
    }

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header={props.updateImportedData === undefined ? 'Import Files' : 'Replace ' + getImportName(props.updateImportedData?.updatedImportObjs[props.updateImportedData?.importIndex])}
                setUIState={props.setUIState}
                backCallback={props.updateImportedData === undefined ? undefined : () => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.UPDATEIMPORTS, updatedImportObjs: props.updateImportedData?.updatedImportObjs}
                        }
                    })
                }}
            />
            <FileImportBodyAndFooter
                mitoAPI={props.mitoAPI}
                importState={importState}
                setImportState={setImportState}
                setFullFileNameForImportWizard={setFullFileNameForImportWizard}
                setImportError={setImportError}
                fileForImportWizard={fileForImportWizard}
                setFileForImportWizard={setFileForImportWizard}
                userProfile={props.userProfile}
                setUIState={props.setUIState}
                currPathParts={props.currPathParts}
                setCurrPathParts={props.setCurrPathParts}
                analysisData={props.analysisData}
                // If we're updating an existing import than pass a function to override the default edit function
                updateImportedData={props.updateImportedData === undefined ? undefined : (newImportedData) => updateImportedDataWithFile(props.updateImportedData, newImportedData, props.setUIState)}
            />
        </DefaultTaskpane>            
    )
}

export default ImportTaskpane;