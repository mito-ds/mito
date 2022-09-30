// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
// Import 
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState, UserProfile } from '../../../types';
import FileBrowser from '../../import/FileBrowser/FileBrowser';
import CSVImportTaskpane from './CSVImportTaskpane';
import { isExcelFile } from './importUtils';
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

export type ImportScreen = 'file_browser' | 'csv_import' | 'xslx_import';


function ImportTaskpane(props: ImportTaskpaneProps): JSX.Element {

    const [screen, setScreen] = useState<ImportScreen>('file_browser');
    const [selectedFile, setSelectedFile] = useState<FileElement | undefined>(undefined);
    const [filePath, setFilePath] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (selectedFile !== undefined) {
            if (isExcelFile(selectedFile)) {
                setScreen('xslx_import')
            } else {
                setScreen('csv_import')
            }
        }
    }, [selectedFile])

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

    console.log(screen, selectedFile, filePath);

    // We only load a specific screen if the full file path is determined
    if (screen === 'file_browser') {
        return (
            <FileBrowser
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                userProfile={props.userProfile}
                setUIState={props.setUIState}
                isUpdate={false}
            
                currPathParts={props.currPathParts}
                setCurrPathParts={props.setCurrPathParts}
            
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}

                setScreen={setScreen}
                importCSVFile={async (file) => {
                    console.log("Importing file", file)
                }}
            />
        )
    } else if (screen == 'csv_import') {
        return (
            <CSVImportTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}
            
                currPathParts={props.currPathParts}
                setCurrPathParts={props.setCurrPathParts}
            
                fileName={selectedFile?.name}
                filePath={filePath}
            
                setScreen={setScreen}
            />
        )
    } else {
        return (
            <XLSXImportTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}
            
                currPathParts={props.currPathParts}
                fileName={selectedFile?.name || ''}
            
                setScreen={setScreen}
            />
        )
    }
}

export default ImportTaskpane;