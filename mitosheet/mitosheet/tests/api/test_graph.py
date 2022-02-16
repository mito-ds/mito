import pandas as pd
from mitosheet.api.graph.graph_utils import BAR
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.utils import get_new_id


def test_valid_simple_graph():
    df = pd.DataFrame({
        'name': ['alice','bob','charlie'],
        'height': [1, 2, 3]
    })

    mito = create_mito_wrapper_dfs(df)

    response = mito.mito_widget.receive_message(mito.mito_widget, {
        'event': 'api_call',
        'type': 'get_graph',
        'id': get_new_id(),
        'graph_creation' : {
            'graph_type': BAR,
            'sheet_index': 0,
            'x_axis_column_ids': ['name'],
            'y_axis_column_ids': ['height'],
        },
        'graph_rendering': {
            'height': '100%',
            'width': '100%'
        }
    })

    assert(response)

def test_valid_simple_graph_2():
    df = pd.DataFrame({
        'name': ['alice','bob','charlie'],
        'height': [1, 2, 3],
        'weight': [1, 2, 3]
    })

    mito = create_mito_wrapper_dfs(df)

    response = mito.mito_widget.receive_message(mito.mito_widget, {
        'event': 'api_call',
        'type': 'get_graph',
        'id': get_new_id(),
        'graph_creation' : {
            'graph_type': BAR,
            'sheet_index': 0,
            'x_axis_column_ids': ['name'],
            'y_axis_column_ids': ['height', 'weight'],
        },
        'graph_rendering': {
            'height': '100%',
            'width': '100%'
        }
    })

    assert(response)


