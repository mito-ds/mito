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
                if (selectedFile === undefined) {
                    return;
                }

                console.log("newScreen", newScreen)

                if (newScreen === 'csv_import') {
                    // We need to get the full file path and add this to the params, presumably, so that the 
                    const loadCSVImport = async () => {
                        const fullPath = [...props.currPathParts]
                        fullPath.push(selectedFile.name);
                        const filePath = await props.mitoAPI.getPathJoined(fullPath);

                        if (filePath === undefined) {
                            return;
                        } 

                        props.setReplacingDataframeState({
                            'screen': 'csv_import',
                            'params': {
                                'file_names': [filePath]
                            },
                            'dataframeCreationIndex': props.replacingDataframeState.dataframeCreationIndex
                        })
                    }
                    void loadCSVImport();
                } else if (newScreen === 'xlsx_import') {
                    // We need to get the full file path and add this to the params, presumably, so that the 
                    const loadCSVImport = async () => {
                        const fullPath = [...props.currPathParts]
                        fullPath.push(selectedFile.name);
                        const filePath = await props.mitoAPI.getPathJoined(fullPath);

                        if (filePath === undefined) {
                            return;
                        } 

                        props.setReplacingDataframeState({
                            'screen': 'xlsx_import',
                            'params': {
                                'file_name': filePath, // TODO: explain how we use the full path here
                                'sheet_names': [],
                                'has_headers': true,
                                'skiprows': 0,
                            },
                            'dataframeCreationIndex': props.replacingDataframeState.dataframeCreationIndex
                        })
                    }
                    void loadCSVImport();

                }
                // If we 


            }}
            importCSVFile={async (file: FileElement) => {
                const fullPath = [...props.currPathParts]
                fullPath.push(file.name);
                const filePath = await props.mitoAPI.getPathJoined(fullPath);

                if (filePath === undefined) {
                    return
                }

                props.setUpdatedStepImportData((prevUpdatedStepImportData) => {
                    const newUpdatedStepImportData = [...prevUpdatedStepImportData]

                    // First, we go and find the specific step object we need to update
                    const stepIndex = newUpdatedStepImportData.findIndex((stepImportData) => stepImportData.step_id === props.replacingDataframeState.dataframeCreationIndex.step_id)

                    // TODO: break up the imports properly in this case!
                    newUpdatedStepImportData[stepIndex].imports[props.replacingDataframeState.dataframeCreationIndex.index] = {
                        'step_type': 'simple_import',
                        'params': {
                            file_names: [filePath],
                        }
                    }

                    return newUpdatedStepImportData;
                })

                props.setReplacingDataframeState(undefined);

            }}
            backCallback={() => {
                props.setReplacingDataframeState(undefined);
            }}
        />
    )
}

export default UpdateFileBrowserTaskpane;