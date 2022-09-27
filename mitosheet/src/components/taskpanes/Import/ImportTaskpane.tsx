// Copyright (c) Mito

import React, { useState } from 'react';
// Import 
import MitoAPI, { PathContents } from '../../../jupyter/api';
import { AnalysisData, MitoError, UIState, UserProfile } from '../../../types';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import { TaskpaneType } from '../taskpanes';
import { UpdatedImport } from '../UpdateImports/UpdateImportsTaskpane';
import CSVImport, { CSVImportParams } from './CSVImport';
import FileImportBodyAndFooter from './FileImportBodyAndFooter';
import { isExcelFile } from './importUtils';
import XLSXImport, { ExcelImportParams } from './XLSXImport';


interface ImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;
    analysisData: AnalysisData;
    updateImportedData?: {
        updatedImports: UpdatedImport[], 
        importIndex: number
    }
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

    const updateImportedData = (newImportParams: CSVImportParams | ExcelImportParams): void => {
        if (props.updateImportedData === undefined) {
            return 
        }

        const newUpdatedImports: UpdatedImport[] = JSON.parse(JSON.stringify(props.updateImportedData.updatedImports))
        const importIndex = props.updateImportedData.importIndex

        if (Object.keys(newImportParams).includes('sheet_names')) {
            newImportParams = newImportParams as ExcelImportParams
            newUpdatedImports[importIndex] = {
                ...newUpdatedImports[importIndex],
                type: 'excel',
                import_params: newImportParams
            }
        } else {
            newImportParams = newImportParams as CSVImportParams
            newUpdatedImports[importIndex] = {
                ...newUpdatedImports[importIndex],
                type: 'csv', 
                import_params: newImportParams
            }
        }

        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: {type: TaskpaneType.UPDATEIMPORTS, updatedImports: newUpdatedImports}
            }
        })
    }
    
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
                updateImportEdit={props.updateImportedData === undefined ? undefined : updateImportedData}
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
                updateImportEdit={props.updateImportedData === undefined ? undefined : updateImportedData}
            />
        )
    }

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header='Import Files'
                setUIState={props.setUIState}
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
                updateImportedData={props.updateImportedData === undefined ? undefined : updateImportedData}
            />
        </DefaultTaskpane>            
    )
}

export default ImportTaskpane;