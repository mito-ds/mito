// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState } from '../../../types';
import CSVImportScreen from '../../import/CSVImportScreen';
import { ReplacingDataframeState, StepImportData } from './UpdateImportsTaskpane';
import { isCSVImportParams, updateStepImportDataList } from './UpdateImportsUtils';

interface UpdateCSVImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    fileName: string;
    filePath: string;

    replacingDataframeState: ReplacingDataframeState;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>
}


function UpdateCSVImportTaskpane(props: UpdateCSVImportTaskpaneProps): JSX.Element {

    const params = props.replacingDataframeState.params;
    if (!isCSVImportParams(params)) {
        props.setReplacingDataframeState(undefined);
        return (<></>)
    }

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
                        params: params === undefined ? undefined : updater(params)
                    }
                })
            }}
            edit={() => {
                // When we do the edit, we change the set this import
                // When we import the CSV, we update the screen

                const params = props.replacingDataframeState.params;
                if (params === undefined || !isCSVImportParams(params)) {
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
                            'step_type': 'simple_import',
                            'params': params
                        }
                    )
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