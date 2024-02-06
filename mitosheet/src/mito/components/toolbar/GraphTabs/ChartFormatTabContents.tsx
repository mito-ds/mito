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

export type ElementOptionsType = 'Chart Title' | 'Chart Area' | 'Legend' | 'Gridlines' | 'Axes' | 'Facet';

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
        defaultCurrElement: ElementOptionsType;
        setDefaultCurrElement: React.Dispatch<React.SetStateAction<ElementOptionsType>>;
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
            params.graph_rendering?.height ?? '100%',
            params.graph_rendering?.width ?? '100%',
            currGraphStep.step_id,
            true
        );
    }

    const elementOptions: ElementOptionsType[] = ['Chart Title', 'Chart Area', 'Legend', 'Gridlines', 'Axes', 'Facet'];
    // Remove elements that are not currently present in the graph
    if (params?.graph_styling?.showlegend === false) {
        elementOptions.splice(elementOptions.indexOf('Legend'), 1);
    }
    if (params?.graph_styling?.title.visible === false) {
        elementOptions.splice(elementOptions.indexOf('Chart Title'), 1);
    }
    if (params?.graph_creation?.facet_col_column_id === undefined && params?.graph_creation?.facet_row_column_id === undefined) {
        elementOptions.splice(elementOptions.indexOf('Facet'), 1);
    }
    const [currElement, setCurrElement] = React.useState<ElementOptionsType>(elementOptions.includes(props.defaultCurrElement) ? props.defaultCurrElement : elementOptions[0]);

    const renderFormatOptions = (): JSX.Element => {
        switch (currElement) {
            case 'Chart Title':
                return <ChartTitleFormatOptions params={params} updateGraphParam={updateGraphParam}/>
            case 'Chart Area':
                return <PlotFormatOptions params={params} updateGraphParam={updateGraphParam}/>
            case 'Legend':
                return <LegendFormatOptions params={params} updateGraphParam={updateGraphParam} />
            case 'Gridlines':
                return <GridlinesFormatOptions params={params} updateGraphParam={updateGraphParam} />
            case 'Axes':
                return <AxesFormatOptions params={params} updateGraphParam={updateGraphParam} />
            case 'Facet':
                return <FacetFormatOptions params={params} updateGraphParam={updateGraphParam} />
        }
    }

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
        {renderFormatOptions()}
    </div>);
}

