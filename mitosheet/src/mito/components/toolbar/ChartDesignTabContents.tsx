// Copyright (c) Mito


import React from 'react';

import { GraphParamsBackend, MitoAPI } from '../..';
import { AnalysisData, ColumnID, RecursivePartial, SheetData, UIState } from '../../types';
import { Actions } from '../../utils/actions';
import { updateObjectWithPartialObject } from '../../utils/objects';
import { convertBackendtoFrontendGraphParams } from '../taskpanes/Graph/graphUtils';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { AddChartElementButton } from './AddChartElementButton';
import { ChangeChartTypeButton } from './ChangeChartTypeButton';


export const ChartDesignTabContents = (
    props: {
        actions: Actions;
        uiState: UIState;
        mitoAPI: MitoAPI;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        analysisData: AnalysisData;
        sheetDataArray: SheetData[];
        selectedColumnsIds?: ColumnID[];
        mitoContainerRef: React.RefObject<HTMLDivElement>;
    }): JSX.Element => {
    const currOpenTaskpane = props.uiState.currOpenTaskpane;
    if (currOpenTaskpane.type !== TaskpaneType.GRAPH) {
        throw new Error('ChartDesignTabContents should only be used when the graph taskpane is open.');
    }
    const openGraph = currOpenTaskpane.openGraph;
    
    // Get the step params and the step id of the currently open graph by getting the most recent step from this array
    const stepSummaryList = props.analysisData.stepSummaryList;
    const currGraphStep = stepSummaryList[stepSummaryList.length - 1];
    const params = currGraphStep.params as GraphParamsBackend | undefined;

    // When edits happen, just call the API directly w/ the graph id and the step id
    const updateGraphParam = (update: RecursivePartial<GraphParamsBackend>): void => {
        if (params === undefined) {
            return;
        }
        props.mitoAPI.editGraph(
            openGraph.graphID,
            convertBackendtoFrontendGraphParams(updateObjectWithPartialObject(params, update)),
            '100%',
            '100%',
            currGraphStep.step_id,
            true
        );
    }


    return (<div className='mito-toolbar-bottom'>
        <AddChartElementButton 
            {...props}
            params={params}
            updateGraphParam={updateGraphParam}
        />
        <ChangeChartTypeButton
            {...props}
            params={params}
            updateGraphParam={updateGraphParam}
        />
        
    </div>);
}

