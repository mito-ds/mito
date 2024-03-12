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


def test_create_backend_with_column_definitions_errors_on_invalid_color():
    column_definitions= [
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
    ]

    with pytest.raises(ValueError) as e_info:
        mito_backend = get_mito_backend(df, column_definitions=column_definitions)
        
    assert "ABC" in str(e_info)

def test_create_backend_with_column_definitions_errors_on_no_colors():
    column_definitions= [
        [
            {
                'columns': ['A'],
                'conditional_formats': [{
                    'filters': [{'condition': 'less_than_or_equal', 'value': 0}],
                }] 
            },
        ]
    ]

    with pytest.raises(ValueError) as e_info:
        mito_backend = get_mito_backend(df, column_definitions=column_definitions)
        
    assert "column_definititon has invalid conditional_format rules. It must set the font_color, background_color, or both." in str(e_info)
