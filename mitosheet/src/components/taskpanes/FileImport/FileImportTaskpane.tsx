// Copyright (c) Mito

import React, { useState } from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState, UserProfile } from '../../../types';
import CSVImportTaskpane from './CSVImportTaskpane';
import FileBrowserTaskpane from './FileBrowserTaskpane';
import XLSXImportTaskpane from './XLSXImportTaskpane';

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
    screen: 'csv_import', 
    fileName: string,
    filePath: string,
    error?: string | undefined
} | {
    screen: 'xlsx_import',
    fileName: string,
    filePath: string
} | {
    screen: 'dataframe_import'
}


function FileImportTaskpane(props: ImportTaskpaneProps): JSX.Element {

    const [importState, setImportState] = useState<ImportState>({screen: 'file_browser'});

    // We only load a specific screen if the full file path is determined
    if (importState.screen === 'file_browser') {
        return (
            <FileBrowserTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                userProfile={props.userProfile}
                setUIState={props.setUIState}
            
                currPathParts={props.currPathParts}
                setCurrPathParts={props.setCurrPathParts}

                setImportState={setImportState}
            />
        )
    } else if (importState.screen == 'csv_import') {
        return (
            <CSVImportTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}

                fileName={importState.fileName}
                filePath={importState.filePath}

                error={importState.error}
                setScreen={setImportState}
            />
        )
    } else if (importState.screen == 'xlsx_import') {
        return (
            <XLSXImportTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
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