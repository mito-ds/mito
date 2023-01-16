#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.empty_code_chunk import EmptyCodeChunk

from mitosheet.state import State
from mitosheet.step_performers.graph_steps.graph_utils import GRAPH_TITLE_LABELS, get_column_header_from_optional_column_id_graph_param, get_html_and_script_from_figure, get_new_graph_tab_name
from mitosheet.step_performers.graph_steps.plotly_express_graphs import (
    get_plotly_express_graph,
    get_plotly_express_graph_code,
)
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import GraphID


class GraphStepPerformer(StepPerformer):
    """
    Creates a graph of the passed parameters and update the graph_data_dict

    {
        graph_id: GraphID
        graph_preprocessing: {
            safety_filter_turned_on_by_user: boolean
        },
        graph_creation: {
            graph_type: GraphType,
            sheet_index: int
            x_axis_column_ids: ColumnID[],
            y_axis_column_ids: ColumnID[],
            color: columnID: columnID | None,
            facet_column: columnID | None,
            facet_row: columnID | None,
        },
        graph_styling: {
            title: {
                title: string | None
                visible: boolean
            },
            xaxis: {
                title: string | None,
                visible: boolean,
                type: string | None,
                rangeslider: {
                    visible: boolean
                }
            },
            yaxis: {
                title: string | None,
                visible: boolean,
                type: string | None
            },
            showlegend: boolean
        },
        graph_rendering: {
            height: int representing the div width
            width: int representing the div width
        }
    }
    """

    @classmethod
    def step_version(cls) -> int:
        return 4

    @classmethod
    def step_type(cls) -> str:
        return "graph"

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        """
        Returns the new post state with the updated graph_data_dict
        """

        graph_id: GraphID = get_param(params, 'graph_id')
        graph_preprocessing: Dict[str, Any] = get_param(params, 'graph_preprocessing')
        graph_creation: Dict[str, Any] = get_param(params, 'graph_creation')
        graph_styling: Dict[str, Any] = get_param(params, 'graph_styling')
        graph_rendering: Dict[str, Any] = get_param(params, 'graph_rendering')
        include_plotlyjs: bool = get_param(params, 'include_plotlyjs')

        # We make a new state to modify it
        post_state = prev_state.copy()

        # Extract variables from graph parameters
        graph_type = graph_creation["graph_type"]
        sheet_index = graph_creation["sheet_index"]
        safety_filter_turned_on_by_user = graph_preprocessing["safety_filter_turned_on_by_user"]
        height = graph_rendering["height"] 
        width = graph_rendering["width"]

        # Get the x axis params, if they were provided
        x_axis_column_ids = graph_creation["x_axis_column_ids"] if graph_creation["x_axis_column_ids"] is not None else []
        x_axis_column_headers = prev_state.column_ids.get_column_headers_by_ids(sheet_index, x_axis_column_ids)

        # Get the y axis params, if they were provided
        y_axis_column_ids = graph_creation["y_axis_column_ids"] if graph_creation["y_axis_column_ids"] is not None else []
        y_axis_column_headers = prev_state.column_ids.get_column_headers_by_ids(sheet_index, y_axis_column_ids)

        # Validate optional parameters that are available for all graph types
        color_column_header = get_column_header_from_optional_column_id_graph_param(prev_state, graph_creation, 'color')
        facet_col_column_header = get_column_header_from_optional_column_id_graph_param(prev_state, graph_creation, 'facet_col_column_id')
        facet_row_column_header = get_column_header_from_optional_column_id_graph_param(prev_state, graph_creation, 'facet_row_column_id')
        
        facet_col_wrap = graph_creation.get('facet_col_wrap', None)
        facet_col_spacing = graph_creation.get('facet_col_spacing', None)
        facet_row_spacing = graph_creation.get('facet_row_spacing', None)

        # Validate parameters that are only available for some graph types
        # Note: We trust the parameters from the frontend, so we don't make sure the params fit the graph type here
        points = graph_creation.get('points', None)
        line_shape = graph_creation.get('line_shape', None)
        histnorm = graph_creation.get('histnorm', None)
        histfunc = graph_creation.get('histfunc', None)
        nbins = graph_creation.get('nbins', None)

        # Create a copy of the dataframe, just for safety.
        df: pd.DataFrame = prev_state.dfs[sheet_index].copy()
        df_name: str = prev_state.df_names[sheet_index]

        # If the graph tab already exists, use its name. Otherwise, create a new graph tab name.
        graph_tab_name: str = post_state.graph_data_dict[graph_id]["graphTabName"] \
            if graph_id in post_state.graph_data_dict.keys() \
            else get_new_graph_tab_name(post_state.graph_data_dict)

        if len(x_axis_column_ids) == 0 and len(y_axis_column_ids) == 0:
            # If no data is passed to the graph, then we don't create a graph and omit the graphOutput
            post_state.graph_data_dict[graph_id] = {
                "graphParams": {
                    "graphPreprocessing": graph_preprocessing,
                    "graphCreation": graph_creation,
                    "graphStyling": graph_styling,
                    "graphRendering": graph_rendering,
                },
                "graphTabName": graph_tab_name
            }
            pandas_processing_time = 0.0 # no processing time
        else: 
            pandas_start_time = perf_counter()
            fig = get_plotly_express_graph(
                graph_type,
                df,
                safety_filter_turned_on_by_user,
                x_axis_column_headers,
                y_axis_column_headers,
                color_column_header,
                facet_col_column_header,
                facet_row_column_header,
                facet_col_wrap,
                facet_col_spacing,
                facet_row_spacing,
                points,
                line_shape,
                histnorm,
                histfunc,
                nbins,
                graph_styling
            )
            pandas_processing_time = perf_counter() - pandas_start_time

            # Get rid of some of the default white space
            fig.update_layout(
                margin=dict(
                    l=0,
                    r=0,
                    t=30,
                    b=35, # This gives enough space so that the x axis label is not cutoff
                )
            )

            html_and_script = get_html_and_script_from_figure(fig, height, width, include_plotlyjs)

            graph_generation_code = get_plotly_express_graph_code(
                graph_type,
                df,
                safety_filter_turned_on_by_user,
                x_axis_column_headers,
                y_axis_column_headers,
                color_column_header,
                facet_col_column_header,
                facet_row_column_header,
                facet_col_wrap,
                facet_col_spacing,
                facet_row_spacing,
                points,
                line_shape,
                histnorm,
                histfunc,
                nbins,
                graph_styling,
                df_name,
            )

            post_state.graph_data_dict[graph_id] = {
                "graphParams": {
                    "graphPreprocessing": graph_preprocessing,
                    "graphCreation": graph_creation,
                    "graphStyling": graph_styling,
                    "graphRendering": graph_rendering,
                },
                "graphOutput": {
                    "graphGeneratedCode": graph_generation_code,
                    "graphHTML": html_and_script["html"],
                    "graphScript": html_and_script["script"],
                },
                "graphTabName": graph_tab_name
            }

        return post_state, {
            'pandas_processing_time': pandas_processing_time # No time spent on pandas, only metadata changes
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        # Graph steps don't add any generated code to the analysis script. 
        return [
            EmptyCodeChunk(
                prev_state, 
                post_state, 
                'Edited graph',
                'Edited a graph',
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
