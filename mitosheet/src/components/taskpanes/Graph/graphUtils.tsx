// Helper function for creating default graph params. Defaults to a Bar chart, 

import { DataframeID, GraphDataDict, GraphID, GraphParams, SheetData } from "../../../types"
import { intersection } from "../../../utils/arrays"
import { sheetIndexToDataframeID } from "../../../utils/dataframeID"
import { GraphType, GRAPH_SAFETY_FILTER_CUTOFF } from "./GraphSidebar"

// unless a graph type is provided
export const getDefaultGraphParams = (sheetDataMap: Record<DataframeID, SheetData>, dataframeID: DataframeID, graphType?: GraphType): GraphParams => {
    const safetyFilter = getDefaultSafetyFilter(sheetDataMap, dataframeID)

    return {
        graphPreprocessing: {
            safety_filter_turned_on_by_user: safetyFilter
        },
        graphCreation: {
            graph_type: graphType || GraphType.BAR,
            dataframe_id: dataframeID,
            x_axis_column_ids: [],
            y_axis_column_ids: [],
        },
        graphStyling: undefined,
        graphRendering: {}
    }
}

// Helper function for getting the default safety filter status
export const getDefaultSafetyFilter = (sheetDataMap: Record<DataframeID, SheetData>, dataframeID: DataframeID): boolean => {
    return sheetDataMap[dataframeID] === undefined || sheetDataMap[dataframeID].numRows > GRAPH_SAFETY_FILTER_CUTOFF
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
    selectedDataframeID: DataframeID,
    sheetDataMap: Record<DataframeID, SheetData>,
): GraphParams => {

    const graphParams = graphDataDict[graphID]?.graphParams;

    // If the graph already exists, get the data source sheet index from the graph params.
    // Otherwise create a new graph of the selectedDataframeID
    const graphDataSourceDataframeID = graphParams !== undefined ? sheetIndexToDataframeID(graphParams.graphCreation.sheet_index) : selectedDataframeID

    // If the graph already exists, retrieve the graph params that still make sense. In other words, 
    // if a column was previously included in the graph and it no longer exists, remove it from the graph. 
    if (graphParams !== undefined) {
        // Filter out column headers that no longer exist
        const validColumnIDs = sheetDataMap[graphDataSourceDataframeID] !== undefined ? sheetDataMap[graphDataSourceDataframeID].data.map(c => c.columnID) : [];
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
                graph_type: graphParams.graphCreation.graph_type,
                dataframe_id: sheetIndexToDataframeID(graphParams.graphCreation.sheet_index),
                x_axis_column_ids: xAxisColumnIDs,
                y_axis_column_ids: yAxisColumnIDs
            }
        }
    }

    // If the graph does not already exist, create a default graph.
    return getDefaultGraphParams(sheetDataMap, graphDataSourceDataframeID);
}
