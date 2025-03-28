/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React, { Fragment } from 'react';
import { MitoAPI } from '../../../api/api';
import { ColumnID, GraphID, GraphParamsFrontend, OpenGraphType, RecursivePartial, SheetData, UIState } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { updateObjectWithPartialObject } from '../../../utils/objects';
import DataframeSelect from '../../elements/DataframeSelect';
import DropdownItem from '../../elements/DropdownItem';
import LabelAndTooltip from '../../elements/LabelAndTooltip';
import Select from '../../elements/Select';
import Toggle from '../../elements/Toggle';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import AxisSection, { GraphAxisType } from './AxisSection';
import { getColorDropdownItems, getDefaultGraphParams, getDefaultSafetyFilter } from './graphUtils';

export enum GraphType {
    BAR = 'bar',
    LINE = 'line',
    SCATTER = 'scatter',
    HISTOGRAM = 'histogram',
    DENSITY_HEATMAP = 'density heatmap',
    DENSITY_CONTOUR = 'density contour',
    BOX = 'box',
    VIOLIN = 'violin',
    STRIP = 'strip',
    ECDF = 'ecdf',
}

// Graphing a dataframe with more than this number of rows will
// give the user the option to apply the safety filter
// Note: This must be kept in sync with the graphing heuristic in the mitosheet/graph folder
export const GRAPH_SAFETY_FILTER_CUTOFF = 1000;

// Tooltips used to explain the Safety filter toggle
const SAFETY_FILTER_DISABLED_MESSAGE = `Because you’re graphing less than ${GRAPH_SAFETY_FILTER_CUTOFF} rows of data, you can safely graph your data without applying a filter first.`
const SAFETY_FILTER_ENABLED_MESSAGE = `Turning on Limit ${GRAPH_SAFETY_FILTER_CUTOFF} rows only graphs the first ${GRAPH_SAFETY_FILTER_CUTOFF} rows of your dataframe, ensuring that your browser tab won’t crash. Turning it off graphs the entire dataframe and may slow or crash your browser tab.`

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
        graphParams: GraphParamsFrontend
        columnDtypesMap: Record<string, string>;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        graphID: GraphID;
        setGraphParams: React.Dispatch<React.SetStateAction<GraphParamsFrontend>>;
        mitoContainerRef: React.RefObject<HTMLDivElement>;
        openGraph: OpenGraphType,
    }): JSX.Element {

    const graphSheetIndex = props.graphParams.graphCreation.sheet_index;
    const graphPreprocessingParams = props.graphParams.graphPreprocessing;


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
                const graphParamsCopy = window.structuredClone(prevGraphParams) 
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
                const graphParamsCopy = window.structuredClone(prevGraphParams) 
                return {
                    ...graphParamsCopy,
                    graphCreation: {
                        ...graphParamsCopy.graphCreation, 
                        y_axis_column_ids: axisColumnIDsCopy
                    }
                }
            })
        }
    }

    const setColor = (newColorColumnID: ColumnID | undefined) => {
        props.setGraphParams(prevGraphParams => {
            const graphParamsCopy = window.structuredClone(prevGraphParams) 
            return {
                ...graphParamsCopy,
                graphCreation: {
                    ...graphParamsCopy.graphCreation, 
                    color: newColorColumnID
                }
            }
        })
    }

    function updateGraphParam(update: RecursivePartial<GraphParamsFrontend>): void {
        props.setGraphParams(prevGraphParams => {
            return updateObjectWithPartialObject(prevGraphParams, update);
        })
    }

    const colorByColumnTooltip = GRAPHS_THAT_DONT_SUPPORT_COLOR.includes(props.graphParams.graphCreation.graph_type)
        ? `${props.graphParams.graphCreation.graph_type} does not support further breaking down data using color.`
        : 'Use an additional column to further breakdown the data by color.';

    const columnIDsMap = props.sheetDataArray[graphSheetIndex]?.columnIDsMap || {};

    return (  
        <Fragment>
            <div className='graph-sidebar-toolbar-content'>
                <DataframeSelect
                    title='Select the data sheet to graph.'
                    sheetDataArray={props.sheetDataArray}
                    sheetIndex={graphSheetIndex}
                    onChange={(newSheetIndex) => {
                        // Reset the graph params for the new sheet, but keep the graph type!
                        const newSheetGraphParams = getDefaultGraphParams(
                            props.mitoContainerRef, 
                            props.sheetDataArray, 
                            newSheetIndex, 
                            {
                                type: 'existing_graph',
                                graphID: props.graphID,
                                existingParams: {
                                    ...props.graphParams,
                                    graphCreation: {
                                        ...props.graphParams.graphCreation,
                                        sheet_index: newSheetIndex,
                                    }
                                }
                            }
                        )

                        props.setGraphParams(newSheetGraphParams)
                    }}
                />
                <AxisSection
                    columnIDsMap={columnIDsMap}
                    graphType={props.graphParams.graphCreation.graph_type}
                    graphAxis={GraphAxisType.X_AXIS}
                    selectedColumnIDs={props.graphParams.graphCreation.x_axis_column_ids}
                    otherAxisSelectedColumnIDs={props.graphParams.graphCreation.y_axis_column_ids}
                    updateAxisData={updateAxisData}
                    mitoAPI={props.mitoAPI}
                />
                <AxisSection
                    columnIDsMap={columnIDsMap}
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
                        title={colorByColumnTooltip}
                        suppressTopBottomMargin
                    >
                        <Col>
                            <LabelAndTooltip tooltip={colorByColumnTooltip}>
                                Color By Column
                            </LabelAndTooltip>
                        </Col>
                        <Col>
                            <Select 
                                value={props.graphParams.graphCreation.color ? getDisplayColumnHeader(columnIDsMap[props.graphParams.graphCreation.color]) : 'None'}
                                disabled={GRAPHS_THAT_DONT_SUPPORT_COLOR.includes(props.graphParams.graphCreation.graph_type)}
                                width='small'
                                searchable
                            >
                                {getColorDropdownItems(columnIDsMap, props.columnDtypesMap, setColor)}
                            </Select>
                        </Col>
                    </Row>
                </div>
                <Row 
                    justify='space-between' 
                    align='center'
                    title={getDefaultSafetyFilter(props.sheetDataArray, graphSheetIndex) ? SAFETY_FILTER_ENABLED_MESSAGE : SAFETY_FILTER_DISABLED_MESSAGE}>
                    <Col>
                        <LabelAndTooltip tooltip={getDefaultSafetyFilter(props.sheetDataArray, graphSheetIndex) ? SAFETY_FILTER_ENABLED_MESSAGE : SAFETY_FILTER_DISABLED_MESSAGE}>
                            {`Limit ${GRAPH_SAFETY_FILTER_CUTOFF} rows`}
                        </LabelAndTooltip>
                    </Col>
                    <Col>
                        <Toggle
                            value={props.graphParams.graphPreprocessing.safety_filter_turned_on_by_user}
                            onChange={() => {
                                updateGraphParam({graphPreprocessing: {safety_filter_turned_on_by_user: !graphPreprocessingParams.safety_filter_turned_on_by_user}})
                            }}
                            disabled={!getDefaultSafetyFilter(props.sheetDataArray, graphSheetIndex)}
                        />
                    </Col>
                </Row>
                <div>
                    <Row 
                        justify='space-between' 
                        align='center' 
                        title={"Create subplots based on this attribute"}
                    >
                        <Col>
                            <LabelAndTooltip tooltip="Create subplots based on this attribute" textBody>
                                    Facet Column
                            </LabelAndTooltip>
                        </Col>
                        <Col>
                            <Select 
                                value={props.graphParams.graphCreation.facet_col_column_id ? getDisplayColumnHeader(columnIDsMap[props.graphParams.graphCreation.facet_col_column_id]) : 'None'}
                                width='small'
                                searchable
                            >
                                {[<DropdownItem
                                    key='None'
                                    title='None'
                                    onClick={() => {
                                        updateGraphParam({graphCreation: {facet_col_column_id: undefined}})
                                    }}
                                />].concat(
                                    (Object.keys(columnIDsMap) || []).map(columnID => {
                                        const columnHeader = columnIDsMap[columnID];
                                        return (
                                            <DropdownItem
                                                key={columnID}
                                                title={getDisplayColumnHeader(columnHeader)}
                                                onClick={() => {
                                                    updateGraphParam({graphCreation: {facet_col_column_id: columnID}})
                                                }}
                                            />
                                        )
                                    })
                                )}
                            </Select>
                        </Col>
                    </Row>
                </div>
                <div>
                    <Row 
                        justify='space-between' 
                        align='center' 
                        title={"Create subplots based on this attribute"}
                    >
                        <Col>
                            <LabelAndTooltip tooltip="Create subplots based on this attribute" textBody>
                                    Facet row
                            </LabelAndTooltip>
                        </Col>
                        <Col>
                            <Select 
                                value={props.graphParams.graphCreation.facet_row_column_id ? getDisplayColumnHeader(columnIDsMap[props.graphParams.graphCreation.facet_row_column_id]) : 'None'}
                                width='small'
                                searchable
                            >
                                {[<DropdownItem
                                    key='None'
                                    title='None'
                                    onClick={() => {
                                        updateGraphParam({graphCreation: {facet_row_column_id: undefined}})
                                    }}
                                />].concat(
                                    (Object.keys(columnIDsMap) || []).map(columnID => {
                                        const columnHeader = columnIDsMap[columnID];
                                        return (
                                            <DropdownItem
                                                key={columnID}
                                                title={getDisplayColumnHeader(columnHeader)}
                                                onClick={() => {
                                                    updateGraphParam({graphCreation: {facet_row_column_id: columnID}})
                                                }}
                                            />
                                        )
                                    })
                                )}
                            </Select>
                        </Col>
                    </Row>
                </div>
            </div>
        </Fragment>
    )
} 

export default GraphSetupTab;
