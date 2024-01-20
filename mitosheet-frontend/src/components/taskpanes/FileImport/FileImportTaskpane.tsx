// Copyright (c) Mito

import React, { useState } from 'react';
import { MitoAPI } from '../../../api/api';
import { AnalysisData, UIState, UserProfile } from '../../../types';
import FileBrowser from '../../import/FileBrowser/FileBrowser';
import CSVImportConfigTaskpane from './CSVImportConfigTaskpane';
import XLSXImportConfigTaskpane from './XLSXImportConfigTaskpane';

interface ImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;
}

export interface FileElement {
    isDirectory: boolean,
    isParentDirectory?: boolean,
    name: string,
    lastModified?: number;
}


export type ImportState = {
    screen: 'file_browser'
} | {
    screen: 'csv_import_config', 
    fileName: string,
    filePath: string,
    error?: string | undefined
} | {
    screen: 'xlsx_import_config',
    fileName: string,
    filePath: string
} | {
    screen: 'dataframe_import'
} | {
    screen: 'authenticate_to_snowflake'
} | {
    screen: 'user_defined_import',
    importer_name: string
}


function FileImportTaskpane(props: ImportTaskpaneProps): JSX.Element {

    const [importState, setImportState] = useState<ImportState>({screen: 'file_browser'});

    // We only load a specific screen if the full file path is determined
    if (importState.screen === 'file_browser') {
        return (
            <FileBrowser
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                userProfile={props.userProfile}
                setUIState={props.setUIState}
                isUpdate={false}

                currPathParts={props.currPathParts}
                setCurrPathParts={props.setCurrPathParts}

                setImportState={setImportState}
                importCSVFile={async (file) => {
                    // Get the full file path
                    const response = await props.mitoAPI.getPathJoined([...props.currPathParts, file.name]);
                    const filePath = 'error' in response ? undefined : response.result;
                    if (filePath === undefined) {
                        return;
                    }

                    // Send an import message
                    const result = await props.mitoAPI.editSimpleImport([filePath]);

                    // If it is an error, we open the import taskpane with an error
                    if ('error' in result) {
                        setImportState({
                            screen: 'csv_import_config',
                            fileName: file.name,
                            filePath: filePath,
                            error: result.error
                        })
                    }
                }}
            />
        )
    } else if (importState.screen == 'csv_import_config') {
        return (
            <CSVImportConfigTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}

                fileName={importState.fileName}
                filePath={importState.filePath}

                error={importState.error}
                setScreen={setImportState}
            />
        )
    } else if (importState.screen == 'xlsx_import_config') {
        return (
            <XLSXImportConfigTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                userProfile={props.userProfile}
                setUIState={props.setUIState}
                
                fileName={importState.fileName}
                filePath={importState.filePath}
            
                setImportState={setImportState}
            />
        )
    } else {
        return (<></>)
    }
}

export default FileImportTaskpane;