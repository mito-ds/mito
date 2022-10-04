// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
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

export type ImportScreen = 'file_browser' | 'csv_import' | 'xlsx_import';
export interface ImportState {
    screen: ImportScreen,
    error?: string | undefined
}


function FileImportTaskpane(props: ImportTaskpaneProps): JSX.Element {

    const [importState, setImportState] = useState<ImportState>({screen: 'file_browser'});
    const [selectedFile, setSelectedFile] = useState<FileElement | undefined>(undefined);
    const [filePath, setFilePath] = useState<string | undefined>(undefined);

    useEffect(() => {
        const loadFilePath = async () => {
            if (selectedFile !== undefined) {
                const fullPath = [...props.currPathParts];
                fullPath.push(selectedFile.name);
                const _filePath = await props.mitoAPI.getPathJoined(fullPath);
                setFilePath(_filePath);
            } else {
                setFilePath(undefined);
            }
        }
        void loadFilePath();
    }, [selectedFile])

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
            
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}

                setImportState={setImportState}
            />
        )
    } else if (importState.screen == 'csv_import') {
        return (
            <CSVImportTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}

                fileName={selectedFile?.name || ''}
                filePath={filePath || ''}

                error={importState.error}
                setScreen={setImportState}
            />
        )
    } else {
        return (
            <XLSXImportTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}
            
                
                fileName={selectedFile?.name || ''}
                filePath={filePath || ''}
            
                setImportState={setImportState}
            />
        )
    }
}

export default FileImportTaskpane;