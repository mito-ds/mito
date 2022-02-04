// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import MitoAPI from '../../../api';
import XIcon from '../../icons/XIcon';
import AxisSection, { GraphAxisType } from './AxisSection';
import LoadingSpinner from './LoadingSpinner';
import { TaskpaneType } from '../taskpanes';
import useDelayedAction from '../../../hooks/useDelayedAction';
import Select from '../../elements/Select';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';
import TextButton from '../../elements/TextButton';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { intersection } from '../../../utils/arrays';
import { ColumnIDsMap, ColumnMitoTypeMap, SheetData, UIState } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';

// import css
import '../../../../css/taskpanes/Graph/GraphSidebar.css'
import '../../../../css/taskpanes/Graph/LoadingSpinner.css'
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';

export enum GraphType {
    SCATTER = 'scatter',
    BAR = 'bar',
    HISTOGRAM = 'histogram',
    BOX = 'box',
    SUMMARY_STAT = 'summary_stat'
}

// The response from the backend should include each of these components
export interface GraphObject {
    html: string;
    script: string;
    generation_code: string;
}

export interface GraphParams {
    graphType: GraphType,
    xAxisColumnIDs: string[],
    yAxisColumnIDs: string[]
}

// Millisecond delay between loading graphs, so that
// we don't load to many graphs when the user is clicking around
const LOAD_GRAPH_TIMEOUT = 1000;


const DEFAULT_GRAPH_PARAMS = {
    graphType: GraphType.BAR,
    xAxisColumnIDs: [],
    yAxisColumnIDs: []
}

/*
    A helper function for getting the params for the graph fpr this sheet when
    opening the graphing taskpane, or when switching to a sheet.

    Notably, will filter oout any columns that are no longer in the dataset, 
    which stops the user from having invalid columns selected in their graph
    params.
*/
const getGraphParams = (
    lastGraphParams: Record<number, GraphParams | undefined>, 
    sheetIndex: number,
    sheetDataArray: SheetData[]
): GraphParams => {
    const lastParams = lastGraphParams[sheetIndex];
    if (lastParams !== undefined) {
        // Filter out column headers that no longer exist
        const validColumnIDs = sheetDataArray[sheetIndex] !== undefined ? sheetDataArray[sheetIndex].data.map(c => c.columnID) : [];
        const xAxisColumnIDs = intersection(
            validColumnIDs,
            lastParams.xAxisColumnIDs
        )
        const yAxisColumnIDs = intersection(
            validColumnIDs,
            lastParams.yAxisColumnIDs
        )
        return {
            graphType: lastParams.graphType,
            xAxisColumnIDs: xAxisColumnIDs,
            yAxisColumnIDs: yAxisColumnIDs
        }
    }
    return DEFAULT_GRAPH_PARAMS;
}


/*
    This is the main component that displays all graphing
    functionality, allowing the user to build and view graphs.
*/
const GraphSidebar = (props: {
    sheetDataArray: SheetData[];
    columnIDsMapArray: ColumnIDsMap[],
    dfNames: string[];
    graphSidebarSheet: number;
    columnMitoTypes: ColumnMitoTypeMap;
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    model_id: string;
    lastGraphParams: Record<number, GraphParams | undefined>;
    setLastGraphParams: (sheetIndex: number, graphParams: GraphParams) => void;
}): JSX.Element => {

    const [selectedSheetIndex, _setSelectedSheetIndex] = useState(props.graphSidebarSheet);

    // A wrapper around changing the selected sheet index that makes sure
    // the correct sheet is displayed, and also loads the most recent graph
    // from this sheet if it exists
    const setSelectedSheetIndex = (newSelectedSheetIndex: number): void => {
        const newParams = getGraphParams(props.lastGraphParams, newSelectedSheetIndex, props.sheetDataArray);
        // Note we update the sheet before the graph parameters
        _setSelectedSheetIndex(newSelectedSheetIndex);
        _setGraphParams(newParams)
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                selectedSheetIndex: newSelectedSheetIndex
            }
        });
    }

    // When opening the graphing modal, if there are params for the last graph that was made
    // for this sheet, then take them. Otherwise, just take the default params
    const [graphParams, _setGraphParams] = useState<GraphParams>(
        getGraphParams(props.lastGraphParams, selectedSheetIndex, props.sheetDataArray)
    );

    // When we update the graph params, we also update the lastGraphParams in the 
    // main Mito component, so that we can open the graph to the same state next time
    const setGraphParams = (newGraphParams: GraphParams): void => {
        _setGraphParams(newGraphParams);
        props.setLastGraphParams(selectedSheetIndex, newGraphParams);
    }

    const [graphObj, setGraphObj] = useState<GraphObject | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false)

    const [_copyGraphCode, graphCodeCopied] = useCopyToClipboard(graphObj?.generation_code || '');

    const [changeLoadingGraph] = useDelayedAction(LOAD_GRAPH_TIMEOUT)

    // If the graph has non-default params, then it has been configured
    const [graphHasNeverBeenConfigured, setGraphHasNeverBeenConfigured] = useState<boolean>(
        graphParams === DEFAULT_GRAPH_PARAMS
    )

    // We log when the graph has been opened
    useEffect(() => {
        void props.mitoAPI.sendLogMessage('opened_graph');
    }, []);

    /* 
        Gets fired whenever the user makes a change to their graph. 

        It calls the loadNewGraph function which is on a delay, as to 
        not overload the backend with new graph creation requests.
    */
    useEffect(() => {   
        // If the graph has never been configured, then don't display the loading indicator
        // or try to create the graph
        if (graphHasNeverBeenConfigured) {
            setGraphHasNeverBeenConfigured(false)
            return
        }
        // Start the loading icon as soon as the user makes a change to the graph
        setLoading(true)             
        void loadNewGraph()

        // We also log when the columns are selected, when they change
        void props.mitoAPI.sendLogMessage('graph_selected_column_changed', {
            'generated_graph': graphParams.xAxisColumnIDs.length !== 0 || graphParams.yAxisColumnIDs.length !== 0, // A helpful variable for the value add event
            'graph_type': graphParams.graphType,
            'x_axis_column_ids': graphParams.xAxisColumnIDs,
            'y_axis_column_ids': graphParams.yAxisColumnIDs
        });
    }, [graphParams])

    // When we get a new graph script, we execute it here. This is a workaround
    // that is required because we need to make sure this code runs, which it does
    // not when it is a script tag inside innerHtml (which react does not execute
    // for safety reasons).
    useEffect(() => {
        try {
            if (graphObj === undefined) {
                return;
            }
            const executeScript = new Function(graphObj.script);
            executeScript()
        } catch (e) {
            console.error("Failed to execute graph function", e)
        }
        
    }, [graphObj])

    /* 
        This is the actual function responsible for loading the new
        graph from the backend, making sure this graph is the correct
        size.
    */
    const getGraphAsync = async () => {
        const boundingRect: DOMRect | undefined = document.getElementById('graph-div')?.getBoundingClientRect();

        if (boundingRect !== undefined) {
            const loadedGraphHTMLAndScript = await props.mitoAPI.getGraph(
                graphParams.graphType,
                selectedSheetIndex,
                graphParams.xAxisColumnIDs, 
                graphParams.yAxisColumnIDs,
                `${boundingRect?.height - 10}px`, `${boundingRect?.width - 20}px` // Subtract pixels from the height & width to account for padding
            );

            setGraphObj(loadedGraphHTMLAndScript);
        }

        // Turn off the loading icon once the user get their graph back
        setLoading(false);
    }

    /* 
        Whenever the graph is changed we set a timeout to start loading a new 
        graph. This runs after LOAD_GRAPH_TIMEOUT.

        This makes sure we don't send unnecessary messages to the backend if the user
        is switching axes/graph types quickly.
    */
    const loadNewGraph = async () => {
        changeLoadingGraph(getGraphAsync);
    }

    const removeNonNumberColumnIDs = (columnIDs: string[]) => {
        const filteredColumnIDs = columnIDs.filter(columnID => {
            return props.columnMitoTypes[columnID] === 'number_series'
        })
        return filteredColumnIDs
    }

    const _setGraphType = (graphType: GraphType) => {
        let xAxisColumnIDsCopy = [...graphParams.xAxisColumnIDs]
        let yAxisColumnIDsCopy = [...graphParams.yAxisColumnIDs]
        
        /* 
            If the user switches to a Box plot or Histogram, then we make sure that
            1. all of the selected columns are numbers. 
            2. there are not columns in both the x and y axis. 
        */ 
        if (graphType === GraphType.BOX || graphType === GraphType.HISTOGRAM) {
            xAxisColumnIDsCopy = removeNonNumberColumnIDs(xAxisColumnIDsCopy)
            yAxisColumnIDsCopy = removeNonNumberColumnIDs(yAxisColumnIDsCopy)

            // Make sure that only one axis has selected column headers. 
            if (graphParams.xAxisColumnIDs.length > 0 && graphParams.yAxisColumnIDs.length > 0) {
                yAxisColumnIDsCopy = []
            }
        } 

        // Log that we reset the selected columns
        if (xAxisColumnIDsCopy.length !== graphParams.xAxisColumnIDs.length || yAxisColumnIDsCopy.length !== graphParams.yAxisColumnIDs.length) {
            void props.mitoAPI.sendLogMessage('reset_graph_columns_on_graph_type_change');
        }

        // Log that the user switched graph types
        void props.mitoAPI.sendLogMessage('switched_graph_type', {
            'graph_type': graphType,
            'x_axis_column_ids': xAxisColumnIDsCopy,
            'y_axis_column_ids': yAxisColumnIDsCopy,
        });
        
        // Update the graph type
        setGraphParams({
            ...graphParams,
            graphType: graphType,
            xAxisColumnIDs: xAxisColumnIDsCopy,
            yAxisColumnIDs: yAxisColumnIDsCopy
        })
    }

    /* 
        Function responsible for updating the selected column headers for each axis. 
        Set the columnHeader at the index of the graphAxis selected columns array.

        To remove a column, leave the columnHeader empty.
    */ 
    const updateAxisData = (graphAxis: GraphAxisType, index: number, columnID?: string) => {
        // Get the current axis data
        let axisColumnIDs: string[] = []
        if (graphAxis === GraphAxisType.X_AXIS) {
            axisColumnIDs = graphParams.xAxisColumnIDs
        } else {
            axisColumnIDs = graphParams.yAxisColumnIDs
        }
        
        // Make a copy of the column headers before editing them
        const axisColumnIDsCopy = [...axisColumnIDs]

        if (columnID === undefined) {
            axisColumnIDsCopy.splice(index, 1)
        } else {
            axisColumnIDsCopy[index] = columnID
        }

        // Update the axis data
        if (graphAxis === GraphAxisType.X_AXIS) {
            setGraphParams({
                ...graphParams,
                xAxisColumnIDs: axisColumnIDsCopy
            })
        } else {
            setGraphParams({
                ...graphParams,
                yAxisColumnIDs: axisColumnIDsCopy
            })
        }
    } 

    const copyGraphCode = () => {
        _copyGraphCode()

        // Log that the user copied the graph code
        void props.mitoAPI.sendLogMessage('copy_graph_code', {
            'generated_graph': graphParams.xAxisColumnIDs.length !== 0 || graphParams.yAxisColumnIDs.length !== 0, // A helpful variable for the value add event
            'graph_type': graphParams.graphType,
            'x_axis_column_ids': graphParams.xAxisColumnIDs,
            'y_axis_column_ids': graphParams.yAxisColumnIDs
        });
    }

    if (props.sheetDataArray.length === 0) {
        // Since the UI for the graphing takes up the whole screen, we don't even let the user keep it open
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: {type: TaskpaneType.NONE}
            }
        })

        return (
            <DefaultTaskpane>
                <DefaultTaskpaneHeader
                    header='No Data'
                    setUIState={props.setUIState}
                />
                <DefaultTaskpaneBody>
                    Import data before graphing it. 
                </DefaultTaskpaneBody>
            </DefaultTaskpane>
        )   
    } else {
        return (
            <div className='graph-sidebar-div'>
                <div className='graph-sidebar-graph-div' id='graph-div' >
                    {graphObj === undefined && graphParams.xAxisColumnIDs.length === 0 && graphParams.yAxisColumnIDs.length === 0 &&
                        <p className='graph-sidebar-welcome-text' >To generate a graph, select a axis.</p>
                    }
                    {graphObj !== undefined && 
                        <div dangerouslySetInnerHTML={{__html: graphObj?.html}}/>
                    }
                </div>
                <div className='graph-sidebar-toolbar-div'>
                    <Row justify='space-between' align='center'>
                        <Col>
                            <p className='text-header-2'>
                                Generate Graph
                            </p>
                        </Col>
                        <Col>
                            <XIcon
                                onClick={() => {
                                    props.setUIState((prevUIState) => {
                                        return {
                                            ...prevUIState,
                                            currOpenTaskpane: {type: TaskpaneType.NONE}
                                        }
                                    })
                                    void props.mitoAPI.sendLogMessage('closed_graph')
                                }}
                            />
                        </Col>
                    </Row>
                    <div className='graph-sidebar-toolbar-content'>
                        <Row justify='space-between' align='center'>
                            <Col>
                                <p className='text-header-3'>
                                    Data Source
                                </p>
                            </Col>
                            <Col>  
                                <Select 
                                    value={props.dfNames[selectedSheetIndex]}
                                    onChange={(newDfName: string) => {
                                        const newIndex = props.dfNames.indexOf(newDfName);
                                        setSelectedSheetIndex(newIndex);
                                    }}
                                    width='small'
                                >
                                    {props.dfNames.map(dfName => {
                                        return (
                                            <DropdownItem
                                                key={dfName}
                                                title={dfName}
                                            />
                                        )
                                    })}
                                </Select>
                            </Col>
                        </Row>
                        <Row justify='space-between' align='center'>
                            <Col>
                                <p className='text-header-3'>
                                    Chart Type
                                </p>
                            </Col>
                            <Col>  
                                <Select 
                                    value={graphParams.graphType}
                                    onChange={(graphType: string) => {
                                        _setGraphType(graphType as GraphType)
                                    }}
                                    width='small'
                                    dropdownWidth='medium'
                                >
                                    <DropdownItem
                                        title={GraphType.BAR}
                                    />
                                    <DropdownItem
                                        title={GraphType.BOX}
                                        subtext='Only supports number columns'
                                    />
                                    <DropdownItem
                                        title={GraphType.HISTOGRAM}
                                        subtext='Only supports number columns'
                                    />
                                    <DropdownItem
                                        title={GraphType.SCATTER}
                                    />
                                </Select>
                            </Col>
                        </Row>
                        
                        <AxisSection
                            /* 
                                We use a key here to force the Axis Section to update when the user changes the xAxisColumnHeaders.
                                A key is required because react does not know that the object xAxisColumnHeaders changed in all cases. 
                                Particularly, when the user changes the xAxisColumnHeaders from [A, B, A] to [B, A] by 
                                deleting the first A, React does not recognize that the change has occurred and so the Axis Section does 
                                not update even though the graph updates.

                                We append the indicator xAxis to the front of the list to ensure that both AxisSections have unique keys. 
                                When the Axis Sections don't have unique keys, its possible for the sections to become duplicated as per 
                                the React warnings.
                            */
                            key={['xAxis'].concat(graphParams.xAxisColumnIDs).join('')}
                            columnIDsMap={props.columnIDsMapArray[selectedSheetIndex]}
                            columnMitoTypes={props.columnMitoTypes}

                            graphType={graphParams.graphType}
                            graphAxis={GraphAxisType.X_AXIS}
                            selectedColumnIDs={graphParams.xAxisColumnIDs}
                            otherAxisSelectedColumnIDs={graphParams.yAxisColumnIDs}

                            updateAxisData={updateAxisData}
                            mitoAPI={props.mitoAPI}
                        />
                        <AxisSection
                            // See note about keys for Axis Sections above.
                            key={['yAxis'].concat(graphParams.yAxisColumnIDs).join('')}
                            columnIDsMap={props.columnIDsMapArray[selectedSheetIndex]}
                            columnMitoTypes={props.columnMitoTypes}
                            
                            graphType={graphParams.graphType}
                            graphAxis={GraphAxisType.Y_AXIS}
                            selectedColumnIDs={graphParams.yAxisColumnIDs}
                            otherAxisSelectedColumnIDs={graphParams.xAxisColumnIDs}
                            
                            updateAxisData={updateAxisData}
                            mitoAPI={props.mitoAPI}
                        />
                    </div>
                    <div className='graph-sidebar-toolbar-code-export-button'>
                        <TextButton
                            variant='dark'
                            onClick={copyGraphCode}
                            disabled={loading || graphObj === undefined}
                        >
                            {!graphCodeCopied 
                                ? "Copy Graph Code" 
                                : "Copied!"
                            }                        
                        </TextButton>
                    </div>
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
    }
    
};

export default GraphSidebar;