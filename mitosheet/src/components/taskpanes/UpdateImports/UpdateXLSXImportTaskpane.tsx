// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState } from '../../../types';
import XLSXImportScreen from '../../import/XLSXImportScreen';
import { getDefaultXLSXParams } from '../FileImport/XLSXImportTaskpane';
import { ReplacingDataframeState, StepImportData } from './UpdateImportsTaskpane';
import { isExcelImportParams, updateStepImportDataList } from './updateImportsUtils';

interface UpdateXLSXImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    fileName: string;
    filePath: string;

    replacingDataframeState: ReplacingDataframeState;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>;
    setUpdatedIndexes: React.Dispatch<React.SetStateAction<number[]>>;
    setInvalidImportMessages: React.Dispatch<React.SetStateAction<Record<number, string | undefined>>>;
}


function UpdateXLSXImportsTaskpane(props: UpdateXLSXImportTaskpaneProps): JSX.Element {

    const params = isExcelImportParams(props.replacingDataframeState.params)
        ? props.replacingDataframeState.params
        : getDefaultXLSXParams(props.filePath)

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
                        params: updater(params)
                    }
                })
            }}
            edit={() => {
                const dataframeCreationIndex = props.replacingDataframeState.dataframeCreationIndex;

                // When we do the edit, we change the set this import
                // When we import the CSV, we update the screen
                props.setUpdatedStepImportData((prevUpdatedStepImportData) => {
                    if (prevUpdatedStepImportData === undefined) {
                        return undefined;
                    }
                    return updateStepImportDataList(
                        prevUpdatedStepImportData, 
                        dataframeCreationIndex, 
                        {
                            'step_type': 'excel_import',
                            'params': params
                        }
                    )
                })

                // Mark this as updated
                props.setUpdatedIndexes((prevUpdatedIndexes) => {
                    if (prevUpdatedIndexes.includes(dataframeCreationIndex)) {
                        return prevUpdatedIndexes;
                    }
                    const newUpdatedIndexes = [...prevUpdatedIndexes];
                    newUpdatedIndexes.push(dataframeCreationIndex);
                    return newUpdatedIndexes;
                })

                // Remove the invalid import message if it exists
                props.setInvalidImportMessages(prevInvalidImportMessage => {
                    const newInvalidImportMessage = {...prevInvalidImportMessage};
                    if (newInvalidImportMessage[dataframeCreationIndex] !== undefined) {
                        delete newInvalidImportMessage[dataframeCreationIndex]
                    }
                    return newInvalidImportMessage;
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