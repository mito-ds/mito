// Copyright (c) Mito

import React, { useState } from 'react';
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';

import MitoAPI from '../../../jupyter/api';
import { AnalysisData, StepType, UIState, UserProfile } from '../../../types';
import { CSVImportParams } from '../../import/CSVImportScreen';
import FileBrowser from '../../import/FileBrowser/FileBrowser';
import { FileBrowserState } from '../../import/FileBrowser/FileBrowserBody';
import { FileElement, ImportScreen } from './FileImportTaskpane';


interface FileBrowserImportProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[];
    setCurrPathParts: (newPathParts: string[]) => void;

    selectedFile: FileElement | undefined;
    setSelectedFile: React.Dispatch<React.SetStateAction<FileElement | undefined>>;

    setScreen: React.Dispatch<React.SetStateAction<ImportScreen>>;
}



/* 
    Allows a user to import an XLSX file with the given name, and
    in turn allows them to configure how to import sheets in this
    file.
*/
function FileBrowserTaskpane(props: FileBrowserImportProps): JSX.Element {

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

    const {edit} = useSendEditOnClick<CSVImportParams, CSVImportParams>(
        undefined,
        StepType.SimpleImport,
        props.mitoAPI, props.analysisData, 
        {allowSameParamsToReapplyTwice: true}
    )

    return (
        <FileBrowser
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            userProfile={props.userProfile}
            setUIState={props.setUIState}
            isUpdate={false}

            currPathParts={props.currPathParts}
            setCurrPathParts={props.setCurrPathParts}

            selectedFile={props.selectedFile}
            setSelectedFile={props.setSelectedFile}

            fileBrowserState={fileBrowserState}
            setFileBrowserState={setFileBrowserState}

            setScreen={props.setScreen}
            importCSVFile={async (file) => {
                const filePath = await props.mitoAPI.getPathJoined([...props.currPathParts, file.name]);
                console.log("Sending", filePath)
                if (filePath) {
                    edit(() => {
                        return {
                            file_names: [filePath]
                        };
                    })
                }
            }}
        />
    )
}

export default FileBrowserTaskpane;