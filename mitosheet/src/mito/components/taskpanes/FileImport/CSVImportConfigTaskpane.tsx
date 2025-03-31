/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import { MitoAPI } from '../../../api/api';
import { AnalysisData, StepType, UIState } from '../../../types';
import CSVImportConfigScreen, { CSVImportParams, DEFAULT_DELIMITER, DEFAULT_ENCODING, DEFAULT_ERROR_BAD_LINES } from '../../import/CSVImportConfigScreen';
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
        delimeters: [DEFAULT_DELIMITER],
        encodings: [DEFAULT_ENCODING],
        error_bad_lines: [DEFAULT_ERROR_BAD_LINES]
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
        <CSVImportConfigScreen
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