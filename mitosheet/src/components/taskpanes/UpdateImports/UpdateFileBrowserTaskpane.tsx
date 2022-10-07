// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState, UserProfile } from '../../../types';
import FileBrowser from '../../import/FileBrowser/FileBrowser';
import { FileElement } from '../FileImport/FileImportTaskpane';
import { ReplacingDataframeState, StepImportData } from './UpdateImportsTaskpane';
import { updateStepImportDataList } from './updateImportsUtils';

interface UpdateFileBrowserTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;

    replacingDataframeState: ReplacingDataframeState;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>;
    setUpdatedIndexes: React.Dispatch<React.SetStateAction<number[]>>;
    setInvalidImportMessages: React.Dispatch<React.SetStateAction<Record<number, string | undefined>>>;
}


function UpdateFileBrowserTaskpane(props: UpdateFileBrowserTaskpaneProps): JSX.Element {

    return (
        <FileBrowser
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            userProfile={props.userProfile}
            setUIState={props.setUIState}
            isUpdate={true}
        
            currPathParts={props.currPathParts}
            setCurrPathParts={props.setCurrPathParts}

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

                const dataframeCreationIndex = props.replacingDataframeState.dataframeCreationIndex;

                props.setUpdatedStepImportData((prevUpdatedStepImportData) => {
                    if (prevUpdatedStepImportData === undefined) {
                        return undefined;
                    }
                    return updateStepImportDataList(
                        prevUpdatedStepImportData, 
                        dataframeCreationIndex, 
                        {
                            'step_type': 'simple_import',
                            'params': {
                                file_names: [filePath],
                            }
                        }
                    )
                })
            
                // Mark this as updated
                props.setUpdatedIndexes((prevUpdatedIndexes) => {
                    if (prevUpdatedIndexes.includes(dataframeCreationIndex)) {
                        return prevUpdatedIndexes;
                    }
                    const newUpdatedIndexes = [...prevUpdatedIndexes];
                    newUpdatedIndexes.push(dataframeCreationIndex);
                    return newUpdatedIndexes;
                })

                // Remove the invalid import message if it exists
                props.setInvalidImportMessages(prevInvalidImportMessage => {
                    const newInvalidImportMessage = {...prevInvalidImportMessage};
                    if (newInvalidImportMessage[dataframeCreationIndex] !== undefined) {
                        delete newInvalidImportMessage[dataframeCreationIndex]
                    }
                    return newInvalidImportMessage;
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