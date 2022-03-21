// Helper function for creating default graph params. Defaults to a Bar chart, 

import React from "react"
import { ColumnID, ColumnIDsMap, GraphDataDict, GraphID, GraphParams, SheetData } from "../../../types"
import { intersection } from "../../../utils/arrays"
import { getDisplayColumnHeader } from "../../../utils/columnHeaders"
import { isDatetimeDtype } from "../../../utils/dtypes"
import DropdownItem from "../../elements/DropdownItem"
import { GRAPH_SAFETY_FILTER_CUTOFF } from "./GraphSetupTab"
import { GraphType } from "./GraphSidebar"

// unless a graph type is provided
export const getDefaultGraphParams = (sheetDataArray: SheetData[], sheetIndex: number, graphType?: GraphType): GraphParams => {
    const safetyFilter = getDefaultSafetyFilter(sheetDataArray, sheetIndex)
    return {
        graphPreprocessing: {
            safety_filter_turned_on_by_user: safetyFilter
        },
        graphCreation: {
            graph_type: graphType || GraphType.BAR,
            sheet_index: sheetIndex,
            x_axis_column_ids: [],
            y_axis_column_ids: [],
            color: undefined
        },
        graphStyling: {
            title: {
                title: undefined,
                visible: true
            },
            xaxis: {
                title: undefined,
                visible: true,
                rangeslider: {
                    visible: true,
                }
            },
            yaxis: {
                title: undefined,
                visible: true
            },
            showlegend: true
        }
    }
}

// Helper function for getting the default safety filter status
export const getDefaultSafetyFilter = (sheetDataArray: SheetData[], sheetIndex: number): boolean => {
    return sheetDataArray[sheetIndex] === undefined || sheetDataArray[sheetIndex].numRows > GRAPH_SAFETY_FILTER_CUTOFF
}

/*
    A helper function for getting the params for the graph fpr this sheet when
    opening the graphing taskpane, or when switching to a sheet.

    Notably, will filter oout any columns that are no longer in the dataset, 
    which stops the user from having invalid columns selected in their graph
    params.
*/
export const getGraphParams = (   
    graphDataDict: GraphDataDict,
    graphID: GraphID,
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
): GraphParams => {

    const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(graphDataDict[graphID]?.graphParams)); 

    // If the graph already exists, get the data source sheet index from the graph params.
    // Otherwise create a new graph of the selectedSheetIndex
    const graphDataSourceSheetIndex = graphParamsCopy !== undefined ? graphParamsCopy.graphCreation.sheet_index : selectedSheetIndex

    // If the graph already exists, retrieve the graph params that still make sense. In other words, 
    // if a column was previously included in the graph and it no longer exists, remove it from the graph. 
    if (graphParamsCopy !== undefined) {
        // Filter out column headers that no longer exist
        const validColumnIDs = sheetDataArray[graphDataSourceSheetIndex] !== undefined ? sheetDataArray[graphDataSourceSheetIndex].data.map(c => c.columnID) : [];
        const xAxisColumnIDs = intersection(
            validColumnIDs,
            graphParamsCopy.graphCreation.x_axis_column_ids
        )
        const yAxisColumnIDs = intersection(
            validColumnIDs,
            graphParamsCopy.graphCreation.y_axis_column_ids
        )
        const color = graphParamsCopy.graphCreation.color !== undefined && validColumnIDs.includes(graphParamsCopy.graphCreation.color) ? graphParamsCopy.graphCreation.color : undefined

        
        return {
            ...graphParamsCopy,
            graphCreation: {
                ...graphParamsCopy.graphCreation,
                x_axis_column_ids: xAxisColumnIDs,
                y_axis_column_ids: yAxisColumnIDs,
                color: color
            }
        }
    }

    // If the graph does not already exist, create a default graph.
    return getDefaultGraphParams(sheetDataArray, graphDataSourceSheetIndex);
}

// Returns a list of dropdown items. Selecting them sets the color attribute of the graph.
// Option 'None' always comes first.
export const getColorDropdownItems = (
    graphSheetIndex: number,
    columnIDsMapArray: ColumnIDsMap[],
    columnDtypesMap: Record<string, string>,
    setColor: (columnID: ColumnID | undefined) => void,
): JSX.Element[] => {
    const NoneOption = [(
        <DropdownItem
            key='None'
            title='None'
            onClick={() => setColor(undefined)}
        />
    )]
    
    const columnDropdownItems = Object.keys(columnIDsMapArray[graphSheetIndex]).map(columnID => {
        const columnHeader = columnIDsMapArray[graphSheetIndex][columnID];

        // Plotly doesn't support setting the color as a date series, so we disable date series dropdown items
        const disabled = isDatetimeDtype(columnDtypesMap[columnID])
        return (
            <DropdownItem
                key={columnID}
                title={getDisplayColumnHeader(columnHeader)}
                onClick={() => setColor(columnID)}
                disabled={disabled}
                subtext={disabled ? 'Dates cannot be used as the color breakdown property' : ''}
                hideSubtext
                displaySubtextOnHover
            />
        )
    })

    return NoneOption.concat(columnDropdownItems)
}