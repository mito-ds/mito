// Copyright (c) Mito

import React from 'react';
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, StepType, UIState } from '../../../types';
import CSVImportScreen, { CSVImportParams } from '../../import/CSVImportScreen';
import { ImportState } from './FileImportTaskpane';

interface CSVImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    fileName: string;
    filePath: string;

    error: string | undefined;
    setScreen: React.Dispatch<React.SetStateAction<ImportState>>;
}


export const getDefaultCSVParams = (filePath: string): CSVImportParams => {
    return {
        file_names: [filePath],
        delimeters: [','],
        encodings: ['default'],
        error_bad_lines: [true]
    }
}


function CSVImportTaskpane(props: CSVImportTaskpaneProps): JSX.Element {

    const {params, setParams, loading, edit, editApplied, error} = useSendEditOnClick(
        () => getDefaultCSVParams(props.filePath),
        StepType.SimpleImport,
        props.mitoAPI, props.analysisData,
        {allowSameParamsToReapplyTwice: true},
    )

    console.log("Error", props.error)

    return (
        <CSVImportScreen
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            setUIState={props.setUIState}
            isUpdate={false}
        
            fileName={props.fileName}
            filePath={props.filePath}
        
            params={params}
            setParams={setParams}
            edit={edit}
            editApplied={editApplied}
            loading={loading}
            error={props.error !== undefined ? props.error : error}
        
            backCallback={() => {
                props.setScreen({screen: 'file_browser'})
            }}
        />
    )



}

export default CSVImportTaskpane;