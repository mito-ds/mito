#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List

def upgrade_graph_1_to_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Adds the default styling params 

    OLD: 
        'step_version': 1,
        'step_type': 'graph',
        'params: {
            graph_id: GraphID
            graph_preprocessing: {
                safety_filter_turned_on_by_user: boolean
            },
            graph_creation: {
                graph_type: GraphType,
                sheet_index: int
                x_axis_column_ids: ColumnID[],
                y_axis_column_ids: ColumnID[],
                color: columnID: columnID
            },
            graph_styling: {},
            graph_rendering: {
                height: int representing the div width
                width: int representing the div width
            }
        }
    }

    NEW: 
        'step_version': 2,
        'step_type': 'graph',
        'params: {
            graph_id: GraphID
            graph_preprocessing: {
                safety_filter_turned_on_by_user: boolean
            },
            graph_creation: {
                graph_type: GraphType,
                sheet_index: int
                x_axis_column_ids: ColumnID[],
                y_axis_column_ids: ColumnID[],
                color: columnID: columnID
            },
            graph_styling: {
                title: {
                    title: string | None
                    visible: boolean
                },
                xaxis: {
                    title: string | None,
                    visible: boolean,
                    rangeslider: {
                        visible: boolean
                    }
                },
                yaxis: {
                    title: string | None,
                    visible: boolean
                },
                showlegend: boolean
            },
            graph_rendering: {
                height: int representing the div width
                width: int representing the div width
            }
        }
    }
    """
    params = step['params']
    params['graph_styling'] = {
        'title': {
            # Note: we don't add the title because its set to None and therefore doesn't appear as a param in the step
            'visible': True
        },
        'xaxis': {
            # Note: we don't add the title because its set to None and therefore doesn't appear as a param in the step
            'visible': True,
            'rangeslider': {
                'visible': True
            }
        },
        'yaxis': {
            # Note: we don't add the title because its set to None and therefore doesn't appear as a param in the step
            'visible': True
        },
        'showlegend': True
    }

    return [{
        "step_version": 2, 
        "step_type": "graph", 
        "params": params
    }] + later_steps


def upgrade_graph_2_to_3(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Adds the default styling params 

    OLD: 
        'step_version': 2,
        'step_type': 'graph',
        'params: {
            graph_id: GraphID
            graph_preprocessing: {
                safety_filter_turned_on_by_user: boolean
            },
            graph_creation: {
                graph_type: GraphType,
                sheet_index: int
                x_axis_column_ids: ColumnID[],
                y_axis_column_ids: ColumnID[],
                color: columnID: columnID
            },
            graph_styling: {
                title: {
                    title: string | None
                    visible: boolean
                },
                xaxis: {
                    title: string | None,
                    visible: boolean,
                    rangeslider: {
                        visible: boolean
                    }
                },
                yaxis: {
                    title: string | None,
                    visible: boolean
                },
                showlegend: boolean
            },
            graph_rendering: {
                height: int representing the div width
                width: int representing the div width
            }
        }
    }

    NEW: 
        'step_version': 3,
        'step_type': 'graph',
        'params: {
            graph_id: GraphID
            graph_preprocessing: {
                safety_filter_turned_on_by_user: boolean
            },
            graph_creation: {
                graph_type: GraphType,
                sheet_index: int
                x_axis_column_ids: ColumnID[],
                y_axis_column_ids: ColumnID[],
                color: columnID: columnID
            },
            graph_styling: {
                title: {
                    title: string | None
                    visible: boolean
                },
                xaxis: {
                    title: string | None,
                    visible: boolean,
                    rangeslider: {
                        visible: boolean
                    }
                },
                yaxis: {
                    title: string | None,
                    visible: boolean
                },
                showlegend: boolean,
                paper_bgcolor: string
            },
            graph_rendering: {
                height: int representing the div width
                width: int representing the div width
            }
        }
    }
    """
    params = step['params']
    print(params)
    params['graph_styling']['paper_bgcolor'] = '#FFFFFF'
    print(params)

    return [{
        "step_version": 3, 
        "step_type": "graph", 
        "params": params
    }] + later_steps