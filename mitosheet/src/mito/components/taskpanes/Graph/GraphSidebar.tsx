import React, { useEffect } from 'react';
import '../../../../../css/taskpanes/Graph/GraphSidebar.css';
import '../../../../../css/taskpanes/Graph/LoadingSpinner.css';
import { MitoAPI } from '../../../api/api';
import { useEffectOnResizeElement } from '../../../hooks/useEffectOnElementResize';
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import { AnalysisData, ColumnID, GraphDataArray, GraphID, GraphParamsBackend, GraphParamsFrontend, GraphSidebarTab, SheetData, StepType, UIState } from '../../../types';
import XIcon from '../../icons/XIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import { TaskpaneType } from '../taskpanes';
import GraphExportTab from './GraphExportTab';
import GraphSetupTab, { GraphType } from './GraphSetupTab';
import GraphSidebarTabs from './GraphSidebarTabs';
import GraphStyleTab from './GraphStyleTab';
import LoadingSpinner from './LoadingSpinner';
import { convertBackendtoFrontendGraphParams, convertFrontendtoBackendGraphParams, getDefaultGraphParams, getGraphRenderingParams, getParamsForExistingGraph } from './graphUtils';

export type OpenGraphType = {
    type: 'existing_graph'
    graphID: GraphID,
    existingParams: GraphParamsFrontend
} | {
    type: 'new_graph'
    graphID: GraphID,
    graphType: GraphType
    selectedColumnIds?: ColumnID[]
} | {
    type: 'new_graph_duplicated_from_existing',
    graphID: GraphID,
    graphIDOfDuplicated: GraphID,
    existingParamsOfDuplicated: GraphParamsFrontend
}


/*
    This is the main component that displays all graphing
    functionality, allowing the user to build and view graphs.
*/
const GraphSidebar = (props: {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    uiState: UIState;
    sheetDataArray: SheetData[];
    mitoAPI: MitoAPI;
    graphDataArray: GraphDataArray
    mitoContainerRef: React.RefObject<HTMLDivElement>,
    graphSidebarTab: GraphSidebarTab,
    analysisData: AnalysisData,
    openGraph: OpenGraphType
}): JSX.Element => {
    
    const {params: graphParams, setParams: setGraphParams, startNewStep, loading } = useLiveUpdatingParams<GraphParamsFrontend, GraphParamsBackend>(
        () => getDefaultGraphParams(props.mitoContainerRef, props.sheetDataArray, props.uiState.selectedSheetIndex, props.openGraph),
        StepType.Graph,
        props.mitoAPI,
        props.analysisData,
        1000, // Relatively long debounce delay, so we don't send too many graphing messages
        {
            getBackendFromFrontend: convertFrontendtoBackendGraphParams,
            getFrontendFromBackend: convertBackendtoFrontendGraphParams,
        },
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
    const graphData = props.graphDataArray.find(graphData => graphData.graph_id === props.openGraph.graphID)
    const graphOutput = graphData?.graph_output;
    const graphTabName = graphData?.graph_tab_name;

    /*
         If the openGraph changes, which happens when opening a graph:
         1. reset the stepID so we don't overwrite the previous edits.
         2. refresh the graphParams so the UI is up to date with the new graphID's configuration.
     */
    useEffect(() => {
        console.log("STARTING NEW STEP", props.openGraph);
        startNewStep();
        const newParams = getDefaultGraphParams(props.mitoContainerRef, props.sheetDataArray, props.uiState.selectedSheetIndex, props.openGraph);
        setGraphParams(newParams);
    }, [props.openGraph])

    // We log if plotly is not defined
    useEffect(() => {
        if (!(window as any).Plotly) {
            void props.mitoAPI.log('plotly_define_failed');
        }
    }, [])

    // Handle graph resizing
    useEffectOnResizeElement(() => {
        setGraphParams(prevGraphParams => {
            return {
                ...prevGraphParams,
                graphRendering: getGraphRenderingParams(props.mitoContainerRef)
            }
        })
    }, [], props.mitoContainerRef, '#mito-center-content-container')

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

    console.log("NEW SELECTED GRAPH", props.openGraph.graphID)

    // If the number of graphs decreases, we make sure we're still on a graph that exists
    // By switching either:
    // 1. to a data sheet, if there are no graphs left
    // 2. to the next graph, if we were on a graph that was deleted
    // 3. to the last graph

    const previousNumberOfGraphsRef = React.useRef<number>(props.graphDataArray.length);
    const previouslySelectedGraphIndexRef = React.useRef<number>(props.graphDataArray.findIndex(graphData => graphData.graph_id === props.openGraph.graphID));
    useEffect(() => {
        const handleDeletedGraphs = async () => {
            console.log("HANDLING", props.graphDataArray.length, previousNumberOfGraphsRef)
            if (props.graphDataArray.length < previousNumberOfGraphsRef.current) {
                if (props.graphDataArray.length === 0) {
                    console.log("SWITCHING TO DATA")
                    return props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            selectedTabType: 'data',
                            selectedSheetIndex: 0,
                            currOpenTaskpane: { type: TaskpaneType.NONE }
                        }
                    })
                }

                const newGraphIndex = Math.min(previouslySelectedGraphIndexRef.current, props.graphDataArray.length - 1);
                const newGraphID = props.graphDataArray[newGraphIndex].graph_id;
                const existingParams = await getParamsForExistingGraph(props.mitoAPI, newGraphID);
                console.log("FOUND EXISING PARAMS", existingParams)
                if (existingParams === undefined) {
                    return;
                }
                return props.setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        selectedTabType: 'graph',
                        currOpenTaskpane: {
                            type: TaskpaneType.GRAPH,
                            graphSidebarTab: props.graphSidebarTab,
                            openGraph: {
                                type: 'existing_graph',
                                graphID: newGraphID,
                                existingParams: existingParams
                            }
                        }
                    }
                })
            }
            
            previousNumberOfGraphsRef.current = props.graphDataArray.length;
            previouslySelectedGraphIndexRef.current = props.graphDataArray.findIndex(graphData => graphData.graph_id === props.openGraph.graphID);
        }

        void handleDeletedGraphs()
    }, [props.graphDataArray.length])


    // Since the UI for the graphing takes up the whole screen, we don't even let the user keep it open
    // If there is no data to graph
    if (props.sheetDataArray.length === 0 || graphParams === undefined || dataSourceSheetIndex === undefined) {
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: { type: TaskpaneType.NONE }
            }
        })
        return <DefaultEmptyTaskpane setUIState={props.setUIState} />
    } 

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
                                {props.graphSidebarTab === GraphSidebarTab.Setup && 'Setup Graph'}
                                {props.graphSidebarTab === GraphSidebarTab.Style && 'Style Graph'}
                                {props.graphSidebarTab === GraphSidebarTab.Export && 'Export Graph'}
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
                    {props.graphSidebarTab === GraphSidebarTab.Setup && 
                        <GraphSetupTab 
                            graphParams={graphParams}
                            setGraphParams={setGraphParams}
                            uiState={props.uiState}
                            mitoAPI={props.mitoAPI}
                            graphID={props.openGraph.graphID}
                            sheetDataArray={props.sheetDataArray}
                            columnDtypesMap={props.sheetDataArray[dataSourceSheetIndex]?.columnDtypeMap || {}}
                            setUIState={props.setUIState}
                            mitoContainerRef={props.mitoContainerRef}
                            openGraph={props.openGraph}
                        />
                    }
                    {props.graphSidebarTab === GraphSidebarTab.Style &&
                        <GraphStyleTab 
                            graphParams={graphParams}
                            setGraphParams={setGraphParams}
                        />
                    }
                    {props.graphSidebarTab === GraphSidebarTab.Export && 
                        <GraphExportTab 
                            graphTabName={graphTabName ?? 'Graph'}
                            graphParams={graphParams}
                            mitoAPI={props.mitoAPI}
                            graphOutput={graphOutput}
                            mitoContainerRef={props.mitoContainerRef}
                            loading={loading}
                        />
                    }
                </div>
                <GraphSidebarTabs
                    selectedTab={props.graphSidebarTab}
                    setSelectedGraphSidebarTab={(tab: GraphSidebarTab) => {
                        props.setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                currOpenTaskpane: {
                                    ...prevUIState.currOpenTaskpane,
                                    graphSidebarTab: tab
                                }
                            }
                        })
                    }}
                    mitoAPI={props.mitoAPI}
                />
            </div>
            {loading &&
                    <div className='popup-div'>
                        <LoadingSpinner />
                        <p className='popup-text-div'>
                            loading
                        </p>
                    </div>
                }
        </div>
        
    )
};

export default GraphSidebar;
