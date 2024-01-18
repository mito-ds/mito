// Copyright (c) Mito


import React from 'react';

import { GraphParamsBackend, MitoAPI } from '../../..';
import { ActionEnum, AnalysisData, ColumnID, RecursivePartial, SheetData, UIState } from '../../../types';
import { Actions } from '../../../utils/actions';
import { updateObjectWithPartialObject } from '../../../utils/objects';
import { convertBackendtoFrontendGraphParams } from '../../taskpanes/Graph/graphUtils';
import { TaskpaneType } from '../../taskpanes/taskpanes';
import { AddChartElementButton } from './AddChartElementButton';
import { ChangeChartTypeButton } from './ChangeChartTypeButton';
import { GraphTypeConfigurations } from './GraphTypeConfigurations';
import ToolbarButton from '../ToolbarButton';
import Dropdown from '../../elements/Dropdown';
import DropdownItem from '../../elements/DropdownItem';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import SelectDataIcon from '../../icons/GraphToolbar/SelectDataIcon';

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
        />
        <ChangeChartTypeButton
            {...props}
            params={params}
            updateGraphParam={updateGraphParam}
        />
        
        {params !== undefined && <GraphTypeConfigurations
            {...props}
            graphParams={params}
            updateGraphParam={updateGraphParam}
        />}

        <div className='mito-toolbar-button-container-enabled vertical-align-content'>
            <button className='mito-toolbar-button'>
                <div className='mito-toolbar-button-icon-container'>
                    <SelectDataIcon />
                </div>
                <p className='mito-toolbar-button-label'> Select Data </p>
            </button>
        </div>

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

