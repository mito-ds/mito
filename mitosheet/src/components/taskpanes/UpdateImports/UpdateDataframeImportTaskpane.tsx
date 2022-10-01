// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState } from '../../../types';
import DataframeImportScreen from '../../import/DataframeImportScreen';
import { ReplacingDataframeState, StepImportData } from './UpdateImportsTaskpane';
import { isDataframeImportParams } from './UpdateImportsUtils';

interface UpdateDataframeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    replacingDataframeState: ReplacingDataframeState;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[]>>
}


function UpdateDataframeImportTaskpane(props: UpdateDataframeImportTaskpaneProps): JSX.Element {

    const params = props.replacingDataframeState.params;
    if (!isDataframeImportParams(params)) {
        console.log("HERE!", params);
        props.setReplacingDataframeState(undefined);
        return (<></>)
    }

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
                        params: params === undefined ? undefined : updater(params)
                    }
                })
            }}
            edit={() => {
                // When we do the edit, we change the set this import
                // When we import the CSV, we update the screen

                const params = props.replacingDataframeState.params;
                if (params === undefined || !isDataframeImportParams(params)) {
                    return params;
                }

                props.setUpdatedStepImportData((prevUpdatedStepImportData) => {
                    const newUpdatedStepImportData = [...prevUpdatedStepImportData]

                    // First, we go and find the specific step object we need to update
                    const stepIndex = newUpdatedStepImportData.findIndex((stepImportData) => stepImportData.step_id === props.replacingDataframeState.dataframeCreationIndex.step_id)

                    // TODO: break up the imports properly in this case!
                    newUpdatedStepImportData[stepIndex].imports[props.replacingDataframeState.dataframeCreationIndex.index] = {
                        'step_type': 'dataframe_import',
                        'params': params
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

export default UpdateDataframeImportTaskpane;