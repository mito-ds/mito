import React, { useEffect, useState } from 'react';
import MitoAPI from '../../../api';
import XIcon from '../../icons/XIcon';
import AxisSection, { GraphAxisType } from './AxisSection';
import LoadingSpinner from './LoadingSpinner';
import { TaskpaneType } from '../taskpanes';
import Select from '../../elements/Select';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';
import TextButton from '../../elements/TextButton';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { intersection } from '../../../utils/arrays';
import { ColumnID, ColumnIDsMap, GraphDataJSON, GraphParams, SheetData, UIState } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';

// import css
import '../../../../css/taskpanes/Graph/GraphSidebar.css'
import '../../../../css/taskpanes/Graph/LoadingSpinner.css'
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import Toggle from '../../elements/Toggle';
import usePrevious from '../../../hooks/usePrevious';
import { useDebouncedEffect } from '../../../hooks/useDebouncedEffect';

export enum GraphType {
    SCATTER = 'scatter',
    LINE = 'line',
    BAR = 'bar',
    HISTOGRAM = 'histogram',
    BOX = 'box',
    VIOLIN = 'violin',
    STRIP = 'strip',
    ECDF = 'ecdf',
    DENSITY_HEATMAP = 'density heatmap',
    DENSITY_CONTOUR = 'density contour',
}


// Millisecond delay between loading graphs, so that
// we don't load to many graphs when the user is clicking around
const LOAD_GRAPH_TIMEOUT = 1000;

// Graphing a dataframe with more than this number of rows will
// give the user the option to apply the safety filter
// Note: This must be kept in sync with the graphing heuristic in the mitosheet/graph folder
const GRAPH_SAFETY_FILTER_CUTOFF = 1000;

// Tooltips used to explain the Safety filter toggle
const SAFETY_FILTER_DISABLED_MESSAGE = `Because you’re graphing less than ${GRAPH_SAFETY_FILTER_CUTOFF} rows of data, you can safely graph your data without applying a filter first.`
const SAFETY_FILTER_ENABLED_MESSAGE = `Turning on Filter to Safe Size only graphs the first ${GRAPH_SAFETY_FILTER_CUTOFF} rows of your dataframe, ensuring that your browser tab won’t crash. Turning off Filter to Safe Size graphs the entire dataframe and may slow or crash your browser tab.`

// Helper function for creating default graph params 
const getDefaultGraphParams = (sheetDataArray: SheetData[], sheetIndex: number): GraphParams => {
    const safetyFilter = getDefaultSafetyFilter(sheetDataArray, sheetIndex)
    return {
        graphPreprocessing: {
            safety_filter_turned_on_by_user: safetyFilter
        },
        graphCreation: {
            graph_type: GraphType.BAR,
            sheet_index: sheetIndex,
            x_axis_column_ids: [],
            y_axis_column_ids: [],
        },
        graphStyling: undefined,
        graphRendering: {}
    }
}

// Helper function for getting the default safety filter status
const getDefaultSafetyFilter = (sheetDataArray: SheetData[], sheetIndex: number): boolean => {
    return sheetDataArray[sheetIndex] === undefined || sheetDataArray[sheetIndex].numRows > GRAPH_SAFETY_FILTER_CUTOFF
}

/*
    A helper function for getting the params for the graph fpr this sheet when
    opening the graphing taskpane, or when switching to a sheet.

    Notably, will filter oout any columns that are no longer in the dataset, 
    which stops the user from having invalid columns selected in their graph
    params.
*/
const getGraphParams = (   
    graphDataJSON: GraphDataJSON,
    sheetIndex: number,
    sheetDataArray: SheetData[],
): GraphParams => {
    const graphParams = graphDataJSON[sheetIndex.toString()]?.graphParams;
    if (graphParams !== undefined) {
        // Filter out column headers that no longer exist
        const validColumnIDs = sheetDataArray[sheetIndex] !== undefined ? sheetDataArray[sheetIndex].data.map(c => c.columnID) : [];
        const xAxisColumnIDs = intersection(
            validColumnIDs,
            graphParams.graphCreation.x_axis_column_ids
        )
        const yAxisColumnIDs = intersection(
            validColumnIDs,
            graphParams.graphCreation.y_axis_column_ids
        )
        
        return {
            ...graphParams,
            graphCreation: {
                ...graphParams.graphCreation,
                x_axis_column_ids: xAxisColumnIDs,
                y_axis_column_ids: yAxisColumnIDs
            }
        }
    }
    return getDefaultGraphParams(sheetDataArray, sheetIndex);
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
    columnDtypesMap: Record<string, string>;
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    graphDataJSON: GraphDataJSON
    lastStepIndex: number
}): JSX.Element => {

    // We keep track of the graph data separately from the backend state so that 
    // the UI updates imidietly, even though the backend takes a while to process.
    const [graphParams, setGraphParams] = useState(() => getGraphParams(props.graphDataJSON, props.graphSidebarSheet, props.sheetDataArray))

    /* 
        When graphUpdatedNumber is, we send a new getGraphMessage with the current graphParams
        in order to update the graphDataJSON. We only increment graphUpdatedNumber when the user updates the params.

        We use this method instead of using a useEffect on the graphParams because the graphParams update when we don't want
        to sendGraphMessage, ie: during an Undo. 

        We use this method of graphUpdatedNumber to simulate a callback to updating the graphParams because we can't pass a callback to 
        the setGraphParams (since its created via a useState instead of this.setState on a class component). Usually, we would use a useEffect on 
        graphParams to act as the callback, but for the reasons described above, that is not the approach we take here. 
    */
    const [graphUpdatedNumber, setGraphUpdatedNumber] = useState(0)

    const dataSourceSheetIndex = graphParams.graphCreation.sheet_index
    const graphOutput = props.graphDataJSON[dataSourceSheetIndex]?.graphOutput
    const [_copyGraphCode, graphCodeCopied] = useCopyToClipboard(graphOutput?.graphGeneratedCode);
    const [stepID, setStepID] = useState<string|undefined>(undefined);

    const [loading, setLoading] = useState<boolean>(false)

    // Save the last step index, so that we can check if an undo occured
    const prevLastStepIndex = usePrevious(props.lastStepIndex);

    // When the last step index changes, check if an undo occured so we can refresh the params
    useEffect(() => {
        // If there has been an undo, then we refresh the params to this pivot
        if (prevLastStepIndex && prevLastStepIndex !== props.lastStepIndex - 1) {
            void refreshParamsAfterUndo()
        }
    }, [props.lastStepIndex])

    // We log when the graph has been opened
    useEffect(() => {
        void props.mitoAPI.log('opened_graph');
    }, []);

    // Async load in the data from the mitoAPI
    useDebouncedEffect(() => {
        // If we haven't updated the graph yet, then don't send a new graph message so that 
        // we don't send a graph message on the initial opening of the graph sidebar.
        if (graphUpdatedNumber > 0) {
            setLoading(true)
            void getGraphAsync()
        }
        
    }, [graphUpdatedNumber], LOAD_GRAPH_TIMEOUT)


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

    /* 
        This is the actual function responsible for loading the new
        graph from the backend, making sure this graph is the correct
        size.
    */
    const getGraphAsync = async () => {
        const boundingRect: DOMRect | undefined = document.getElementById('graph-div')?.getBoundingClientRect();

        if (boundingRect !== undefined) {
            const _stepID = await props.mitoAPI.editGraph(
                graphParams.graphCreation.graph_type,
                graphParams.graphCreation.sheet_index,
                graphParams.graphPreprocessing.safety_filter_turned_on_by_user,
                graphParams.graphCreation.x_axis_column_ids,
                graphParams.graphCreation.y_axis_column_ids,
                `${boundingRect?.height - 10}px`, 
                `${boundingRect?.width - 20}px`, // Subtract pixels from the height & width to account for padding
                stepID
            );
            setStepID(_stepID)
        }

        // Turn off the loading icon once the user get their graph back
        setLoading(false);
    }

    /*
        Updates the graph params on undo so that the graph configuration is in sync
        with the graph shown
    */
    const refreshParamsAfterUndo = async (): Promise<void> => {        
        const newGraphParams = getGraphParams(props.graphDataJSON, dataSourceSheetIndex, props.sheetDataArray)
        setGraphParams(newGraphParams)
    } 

    // Toggles the safety filter component of the graph params
    const toggleSafetyFilter = (): void => {
        const newSafetyFilter = !graphParams.graphPreprocessing.safety_filter_turned_on_by_user

        setGraphParams(prevGraphParams => {
            const copyPrevGraphParams = {...prevGraphParams}
            return {
                ...copyPrevGraphParams,
                graphPreprocessing: {
                    safety_filter_turned_on_by_user: newSafetyFilter
                }
            }
        })
        setGraphUpdatedNumber((old) => old + 1);
    }

    const setGraphType = (graphType: GraphType) => {
        let xAxisColumnIDsCopy = [...graphParams.graphCreation.x_axis_column_ids]
        let yAxisColumnIDsCopy = [...graphParams.graphCreation.y_axis_column_ids]

        // Update the graph type
        setGraphParams(prevGraphParams => {
            const copyPrevGraphParams = {...prevGraphParams}
            return {
                ...copyPrevGraphParams,
                graphCreation: {
                    ...copyPrevGraphParams.graphCreation,
                    graph_type: graphType,
                    x_axis_column_ids: xAxisColumnIDsCopy,
                    y_axis_column_ids: yAxisColumnIDsCopy
                }
            }
        })
        setGraphUpdatedNumber((old) => old + 1);
    }

    /* 
        Function responsible for updating the selected column headers for each axis. 
        Set the columnHeader at the index of the graphAxis selected columns array.
    
        To remove a column, leave the columnHeader empty.
    */
    const updateAxisData = (graphAxis: GraphAxisType, index: number, columnID?: ColumnID) => {
        // Get the current axis data
        let axisColumnIDs: ColumnID[] = []
        if (graphAxis === GraphAxisType.X_AXIS) {
            axisColumnIDs = graphParams.graphCreation.x_axis_column_ids
        } else {
            axisColumnIDs = graphParams.graphCreation.y_axis_column_ids
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
            setGraphParams(prevGraphParams => {
                const copyPrevGraphParams = {...prevGraphParams}
                return {
                    ...copyPrevGraphParams,
                    graphCreation: {
                        ...copyPrevGraphParams.graphCreation, 
                        x_axis_column_ids: axisColumnIDsCopy
                    }
                }
            })
        } else {
            setGraphParams(prevGraphParams => {
                const copyPrevGraphParams = {...prevGraphParams}
                return {
                    ...copyPrevGraphParams,
                    graphCreation: {
                        ...copyPrevGraphParams.graphCreation, 
                        y_axis_column_ids: axisColumnIDsCopy
                    }
                }
            })
        }

        // Then set increment graphUpdateNumber so we send the graph message
        setGraphUpdatedNumber((old) => old + 1);
    }

    const copyGraphCode = () => {
        _copyGraphCode()

        // Log that the user copied the graph code
        void props.mitoAPI.log('copy_graph_code', {
            'graph_type': graphParams.graphCreation.graph_type
        });
    }

    if (props.sheetDataArray.length === 0) {
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
                <div className='graph-sidebar-graph-div' id='graph-div' >
                    {graphOutput === undefined &&
                        <p className='graph-sidebar-welcome-text' >To generate a graph, select a axis.</p>
                    }
                    {graphOutput !== undefined &&
                        <div dangerouslySetInnerHTML={{ __html: graphOutput.graphHTML }} />
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
                                            currOpenTaskpane: { type: TaskpaneType.NONE }
                                        }
                                    })
                                    void props.mitoAPI.log('closed_graph')
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
                                    value={props.dfNames[graphParams.graphCreation.sheet_index]}
                                    onChange={(newDfName: string) => {
                                        const newIndex = props.dfNames.indexOf(newDfName);
                                        // Get the new sheet's graph params 
                                        const newSheetGraphParams = getGraphParams(props.graphDataJSON, newIndex, props.sheetDataArray)

                                        // When we change sheets that we're graphing, we no longer want to overwrite the previous graph, 
                                        // instead we want to create a new graph. Therefore, we change the stepID to create the new graph
                                        // in a new graph step!
                                        setStepID(undefined)
                                        setGraphParams(newSheetGraphParams)
                                        setGraphUpdatedNumber((old) => old + 1);
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
                                    value={graphParams.graphCreation.graph_type}
                                    onChange={(graphType: string) => {
                                        setGraphType(graphType as GraphType)
                                    }}
                                    width='small'
                                    dropdownWidth='medium'
                                >
                                    <DropdownItem
                                        title={GraphType.BOX}
                                    />
                                    <DropdownItem
                                        title={GraphType.HISTOGRAM}
                                    />
                                    <DropdownItem
                                        title={GraphType.SCATTER}
                                    />
                                    <DropdownItem
                                        title={GraphType.LINE}
                                    />
                                    <DropdownItem
                                        title={GraphType.VIOLIN}
                                    />
                                    <DropdownItem
                                        title={GraphType.STRIP}
                                    />
                                    <DropdownItem
                                        title={GraphType.ECDF}
                                    />
                                    <DropdownItem
                                        title={GraphType.DENSITY_HEATMAP}
                                    />
                                    <DropdownItem
                                        title={GraphType.DENSITY_CONTOUR}
                                    />
                                </Select>
                            </Col>
                        </Row>

                        <AxisSection
                            /* 
                                We use a key here to force the Axis Section to update when the user changes the x_axis_column_ids.
                                A key is required because react does not know that the object x_axis_column_ids changed in all cases. 
                                Particularly, when the user changes the x_axis_column_ids from [A, B, A] to [B, A] by 
                                deleting the first A, React does not recognize that the change has occurred and so the Axis Section does 
                                not update even though the graph updates.
    
                                We append the indicator xAxis to the front of the list to ensure that both AxisSections have unique keys. 
                                When the Axis Sections don't have unique keys, its possible for the sections to become duplicated as per 
                                the React warnings.
                            */
                            key={['xAxis'].concat(graphParams.graphCreation.x_axis_column_ids).join('')}
                            columnIDsMap={props.columnIDsMapArray[graphParams.graphCreation.sheet_index]}
                            columnDtypesMap={props.columnDtypesMap}

                            graphType={graphParams.graphCreation.graph_type}
                            graphAxis={GraphAxisType.X_AXIS}
                            selectedColumnIDs={graphParams.graphCreation.x_axis_column_ids}
                            otherAxisSelectedColumnIDs={graphParams.graphCreation.y_axis_column_ids}

                            updateAxisData={updateAxisData}
                            mitoAPI={props.mitoAPI}
                        />
                        <AxisSection
                            // See note about keys for Axis Sections above.
                            key={['yAxis'].concat(graphParams.graphCreation.y_axis_column_ids).join('')}
                            columnIDsMap={props.columnIDsMapArray[graphParams.graphCreation.sheet_index]}
                            columnDtypesMap={props.columnDtypesMap}

                            graphType={graphParams.graphCreation.graph_type}
                            graphAxis={GraphAxisType.Y_AXIS}
                            selectedColumnIDs={graphParams.graphCreation.y_axis_column_ids}
                            otherAxisSelectedColumnIDs={graphParams.graphCreation.x_axis_column_ids}

                            updateAxisData={updateAxisData}
                            mitoAPI={props.mitoAPI}
                        />
                        <Row justify='space-between' align='center' title={getDefaultSafetyFilter(props.sheetDataArray, graphParams.graphCreation.sheet_index) ? SAFETY_FILTER_ENABLED_MESSAGE : SAFETY_FILTER_DISABLED_MESSAGE}>
                            <Col>
                                <p className='text-header-3' >
                                    Filter to safe size
                                </p>
                            </Col>
                            <Col>
                                <Toggle
                                    value={graphParams.graphPreprocessing.safety_filter_turned_on_by_user}
                                    onChange={toggleSafetyFilter}
                                    disabled={!getDefaultSafetyFilter(props.sheetDataArray, graphParams.graphCreation.sheet_index)}
                                />
                            </Col>
                        </Row>

                    </div>

                    <div className='graph-sidebar-toolbar-code-export-button'>
                        <TextButton
                            variant='dark'
                            onClick={copyGraphCode}
                            disabled={loading || graphOutput === undefined}
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
