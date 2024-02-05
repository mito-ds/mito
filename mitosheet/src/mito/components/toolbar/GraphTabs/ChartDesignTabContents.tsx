// Copyright (c) Mito


import React from 'react';

import { GraphParamsBackend, MitoAPI } from '../../..';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { ActionEnum, AnalysisData, ColumnID, RecursivePartial, SheetData, UIState } from '../../../types';
import { Actions } from '../../../utils/actions';
import { updateObjectWithPartialObject } from '../../../utils/objects';
import Dropdown from '../../elements/Dropdown';
import DropdownItem from '../../elements/DropdownItem';
import { convertBackendtoFrontendGraphParams } from '../../taskpanes/Graph/graphUtils';
import { TaskpaneType } from '../../taskpanes/taskpanes';
import ToolbarButton from '../ToolbarButton';
import { AddChartElementButton } from './AddChartElementButton';
import { ChangeChartTypeButton } from './ChangeChartTypeButton';
import { GraphTypeConfigurations } from './GraphTypeConfigurations';

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

    const graphDataArray = props.analysisData.graphDataArray;
    const graphData = graphDataArray.find((graphData) => graphData.graph_id === openGraph.graphID);

    // We append the correct export code for showing and for exporting to html
    const [_copyShowGraphCode] = useCopyToClipboard(
        (graphData?.graph_output?.graphGeneratedCode || '') + `\nfig.show(renderer="iframe")`
    );
    const [_copyExportHTMLGraphCode] = useCopyToClipboard(
        (graphData?.graph_output?.graphGeneratedCode || '') + `\nfig.write_html("${graphData?.graph_tab_name}.html")`
    );

    const copyShowGraphCode = () => {
        _copyShowGraphCode()

        // Log that the user copied the graph code
        void props.mitoAPI.log('copy_graph_code', {
            'graph_type': params?.graph_creation?.graph_type
        });
    }
    const copyExportHTMLGraphCode = () => {
        _copyExportHTMLGraphCode()

        // Log that the user copied the graph code
        void props.mitoAPI.log('copy_export_html_graph_code', {
            'graph_type': params?.graph_creation?.graph_type
        });
    }

    return (<div className='mito-toolbar-bottom'>
        <AddChartElementButton 
            {...props}
            params={params}
            updateGraphParam={updateGraphParam}
            graphOutput={graphData?.graph_output}
        />
        <ChangeChartTypeButton
            {...props}
            params={params}
            updateGraphParam={updateGraphParam}
        />
        
        {params === undefined ? <p> Loading... </p> : <GraphTypeConfigurations
            {...props}
            graphParams={params}
            updateGraphParam={updateGraphParam}
        />}

        {/* Note: commenting this out because it will be more useful when the graph editor is
         * moved into the EndoGrid. It currently messes with the state of the graph editor, so
         * it'll need a bit of work to get it to work properly.
         */}
        {/* <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.Graph_SelectData]}/> */}

        <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.ExportGraphDropdown]}>
            <Dropdown
                display={props.uiState.currOpenDropdown === 'export-graph'}
                closeDropdown={() => props.setUIState({ ...props.uiState, currOpenDropdown: undefined })}
            >
                <DropdownItem
                    title="Copy code that displays graph"
                    onClick={copyShowGraphCode}
                />
                <DropdownItem
                    title="Copy code to create graph HTML file"
                    onClick={copyExportHTMLGraphCode}
                />
                <DropdownItem
                    title="Download as PNG"
                    onClick={() => {
                        // Find the Plotly Download plot as png button, and then click it. 
                        const downloadLink: HTMLLinkElement | undefined | null = props.mitoContainerRef.current?.querySelector<HTMLLinkElement>('[data-title="Download plot as a png"]')
                        downloadLink?.click()

                        // Log that the user exported the graph as a png
                        void props.mitoAPI.log('export_graph_as_png', {
                            'graph_type': params?.graph_creation?.graph_type
                        });
                    }}
                />
            </Dropdown>
        </ToolbarButton>
    </div>);
}

