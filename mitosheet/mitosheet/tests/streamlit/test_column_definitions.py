import json
import pytest
from mitosheet.mito_backend import MitoBackend, get_mito_backend
import pandas as pd

df = pd.DataFrame({
    'A': [1, 2, 3, 4, 5, 6, 7, 8, 9],
    'B': [1, 2, 3, 4, 5, 6, 7, 8, 9]
})

def test_create_backend_with_column_definitions_works():
    

    column_definitions= [
        [
            {
                'columns': ['A', 'B'],
                'conditional_formats': [{
                    'filters': [{'condition': 'greater', 'value': 5}], 
                    'font_color': '#c30010', 
                    'background_color': '#ffcbd1' 
                }] 
            },
            {
                'columns': ['A'],
                'conditional_formats': [{
                    'filters': [{'condition': 'less_than_or_equal', 'value': 0}], 
                    'font_color': '#FFFFFF', 
                    'background_color': '#000000' 
                }] 
            },
        ]
    ]

    mito_backend = get_mito_backend(df, column_definitions=column_definitions)

    df_formats = mito_backend.steps_manager.curr_step.df_formats
    
    # Still generates valid, empty df_formats objects
    assert df_formats[0]['columns'] == {}
    assert df_formats[0]['headers'] == {}
    assert df_formats[0]['rows']['even'] == {}
    assert df_formats[0]['rows']['odd'] == {}
    assert df_formats[0]['border'] == {}

    # But now has conditional formats
    assert len(df_formats[0]['conditional_formats']) == 2
    assert df_formats[0]['conditional_formats'][0]['columnIDs'] == ['A', 'B']
    assert df_formats[0]['conditional_formats'][0]['filters'] == [{'condition': 'greater', 'value': 5}]
    assert df_formats[0]['conditional_formats'][0]['color'] == '#c30010'
    assert df_formats[0]['conditional_formats'][0]['backgroundColor'] == '#ffcbd1'
    assert df_formats[0]['conditional_formats'][0]['invalidFilterColumnIDs'] == []

    assert df_formats[0]['conditional_formats'][1]['columnIDs'] == ['A']
    assert df_formats[0]['conditional_formats'][1]['filters'] == [{'condition': 'less_than_or_equal', 'value': 0}]
    assert df_formats[0]['conditional_formats'][1]['color'] == '#FFFFFF'
    assert df_formats[0]['conditional_formats'][1]['backgroundColor'] == '#000000'
    assert df_formats[0]['conditional_formats'][1]['invalidFilterColumnIDs'] == []

    # They should have different format_uuids
    assert df_formats[0]['conditional_formats'][0]['format_uuid'] != df_formats[0]['conditional_formats'][1]['format_uuid']


def test_create_backend_with_column_definitions_works_multiple_sheets():
    
    column_definitions= [
        [
            {
                'columns': ['A', 'B'],
                'conditional_formats': [{
                    'filters': [{'condition': 'greater', 'value': 5}], 
                    'font_color': '#c30010', 
                    'background_color': '#ffcbd1' 
                }] 
            }
        ], 
        [
            {
                'columns': ['A', 'B'],
                'conditional_formats': [{
                    'filters': [{'condition': 'greater_than_or_equal', 'value': 10}], 
                    'font_color': '#000000', 
                    'background_color': '#FFFFFF' 
                }] 
            },
        ]
    ]

    dfs = [df, df]
    mito_backend = get_mito_backend(*dfs, column_definitions=column_definitions)

    df_formats = mito_backend.steps_manager.curr_step.df_formats
    
    # Still generates valid, empty df_formats objects
    assert df_formats[0]['columns'] == {}
    assert df_formats[0]['headers'] == {}
    assert df_formats[0]['rows']['even'] == {}
    assert df_formats[0]['rows']['odd'] == {}
    assert df_formats[0]['border'] == {}

    # But now has conditional formats
    assert len(df_formats[0]['conditional_formats']) == 1
    assert df_formats[0]['conditional_formats'][0]['columnIDs'] == ['A', 'B']
    assert df_formats[0]['conditional_formats'][0]['filters'] == [{'condition': 'greater', 'value': 5}]
    assert df_formats[0]['conditional_formats'][0]['color'] == '#c30010'
    assert df_formats[0]['conditional_formats'][0]['backgroundColor'] == '#ffcbd1'
    assert df_formats[0]['conditional_formats'][0]['invalidFilterColumnIDs'] == []

    assert len(df_formats[1]['conditional_formats']) == 1
    assert df_formats[1]['conditional_formats'][0]['columnIDs'] == ['A', 'B']
    assert df_formats[1]['conditional_formats'][0]['filters'] == [{'condition': 'greater_than_or_equal', 'value': 10}]
    assert df_formats[1]['conditional_formats'][0]['color'] == '#000000'
    assert df_formats[1]['conditional_formats'][0]['backgroundColor'] == '#FFFFFF'
    assert df_formats[1]['conditional_formats'][0]['invalidFilterColumnIDs'] == []

    # They should have different format_uuids
    assert df_formats[0]['conditional_formats'][0]['format_uuid'] != df_formats[1]['conditional_formats'][0]['format_uuid']


INVALID_COLUMN_DEFINITIONS = [
    (
        [
            [
                {
                    'columns': ['A'],
                    'conditional_formats': [{
                        'filters': [{'condition': 'less_than_or_equal', 'value': 0}], 
                        'font_color': 'ABC', 
                        'background_color': '#000000' 
                    }] 
                },
            ]
        ], "set in column_definititon is not a valid hex color"
    ),
    (
        [
            [
                {
                    'columns': ['A'],
                    'conditional_formats': [{
                        'filters': [{'condition': 'less_than_or_equal', 'value': 0}],
                    }] 
                },
            ]
        ], 
        "column_definititon has invalid conditional_format rules. It must set the font_color, background_color, or both."
    ),
    (
        [
            [
                {
                    'columns': ['A'],
                    'conditional_formats': [{
                        'filters': [{'condition': 'less_than_or_equal', 'value': 0}],
                        'font_color': '#000000', 
                        'background_color': '#000000' 
                    }] 
                },
            ], 
            [
                {
                    'columns': ['A'],
                    'conditional_formats': [{
                        'filters': [{'condition': 'less_than_or_equal', 'value': 0}],
                        'font_color': '#000000', 
                        'background_color': '#000000' 
                    }] 
                },
            ], 
        ],
        "dataframes are provided."
    ),
    (
        [
            [
                {
                    'columns': ['D'],
                    'conditional_formats': [{
                        'filters': [{'condition': 'less_than_or_equal', 'value': 0}],
                        'font_color': '#000000', 
                        'background_color': '#000000' 
                    }] 
                },
            ], 
        ], 
        "don't exist in the dataframe."
    ),
    (
        [
            [
                {
                    'columns': ['A'],
                    'conditional_formats': [{
                        'filters': [{'condition': 'INVALID_FILTER', 'value': 0}],
                        'font_color': '#000000', 
                        'background_color': '#000000' 
                    }] 
                },
            ], 
        ], 
        "The condition INVALID_FILTER is not a valid filter condition."
    ),
]
@pytest.mark.parametrize("column_definitions,error", INVALID_COLUMN_DEFINITIONS)
def test_invalid_column_definitions(column_definitions, error):

    with pytest.raises(ValueError) as e_info:
        mito_backend = get_mito_backend(df, column_definitions=column_definitions)
        
    assert error in str(e_info)


def test_create_backend_with_column_definitions_does_not_error_with_mismatch_condition_and_column_type():
    column_definitions= [
        [
            {
                'columns': ['A'],
                'conditional_formats': [{
                    'filters': [{'condition': "string_does_not_contain", 'value': 0}],
                    'font_color': '#c30010', 
                    'background_color': '#ffcbd1'
                }] 
            },
        ], 
    ]

    mito_backend = get_mito_backend(df, column_definitions=column_definitions)
    df_formats = mito_backend.steps_manager.curr_step.df_formats
    assert len(df_formats[0]['conditional_formats']) == 1
    assert df_formats[0]['conditional_formats'][0]['columnIDs'] == ['A']
    assert df_formats[0]['conditional_formats'][0]['filters'] == [{'condition': "string_does_not_contain", 'value': 0}]
    assert df_formats[0]['conditional_formats'][0]['color'] == '#c30010'
    assert df_formats[0]['conditional_formats'][0]['backgroundColor'] == '#ffcbd1'
    assert df_formats[0]['conditional_formats'][0]['invalidFilterColumnIDs'] == []
        

def test_column_definitions_with_string_indexes_conditional_format_works():
    column_definitions= [
        [
            {
                'columns': ['A'],
                'conditional_formats': [{
                    'filters': [{'condition': 'number_exactly', 'value': 2}], 
                    'font_color': '#c30010', 
                    'background_color': '#ffcbd1' 
                }] 
            }
        ]
    ]


    mito_backend = get_mito_backend(pd.DataFrame({'A': [1, 2, 3]}, index=['S1', 'S2', 'S3']), column_definitions=column_definitions)
    sheet_json = mito_backend.get_shared_state_variables()['sheet_data_json']
    sheet_data = json.loads(sheet_json)[0]
    conditional_formatting_result = sheet_data['conditionalFormattingResult']
    assert len(conditional_formatting_result['results']) == 1
    assert len(conditional_formatting_result['results']['A']) == 1
    assert 'S2' in conditional_formatting_result['results']['A']




