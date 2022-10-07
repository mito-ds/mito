// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState } from '../../../types';
import DataframeImportScreen from '../../import/DataframeImportScreen';
import { ReplacingDataframeState, StepImportData } from './UpdateImportsTaskpane';
import { isDataframeImportParams, updateStepImportDataList } from './updateImportsUtils';

interface UpdateDataframeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    replacingDataframeState: ReplacingDataframeState;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>;
    setUpdatedIndexes: React.Dispatch<React.SetStateAction<number[]>>;
    setInvalidImportMessages: React.Dispatch<React.SetStateAction<Record<number, string | undefined>>>;
}


function UpdateDataframeImportTaskpane(props: UpdateDataframeImportTaskpaneProps): JSX.Element {

    const params = isDataframeImportParams(props.replacingDataframeState.params)
        ? props.replacingDataframeState.params
        : {df_names: []}

    return (
        <DataframeImportScreen
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            setUIState={props.setUIState}
            isUpdate={true}
                
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
                            'step_type': 'dataframe_import',
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
        
            backCallback={() => {
                props.setReplacingDataframeState(undefined);
            }}
        />
    )
}

export default UpdateDataframeImportTaskpane;