// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState } from '../../../types';
import CSVImportScreen from '../../import/CSVImportScreen';
import { getDefaultCSVParams } from '../FileImport/CSVImportTaskpane';
import { ReplacingDataframeState, StepImportData } from './UpdateImportsTaskpane';
import { isCSVImportParams, updateStepImportDataList } from './updateImportsUtils';

interface UpdateCSVImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    fileName: string;
    filePath: string;

    replacingDataframeState: ReplacingDataframeState;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>;
    setUpdatedIndexes: React.Dispatch<React.SetStateAction<number[]>>;
    setInvalidImportMessages: React.Dispatch<React.SetStateAction<Record<number, string | undefined>>>;
}


function UpdateCSVImportTaskpane(props: UpdateCSVImportTaskpaneProps): JSX.Element {

    const params = isCSVImportParams(props.replacingDataframeState.params)
        ? props.replacingDataframeState.params
        : getDefaultCSVParams(props.filePath)

    return (
        <CSVImportScreen
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            setUIState={props.setUIState}
            isUpdate={true}
        
            fileName={props.fileName}
            filePath={props.filePath}
        
            params={params}
            setParams={(updater) => {
                props.setReplacingDataframeState(prevReplacingDataframeState => {
                    if (prevReplacingDataframeState === undefined) {
                        return undefined;
                    }

                    return {
                        ...prevReplacingDataframeState,
                        params: updater(params)
                    }
                })
            }}
            edit={() => {
                const dataframeCreationIndex = props.replacingDataframeState.dataframeCreationIndex

                // When we do the edit, we change the set this import
                // When we import the CSV, we update the screen
                props.setUpdatedStepImportData((prevUpdatedStepImportData) => {
                    if (prevUpdatedStepImportData === undefined) {
                        return undefined;
                    }
                    return updateStepImportDataList(
                        prevUpdatedStepImportData, 
                        dataframeCreationIndex, 
                        {
                            'step_type': 'simple_import',
                            'params': params
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
            editApplied={false}
            loading={false}
            error={undefined}
        
            backCallback={() => {
                props.setReplacingDataframeState(undefined);
            }}
        />
    )
}

export default UpdateCSVImportTaskpane;