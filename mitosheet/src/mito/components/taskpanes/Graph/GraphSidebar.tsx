import React, { useEffect, useState } from 'react';
import { MitoAPI } from '../../../api/api';
import { AnalysisData, ColumnID, ColumnIDsMap, GraphDataArray, GraphID, GraphParamsBackend, GraphParamsFrontend, GraphSidebarTab, SheetData, StepType, UIState } from '../../../types';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import { TaskpaneType } from '../taskpanes';
import GraphSidebarTabs from './GraphSidebarTabs';
import { convertBackendtoFrontendGraphParams, convertFrontendtoBackendGraphParams, getDefaultGraphParams } from './graphUtils';

// import css
import '../../../../../css/taskpanes/Graph/GraphSidebar.css';
import '../../../../../css/taskpanes/Graph/LoadingSpinner.css';
import Row from '../../layout/Row';
import Col from '../../layout/Col';
import XIcon from '../../icons/XIcon';
import GraphStyleTab from './GraphStyleTab';
import GraphSetupTab, { GraphType } from './GraphSetupTab';
import GraphExportTab from './GraphExportTab';
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';

/*
    This is the main component that displays all graphing
    functionality, allowing the user to build and view graphs.
*/
const GraphSidebar = (props: {
    sheetDataArray: SheetData[];
    columnIDsMapArray: ColumnIDsMap[],
    dfNames: string[];
    graphID: GraphID;
    graphType?: GraphType;
    mitoAPI: MitoAPI;
    existingParams?: GraphParamsFrontend;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    uiState: UIState;
    graphDataArray: GraphDataArray
    analysisData: AnalysisData
    mitoContainerRef: React.RefObject<HTMLDivElement>,
    graphSidebarTab?: GraphSidebarTab,
    selectedColumnsIds?: ColumnID[]
}): JSX.Element => {
    const {params: graphParams, setParams: setGraphParams } = useLiveUpdatingParams<GraphParamsFrontend, GraphParamsBackend>(
        () => props.existingParams ?? getDefaultGraphParams(props.sheetDataArray, props.uiState.selectedSheetIndex, props.graphID, props.graphType, props.selectedColumnsIds),
        StepType.Graph,
        props.mitoAPI,
        props.analysisData,
        50, // 50 ms debounce delay
        {
            getBackendFromFrontend: convertFrontendtoBackendGraphParams,
            getFrontendFromBackend: convertBackendtoFrontendGraphParams,
        },
        {
            // If we have a destination sheet index, we make sure to not overwrite the pivot
            // that is there by default
            doNotSendDefaultParams: props.existingParams !== undefined,
        }
    )

    /*
        The graphID is the keystone of the graphSidebar. Each graph tab has one graphID that does not switch even if the user changes source data sheets. 
        
        In order to properly open a graph in Mito, there are a few things that need to occur:
            1. We need to update the uiState's `selectedTabType` to "graph" so that the footer selects the correct tab
            2. We need to set the uiState's `currTaskpaneOpen` to "graph" so that we actually display the graph
            3. We need to pass the current taskpane the graphID so that we know which graph to display.
        Everything else is handled by the graphSidebar.  

        To create a graph, we always pass a graphID. That means that if we're creating a new graph, the opener of the taskpane is required
        to create a new graphID. 
    */
    const dataSourceSheetIndex = graphParams?.graphCreation.sheet_index
    const graphData = props.graphDataArray.find(graphData => graphData.graphID === props.graphID)
    const graphOutput = graphData?.graphOutput;
    const graphTabName = graphData?.graphTabName;
    const [selectedGraphSidebarTab, setSelectedGraphSidebarTab] = useState<GraphSidebarTab>(GraphSidebarTab.Setup)

    // If the graphSidebarTab changes to Export then update it. 
    // This occurs if the graph tab action is used.
    useEffect(() => {
        if (props.graphSidebarTab === GraphSidebarTab.Export) {
            setSelectedGraphSidebarTab(props.graphSidebarTab)
        }
    }, [props.graphSidebarTab])

    // We log if plotly is not defined
    useEffect(() => {
        if (!(window as any).Plotly) {
            void props.mitoAPI.log('plotly_define_failed');
        }
    }, [])

    // When we get a new graph ouput, we execute the graph script here. This is a workaround
    // that is required because we need to make sure this code runs, which it does
    // not when it is a script tag inside innerHtml (which react does not execute
    // for safety reasons).
    useEffect(() => {
        try {
            if (graphOutput === undefined) {
                return;
            }
            const executeScript = new Function(graphOutput.graphScript);
            executeScript()
        } catch (e) {
            console.error("Failed to execute graph function", e)
        }

    }, [graphOutput])
    if (props.sheetDataArray.length === 0 || graphParams === undefined || dataSourceSheetIndex === undefined) {
        // Since the UI for the graphing takes up the whole screen, we don't even let the user keep it open
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: { type: TaskpaneType.NONE }
            }
        })
        return <DefaultEmptyTaskpane setUIState={props.setUIState} />
    } else {
        return (
            <div className='graph-sidebar-div'>
                <div 
                    className='graph-sidebar-graph-div' 
                    id='graph-div'
                    // Because we have padding on this div, but we want the graph to appear
                    // to take up the whole screen, we also style it with the background color
                    // NOTE: there's a minor visual bug where this updates quicker than the graph
                    // but we choose to view it as a nice preview rather than something to fix :-)
                    style={{
                        backgroundColor: graphParams?.graphStyling.paper_bgcolor,
                        color: graphParams?.graphStyling.title.title_font_color,
                    }}
                >
                    {graphOutput === undefined &&
                        <p className='graph-sidebar-welcome-text text-align-center-important' >To generate a graph, select an axis.</p>
                    }
                    {graphOutput !== undefined &&
                        <div dangerouslySetInnerHTML={{ __html: graphOutput.graphHTML }} />
                    }
                </div>
                <div className='graph-sidebar-toolbar-container'>
                    <div className='graph-sidebar-toolbar-content-container'>
                        <Row justify='space-between' align='center'>
                            <Col>
                                <p className='text-header-2'>
                                    {selectedGraphSidebarTab === GraphSidebarTab.Setup && 'Setup Graph'}
                                    {selectedGraphSidebarTab === GraphSidebarTab.Style && 'Style Graph'}
                                    {selectedGraphSidebarTab === GraphSidebarTab.Export && 'Export Graph'}
                                </p>
                            </Col>
                            <Col>
                                <XIcon
                                    onClick={() => {
                                        props.setUIState((prevUIState) => {
                                            return {
                                                ...prevUIState,
                                                selectedTabType: 'data',
                                                currOpenTaskpane: { type: TaskpaneType.NONE }
                                            }
                                        })
                                    }}
                                />
                            </Col>
                        </Row>
                        {selectedGraphSidebarTab === GraphSidebarTab.Setup && 
                            <GraphSetupTab 
                                graphParams={graphParams}
                                setGraphParams={setGraphParams}
                                uiState={props.uiState}
                                mitoAPI={props.mitoAPI}
                                sheetDataArray={props.sheetDataArray}
                                dfNames={props.dfNames}
                                columnDtypesMap={props.sheetDataArray[dataSourceSheetIndex]?.columnDtypeMap || {}}
                                columnIDsMapArray={props.columnIDsMapArray}
                                setUIState={props.setUIState}
                            />
                        }
                        {selectedGraphSidebarTab === GraphSidebarTab.Style &&
                            <GraphStyleTab 
                                graphParams={graphParams}
                                setGraphParams={setGraphParams}
                            />
                        }
                        {selectedGraphSidebarTab === GraphSidebarTab.Export && 
                            <GraphExportTab 
                                graphTabName={graphTabName ?? 'Graph'}
                                graphParams={graphParams}
                                mitoAPI={props.mitoAPI}
                                graphOutput={graphOutput}
                                mitoContainerRef={props.mitoContainerRef}
                            />
                        }
                    </div>
                    <GraphSidebarTabs
                        selectedTab={selectedGraphSidebarTab}
                        setSelectedGraphSidebarTab={setSelectedGraphSidebarTab}
                        mitoAPI={props.mitoAPI}
                    />
                </div>
            </div>
            
        )
    }
};

export default GraphSidebar;
