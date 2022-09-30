// Copyright (c) Mito

import React, { useEffect } from 'react';

import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import { useStateFromAPIAsync } from '../../../hooks/useStateFromAPIAsync';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, StepType, UIState } from '../../../types';
import XLSXImportScreen, { ExcelImportParams } from '../../import/XLSXImportScreen';
import { ImportScreen } from './NewImportTaskpane';


interface XLSXImportProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[];
    fileName: string;

    setScreen: React.Dispatch<React.SetStateAction<ImportScreen>>;
}

const getDefaultXLSXParams = (fullPath: string): ExcelImportParams => {
    return {
        file_name: fullPath,
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
function XLSXImport(props: XLSXImportProps): JSX.Element {

    // NOTE: this loading state is just for getting the metadata about the sheets
    // and not for importing the file
    const {params, setParams, loading, edit, editApplied} = useSendEditOnClick<ExcelImportParams, ExcelImportParams>(
        undefined,
        StepType.ExcelImport,
        props.mitoAPI, props.analysisData,
        {allowSameParamsToReapplyTwice: true},
    )

    const [filePath] = useStateFromAPIAsync<string | undefined>(
        undefined,
        () => {
            const allPathParts = [...props.currPathParts, props.fileName];
            return props.mitoAPI.getPathJoined(allPathParts);
        }
    )

    useEffect(() => {
        if (filePath !== undefined) {
            setParams(getDefaultXLSXParams(filePath))
        }
    }, [filePath])
    
    return (
        <XLSXImportScreen
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            setUIState={props.setUIState}
            isUpdate={false}

            fileName={props.fileName}
            filePath={filePath}
        
            params={params}
            setParams={setParams}
            edit={edit}
            editApplied={editApplied}
            loading={loading}
        
            backCallback={() => {
                props.setScreen('file_browser')
            }}
        />
    )
}

export default XLSXImport;