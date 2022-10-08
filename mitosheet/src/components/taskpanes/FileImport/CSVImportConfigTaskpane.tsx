// Copyright (c) Mito

import React from 'react';
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, StepType, UIState } from '../../../types';
import CSVImportScreen, { CSVImportParams } from '../../import/CSVImportConfigScreen';
import { ImportState } from './FileImportTaskpane';

interface CSVImportConfigTaskpaneProps {
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

/**
 * A taskpane that allows a user to configur a CSV taskpane for import
 * as a new step.
 */
function CSVImportConfigTaskpane(props: CSVImportConfigTaskpaneProps): JSX.Element {

    const {params, setParams, loading, edit, editApplied, error} = useSendEditOnClick(
        () => getDefaultCSVParams(props.filePath),
        StepType.SimpleImport,
        props.mitoAPI, props.analysisData,
        {allowSameParamsToReapplyTwice: true},
    )

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
            error={error !== undefined ? error : props.error}
        
            backCallback={() => {
                props.setScreen({screen: 'file_browser'})
            }}
        />
    )



}

export default CSVImportConfigTaskpane;