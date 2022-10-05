// Copyright (c) Mito

import React, { useState } from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState, UserProfile } from '../../../types';
import FileBrowser from '../../import/FileBrowser/FileBrowser';
import { FileBrowserState } from '../../import/FileBrowser/FileBrowserBody';
import { FileElement } from '../FileImport/FileImportTaskpane';
import { ReplacingDataframeState, StepImportData } from './UpdateImportsTaskpane';
import { updateStepImportDataList } from './UpdateImportsUtils';

interface UpdateFileBrowserTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;

    replacingDataframeState: ReplacingDataframeState;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>
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

    return (
        <FileBrowser
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            userProfile={props.userProfile}
            setUIState={props.setUIState}
            isUpdate={true}
        
            currPathParts={props.currPathParts}
            setCurrPathParts={props.setCurrPathParts}

            fileBrowserState={fileBrowserState}
            setFileBrowserState={setFileBrowserState}

            setImportState={(newImportState) => {
                props.setReplacingDataframeState({
                    'importState': newImportState,
                    'params': undefined,
                    'dataframeCreationIndex': props.replacingDataframeState.dataframeCreationIndex
                })
            }}
            importCSVFile={async (file: FileElement) => {
                const fullPath = [...props.currPathParts]
                fullPath.push(file.name);
                const filePath = await props.mitoAPI.getPathJoined(fullPath);

                if (filePath === undefined) {
                    return
                }

                props.setUpdatedStepImportData((prevUpdatedStepImportData) => {
                    if (prevUpdatedStepImportData === undefined) {
                        return undefined;
                    }
                    return updateStepImportDataList(
                        prevUpdatedStepImportData, 
                        props.replacingDataframeState.dataframeCreationIndex, 
                        {
                            'step_type': 'simple_import',
                            'params': {
                                file_names: [filePath],
                            }
                        }
                    )
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