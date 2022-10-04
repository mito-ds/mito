// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState } from '../../../types';
import XLSXImportScreen from '../../import/XLSXImportScreen';
import { ReplacingDataframeState, StepImportData } from './UpdateImportsTaskpane';
import { isExcelImportParams, updateStepImportDataList } from './UpdateImportsUtils';

interface UpdateXLSXImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    fileName: string;
    filePath: string;

    replacingDataframeState: ReplacingDataframeState;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>
}


function UpdateXLSXImportsTaskpane(props: UpdateXLSXImportTaskpaneProps): JSX.Element {

    const params = props.replacingDataframeState.params;
    if (!isExcelImportParams(params)) {
        props.setReplacingDataframeState(undefined);
        return (<></>)
    }

    return (
        <XLSXImportScreen
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
                if (params === undefined || !isExcelImportParams(params)) {
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
                            'step_type': 'excel_import',
                            'params': params
                        }
                    )
                })

                props.setReplacingDataframeState(undefined);

            }}
            editApplied={false}
            loading={false}
        
            backCallback={() => {
                props.setReplacingDataframeState(undefined);
            }}
        />
    )
}

export default UpdateXLSXImportsTaskpane;