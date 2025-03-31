/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import { MitoAPI } from '../../../api/api';
import { AnalysisData, StepType, UIState, UserProfile } from '../../../types';
import { DEFAULT_DECIMAL } from '../../import/CSVImportConfigScreen';
import XLSXImportConfigScreen, { ExcelImportParams } from '../../import/XLSXImportConfigScreen';
import { ImportState } from './FileImportTaskpane';


interface XLSXImportConfigTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    fileName: string;
    filePath: string;

    setImportState: React.Dispatch<React.SetStateAction<ImportState>>;
}

export const getDefaultXLSXParams = (filePath: string): ExcelImportParams => {
    return {
        file_name: filePath,
        sheet_names: [],
        has_headers: true,
        decimal: DEFAULT_DECIMAL,
        skiprows: 0,
    }
}


/* 
    Allows a user to import an XLSX file with the given name, and
    in turn allows them to configure how to import sheets in this
    file.
*/
function XLSXImportConfigTaskpane(props: XLSXImportConfigTaskpaneProps): JSX.Element {

    const {params, setParams, loading, edit, editApplied} = useSendEditOnClick<ExcelImportParams, ExcelImportParams>(
        () => {return getDefaultXLSXParams(props.filePath)},
        StepType.ExcelImport,
        props.mitoAPI, props.analysisData,
        {allowSameParamsToReapplyTwice: true},
    )

    return (
        <XLSXImportConfigScreen
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            userProfile={props.userProfile}
            setUIState={props.setUIState}
            isUpdate={false}

            fileName={props.fileName}
            filePath={props.filePath}
        
            params={params}
            setParams={setParams}
            edit={edit}
            editApplied={editApplied}
            loading={loading}
        
            backCallback={() => {
                props.setImportState({screen: 'file_browser'})
            }}
        />
    )
}

export default XLSXImportConfigTaskpane;