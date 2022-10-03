// Copyright (c) Mito

import React, { useState } from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState, UserProfile } from '../../../types';
import FileBrowser from '../../import/FileBrowser/FileBrowser';
import { FileBrowserState } from '../../import/FileBrowser/FileBrowserBody';
import { FileElement } from '../FileImport/FileImportTaskpane';
import { ReplacingDataframeState, StepImportData } from './UpdateImportsTaskpane';

interface UpdateFileBrowserTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;

    replacingDataframeState: ReplacingDataframeState;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[]>>
}


function UpdateFileBrowserTaskpane(props: UpdateFileBrowserTaskpaneProps): JSX.Element {

    const [fileBrowserState, setFileBrowserState] = useState<FileBrowserState>({
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

    const [selectedFile, setSelectedFile] = useState<FileElement | undefined>(undefined);

    return (
        <FileBrowser
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            userProfile={props.userProfile}
            setUIState={props.setUIState}
            isUpdate={true}
        
            currPathParts={props.currPathParts}
            setCurrPathParts={props.setCurrPathParts}

            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}

            fileBrowserState={fileBrowserState}
            setFileBrowserState={setFileBrowserState}

            setScreen={(newScreen) => {
                if (newScreen === 'csv_import') {
                    // We need to get the full file path
                }
                // If we 


            }}
            importCSVFile={async (file: FileElement) => {

            }}
            backCallback={() => {
                props.setReplacingDataframeState(undefined);
            }}
        />
    )
}

export default UpdateFileBrowserTaskpane;