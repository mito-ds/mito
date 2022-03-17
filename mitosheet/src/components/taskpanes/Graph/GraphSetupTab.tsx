// Copyright (c) Mito

import React, { Fragment } from 'react';
import { ColumnID, ColumnIDsMap, GraphParams, SheetData, UIState } from '../../../types';
import MitoAPI from '../../../api';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import Select from '../../elements/Select';
import DropdownItem from '../../elements/DropdownItem';
import { GraphType } from './GraphSidebar';
import AxisSection, { GraphAxisType } from './AxisSection';
import Toggle from '../../elements/Toggle';
import { getColorDropdownItems, getDefaultGraphParams, getDefaultSafetyFilter } from './graphUtils';

// Graphing a dataframe with more than this number of rows will
// give the user the option to apply the safety filter
// Note: This must be kept in sync with the graphing heuristic in the mitosheet/graph folder
export const GRAPH_SAFETY_FILTER_CUTOFF = 1000;

// Tooltips used to explain the Safety filter toggle
const SAFETY_FILTER_DISABLED_MESSAGE = `Because you’re graphing less than ${GRAPH_SAFETY_FILTER_CUTOFF} rows of data, you can safely graph your data without applying a filter first.`
const SAFETY_FILTER_ENABLED_MESSAGE = `Turning on Filter to Safe Size only graphs the first ${GRAPH_SAFETY_FILTER_CUTOFF} rows of your dataframe, ensuring that your browser tab won’t crash. Turning off Filter to Safe Size graphs the entire dataframe and may slow or crash your browser tab.`

const GRAPHS_THAT_DONT_SUPPORT_COLOR = [GraphType.DENSITY_HEATMAP]

/* 
    The graph setup tab where the user creates the structure of the graph by 
    selecting data
*/
function GraphSetupTab(
    props: {
        uiState: UIState;
        mitoAPI: MitoAPI;
        sheetDataArray: SheetData[];
        graphParams: GraphParams
        dfNames: string[];
        columnDtypesMap: Record<string, string>;
        columnIDsMapArray: ColumnIDsMap[],
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        setGraphParams: React.Dispatch<React.SetStateAction<GraphParams>>;
        setGraphUpdatedNumber: React.Dispatch<React.SetStateAction<number>>;
    }): JSX.Element {

    const graphSheetIndex = props.graphParams.graphCreation.sheet_index

    // Toggles the safety filter component of the graph params
    const toggleSafetyFilter = (): void => {
        const newSafetyFilter = !props.graphParams.graphPreprocessing.safety_filter_turned_on_by_user

        props.setGraphParams(prevGraphParams => {
            const graphParamsCopy = JSON.parse(JSON.stringify(prevGraphParams)); 
            return {
                ...graphParamsCopy,
                graphPreprocessing: {
                    safety_filter_turned_on_by_user: newSafetyFilter
                }
            }
        })
        props.setGraphUpdatedNumber((old) => old + 1);
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
            axisColumnIDs = props.graphParams.graphCreation.x_axis_column_ids
        } else {
            axisColumnIDs = props.graphParams.graphCreation.y_axis_column_ids
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
            props.setGraphParams(prevGraphParams => {
                const graphParamsCopy = JSON.parse(JSON.stringify(prevGraphParams)); 
                return {
                    ...graphParamsCopy,
                    graphCreation: {
                        ...graphParamsCopy.graphCreation, 
                        x_axis_column_ids: axisColumnIDsCopy
                    }
                }
            })
        } else {
            props.setGraphParams(prevGraphParams => {
                const graphParamsCopy = JSON.parse(JSON.stringify(prevGraphParams)); 
                return {
                    ...graphParamsCopy,
                    graphCreation: {
                        ...graphParamsCopy.graphCreation, 
                        y_axis_column_ids: axisColumnIDsCopy
                    }
                }
            })
        }

        // Then set increment graphUpdateNumber so we send the graph message
        props.setGraphUpdatedNumber((old) => old + 1);
    }

    const setGraphType = (graphType: GraphType) => {
        const xAxisColumnIDsCopy = [...props.graphParams.graphCreation.x_axis_column_ids]
        const yAxisColumnIDsCopy = [...props.graphParams.graphCreation.y_axis_column_ids]

        // Update the graph type
        props.setGraphParams(prevGraphParams => {
            const graphParamsCopy = JSON.parse(JSON.stringify(prevGraphParams)); 
            return {
                ...graphParamsCopy,
                graphCreation: {
                    ...graphParamsCopy.graphCreation,
                    graph_type: graphType,
                    x_axis_column_ids: xAxisColumnIDsCopy,
                    y_axis_column_ids: yAxisColumnIDsCopy
                }
            }
        })
        props.setGraphUpdatedNumber((old) => old + 1);
    }

    const setColor = (newColorColumnID: ColumnID | undefined) => {
        props.setGraphParams(prevGraphParams => {
            const graphParamsCopy = JSON.parse(JSON.stringify(prevGraphParams)); 
            return {
                ...graphParamsCopy,
                graphCreation: {
                    ...graphParamsCopy.graphCreation, 
                    color: newColorColumnID
                }
            }
        })
        props.setGraphUpdatedNumber((old) => old + 1);
    }

    return (  
        <Fragment>
            <div className='graph-sidebar-toolbar-content'>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Data Source
                        </p>
                    </Col>
                    <Col>
                        <Select
                            value={props.dfNames[graphSheetIndex]}
                            onChange={(newDfName: string) => {
                                const newIndex = props.dfNames.indexOf(newDfName);
                                
                                // Reset the graph params for the new sheet, but keep the graph type!
                                const newSheetGraphParams = getDefaultGraphParams(props.sheetDataArray, newIndex, props.graphParams.graphCreation.graph_type)
                                props.setGraphParams(newSheetGraphParams)

                                props.setGraphUpdatedNumber((old) => old + 1);
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
                            value={props.graphParams.graphCreation.graph_type}
                            onChange={(graphType: string) => {
                                setGraphType(graphType as GraphType)
                            }}
                            width='small'
                            dropdownWidth='medium'
                        >
                            <DropdownItem
                                title={GraphType.BAR}
                            />
                            <DropdownItem
                                title={GraphType.LINE}
                            />
                            <DropdownItem
                                title={GraphType.SCATTER}
                            />
                            <DropdownItem
                                title={GraphType.HISTOGRAM}
                            />
                            <DropdownItem
                                title={GraphType.DENSITY_HEATMAP}
                            />
                            <DropdownItem
                                title={GraphType.DENSITY_CONTOUR}
                            />
                            <DropdownItem
                                title={GraphType.BOX}
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
                        </Select>
                    </Col>
                </Row>

                <AxisSection
                    columnIDsMap={props.columnIDsMapArray[graphSheetIndex]}
                    columnDtypesMap={props.columnDtypesMap}

                    graphType={props.graphParams.graphCreation.graph_type}
                    graphAxis={GraphAxisType.X_AXIS}
                    selectedColumnIDs={props.graphParams.graphCreation.x_axis_column_ids}
                    otherAxisSelectedColumnIDs={props.graphParams.graphCreation.y_axis_column_ids}

                    updateAxisData={updateAxisData}
                    mitoAPI={props.mitoAPI}
                />
                <AxisSection
                    columnIDsMap={props.columnIDsMapArray[graphSheetIndex]}
                    columnDtypesMap={props.columnDtypesMap}

                    graphType={props.graphParams.graphCreation.graph_type}
                    graphAxis={GraphAxisType.Y_AXIS}
                    selectedColumnIDs={props.graphParams.graphCreation.y_axis_column_ids}
                    otherAxisSelectedColumnIDs={props.graphParams.graphCreation.x_axis_column_ids}

                    updateAxisData={updateAxisData}
                    mitoAPI={props.mitoAPI}
                />
                <div>
                    <Row 
                        justify='space-between' 
                        align='center' 
                        title={GRAPHS_THAT_DONT_SUPPORT_COLOR.includes(props.graphParams.graphCreation.graph_type) ? 
                            `${props.graphParams.graphCreation.graph_type} does not support further breaking down data using color.` :
                            'Use an additional column to further breakdown the data by color.'}
                        suppressTopBottomMargin
                    >
                        <Col>
                            <div className='text-header-3'>
                                Color Breakdown
                            </div>
                        </Col>
                        <Col>
                            <Select 
                                value={props.graphParams.graphCreation.color ? props.graphParams.graphCreation.color : 'None'}
                                disabled={GRAPHS_THAT_DONT_SUPPORT_COLOR.includes(props.graphParams.graphCreation.graph_type)}
                                width='small'
                                searchable
                            >
                                {getColorDropdownItems(graphSheetIndex, props.columnIDsMapArray, props.columnDtypesMap, setColor)}
                            </Select>
                        </Col>
                    </Row>
                </div>
                
                <Row justify='space-between' align='center' title={getDefaultSafetyFilter(props.sheetDataArray, graphSheetIndex) ? SAFETY_FILTER_ENABLED_MESSAGE : SAFETY_FILTER_DISABLED_MESSAGE}>
                    <Col>
                        <p className='text-header-3' >
                            Filter to safe size
                        </p>
                    </Col>
                    <Col>
                        <Toggle
                            value={props.graphParams.graphPreprocessing.safety_filter_turned_on_by_user}
                            onChange={toggleSafetyFilter}
                            disabled={!getDefaultSafetyFilter(props.sheetDataArray, graphSheetIndex)}
                        />
                    </Col>
                </Row>

            </div>
        </Fragment>
    )
} 

export default GraphSetupTab;
