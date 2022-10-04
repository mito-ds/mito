// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState } from '../../../types';
import DataframeImportScreen from '../../import/DataframeImportScreen';
import { ReplacingDataframeState, StepImportData } from './UpdateImportsTaskpane';
import { isDataframeImportParams, updateStepImportDataList } from './UpdateImportsUtils';

interface UpdateDataframeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    replacingDataframeState: ReplacingDataframeState;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>
}


function UpdateDataframeImportTaskpane(props: UpdateDataframeImportTaskpaneProps): JSX.Element {

    const params = props.replacingDataframeState.params;
    if (!isDataframeImportParams(params)) {
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
                    if (prevUpdatedStepImportData === undefined) {
                        return undefined;
                    }
                    return updateStepImportDataList(
                        prevUpdatedStepImportData, 
                        props.replacingDataframeState.dataframeCreationIndex, 
                        {
                            'step_type': 'dataframe_import',
                            'params': params
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

export default UpdateDataframeImportTaskpane;