// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState } from '../../../types';
import CSVImportScreen, { CSVImportParams } from '../../import/CSVImportScreen';
import { ReplacingDataframeState } from './UpdateImportsTaskpane';

interface UpdateCSVImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    fileName: string;
    filePath: string;

    replacingDataframeState: ReplacingDataframeState;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;
}


function UpdateCSVImportTaskpane(props: UpdateCSVImportTaskpaneProps): JSX.Element {

    const possibleParams = props.replacingDataframeState.params;
    if (possibleParams === undefined || !('delimiters' in possibleParams)) {
        // Change the state
        props.setReplacingDataframeState(undefined);
    }
    const params = possibleParams as CSVImportParams; // TODO: move to a proper type guard

    return (
        <CSVImportScreen
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            setUIState={props.setUIState}
            isUpdate={true}
        
            fileName={props.fileName}
            filePath={props.filePath}
        
            params={params}
            setParams={(newParams) => {
                
            }}
            edit={() => {
                // When we import the CSV, we update the screen

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