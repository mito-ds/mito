// Copyright (c) Mito


import React from 'react';

import { GraphParamsBackend, MitoAPI } from '../../..';
import { AnalysisData, ColumnID, RecursivePartial, SheetData, UIState } from '../../../types';
import { Actions } from '../../../utils/actions';
import { updateObjectWithPartialObject } from '../../../utils/objects';
import DropdownItem from '../../elements/DropdownItem';
import Select from '../../elements/Select';
import { convertBackendtoFrontendGraphParams } from '../../taskpanes/Graph/graphUtils';
import { TaskpaneType } from '../../taskpanes/taskpanes';
import { AxesFormatOptions } from './AxesFormatOptions';
import { ChartTitleFormatOptions } from './ChartTitleFormatOptions';
import { FacetFormatOptions } from './FacetFormatOptions';
import { GridlinesFormatOptions } from './GridlinesFormatOptions';
import { LegendFormatOptions } from './LegendFormatOptions';
import { PlotFormatOptions } from './PlotFormatOptions';

export const ChartFormatTabContents = (
    props: {
        actions: Actions;
        uiState: UIState;
        mitoAPI: MitoAPI;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        analysisData: AnalysisData;
        sheetDataArray: SheetData[];
        selectedColumnsIds?: ColumnID[];
        mitoContainerRef: React.RefObject<HTMLDivElement>;
        defaultCurrElement: string;
        setDefaultCurrElement: React.Dispatch<React.SetStateAction<string>>;
    }): JSX.Element => {
    const currOpenTaskpane = props.uiState.currOpenTaskpane;
    if (currOpenTaskpane.type !== TaskpaneType.GRAPH) {
        throw new Error('ChartDesignTabContents should only be used when the graph taskpane is open.');
    }
    const openGraph = currOpenTaskpane.openGraph;
    
    // Get the step params and the step id of the currently open graph by getting the most recent step from this array
    // This is used in conjunction with useLiveUpdatingParams in the GraphSidebar with a special flag to add these edits
    // into the same step as useLiveUpdatingParams is using. This assumes that there is already a step in the stepSummaryList
    // for this graph.
    const stepSummaryList = props.analysisData.stepSummaryList;
    const currGraphStep = stepSummaryList[stepSummaryList.length - 1];
    const params = currGraphStep.params as GraphParamsBackend | undefined;

    // When edits happen, just call the API directly w/ the graph id and the step id
    const updateGraphParam = (update: RecursivePartial<GraphParamsBackend>): void => {
        if (params === undefined) {
            return;
        }
        void props.mitoAPI.editGraph(
            openGraph.graphID,
            convertBackendtoFrontendGraphParams(updateObjectWithPartialObject(params, update)),
            params.graph_rendering.height ?? '100%',
            params.graph_rendering.width ?? '100%',
            currGraphStep.step_id,
            true
        );
    }

    const elementOptions = ['Chart Title', 'Chart Area', 'Legend', 'Gridlines', 'Axes', 'Facet'];
    const [currElement, setCurrElement] = React.useState<typeof elementOptions[number]>(props.defaultCurrElement);

    return (<div className='mito-toolbar-bottom'>
        <Select
            display={props.uiState.currOpenDropdown === 'chart-format'}
            width='small'
            style={{
                alignSelf: 'center'
            }}
            onChangeDisplay={(display) => {
                props.setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: display ? 'chart-format' : undefined
                    }
                })
            }}
            onChange={(value) => {
                setCurrElement(value as typeof elementOptions[number]);
                props.setDefaultCurrElement(value as typeof elementOptions[number]);
            }}
            value={currElement}
        >
            { elementOptions.map((element, index) => 
                (<DropdownItem
                    key={index}
                    onClick={() => {
                        setCurrElement(element);
                    }}
                    title={element}
                />)
            ) }
        </Select>
        <div className='toolbar-vertical-line'/>
        {currElement === 'Chart Title' && <ChartTitleFormatOptions params={params} updateGraphParam={updateGraphParam}/>}
        {currElement === 'Chart Area' && <PlotFormatOptions params={params} updateGraphParam={updateGraphParam}/>}
        {currElement === 'Legend' && <LegendFormatOptions params={params} updateGraphParam={updateGraphParam} />}
        {currElement === 'Gridlines' && <GridlinesFormatOptions params={params} updateGraphParam={updateGraphParam} />}
        {currElement === 'Axes' && <AxesFormatOptions params={params} updateGraphParam={updateGraphParam} />}
        {currElement === 'Facet' && <FacetFormatOptions params={params} updateGraphParam={updateGraphParam} />}        
    </div>);
}

