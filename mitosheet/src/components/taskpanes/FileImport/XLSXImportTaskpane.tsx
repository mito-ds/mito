// Copyright (c) Mito

import React, { useEffect } from 'react';

import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, StepType, UIState } from '../../../types';
import XLSXImportScreen, { ExcelImportParams } from '../../import/XLSXImportScreen';
import { ImportState } from './FileImportTaskpane';


interface XLSXImportProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
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
        skiprows: 0,
    }
}


/* 
    Allows a user to import an XLSX file with the given name, and
    in turn allows them to configure how to import sheets in this
    file.
*/
function XLSXImportTaskpane(props: XLSXImportProps): JSX.Element {


    // NOTE: this loading state is just for getting the metadata about the sheets
    // and not for importing the file
    const {params, setParams, loading, edit, editApplied} = useSendEditOnClick<ExcelImportParams, ExcelImportParams>(
        () => {return getDefaultXLSXParams(props.filePath)},
        StepType.ExcelImport,
        props.mitoAPI, props.analysisData,
        {allowSameParamsToReapplyTwice: true},
    )

    // This is necessary as the filePath loads later than the fileName, as we need to go get it
    // from the backend
    useEffect(() => {
        setParams(getDefaultXLSXParams(props.filePath))
    }, [props.filePath])

    return (
        <XLSXImportScreen
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
        
            backCallback={() => {
                props.setImportState({screen: 'file_browser'})
            }}
        />
    )
}

export default XLSXImportTaskpane;