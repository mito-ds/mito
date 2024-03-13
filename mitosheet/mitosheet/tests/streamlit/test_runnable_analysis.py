import os
from mitosheet.tests.decorators import requires_streamlit
from mitosheet.streamlit.v1.spreadsheet import RunnableAnalysis
import pytest
import pandas as pd

from mitosheet.tests.test_transpile import custom_import


simple_fn = f"""from mitosheet.public.v3 import *
import pandas as pd

def function(import_dataframe_0):
    return import_dataframe_0
"""

simple_param_metadata = [
    {
        'original_value': 'test_df_name',
        'type': 'df_name',
        'subtype': 'import_dataframe',
        'required': True,
        'name': 'import_dataframe_0'
    },
]

@requires_streamlit
def test_mito_analysis_run(tmp_path):
    fully_parameterized_function = f"""from mitosheet.public.v3 import *
import pandas as pd

def function(file_name_import_csv_0, file_name_import_excel_0, file_name_export_csv_0, file_name_export_excel_0):
    txt = pd.read_csv(file_name_import_csv_0)
    
    sheet_df_dictonary = pd.read_excel(file_name_import_excel_0, engine='openpyxl', sheet_name=[
        'Sheet1'
    ], skiprows=0)
    Sheet1 = sheet_df_dictonary['Sheet1']

    txt.insert(1, 'HelloWorld', SUM(1,2))
    
    txt.to_csv(file_name_export_csv_0, index=False)
    
    with pd.ExcelWriter(file_name_export_excel_0, engine="openpyxl") as writer:
        Sheet1.to_excel(writer, sheet_name="Sheet1", index=False)
    
    return txt, Sheet1
"""
    tmp_file1 = str(tmp_path / 'txt.csv')
    tmp_file2 = str(tmp_path / 'file.xlsx')
    tmp_exportfile1 = str(tmp_path / 'export.csv')
    tmp_exportfile2 = str(tmp_path / 'export.xlsx')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    expected_df = pd.DataFrame({ 'A': [1], 'HelloWorld': [3], 'B': [2] })
    df1.to_csv(tmp_file1, index=False)
    df1.to_excel(tmp_file2, index=False)
    param_metadata = [
        {
            'original_value': tmp_file1,
            'type': 'import',
            'subtype': 'file_name_import_csv',
            'name': 'file_name_import_csv_0',
            'required': False
        },
        {
            'original_value': tmp_file2,
            'type': 'import',
            'subtype': 'file_name_import_excel',
            'name': 'file_name_import_excel_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile1,
            'type': 'export',
            'subtype': 'file_name_export_csv',
            'name': 'file_name_export_csv_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile2,
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]
    
    analysis = RunnableAnalysis('', None,  fully_parameterized_function, param_metadata)
    result = analysis.run()
    assert result is not None
    pd.testing.assert_frame_equal(result[0], expected_df)
    pd.testing.assert_frame_equal(result[1], df1)

@requires_streamlit
def test_mito_analysis_run_with_args(tmp_path):
    fully_parameterized_function = f"""from mitosheet.public.v3 import *
import pandas as pd

def function(file_name_import_csv_0, file_name_import_excel_0, file_name_export_csv_0, file_name_export_excel_0):
    txt = pd.read_csv(file_name_import_csv_0)
    
    sheet_df_dictonary = pd.read_excel(file_name_import_excel_0, engine='openpyxl', sheet_name=[
        'Sheet1'
    ], skiprows=0)
    Sheet1 = sheet_df_dictonary['Sheet1']

    txt.insert(1, 'HelloWorld', SUM(1,2))
    
    txt.to_csv(file_name_export_csv_0, index=False)
    
    with pd.ExcelWriter(file_name_export_excel_0, engine="openpyxl") as writer:
        Sheet1.to_excel(writer, sheet_name="Sheet1", index=False)
    
    return txt, Sheet1
"""
    tmp_file1 = str(tmp_path / 'txt.csv')
    tmp_file2 = str(tmp_path / 'file.xlsx')
    tmp_exportfile1 = str(tmp_path / 'export.csv')
    tmp_exportfile2 = str(tmp_path / 'export.xlsx')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    expected_df = pd.DataFrame({ 'A': [1], 'HelloWorld': [3], 'B': [2] })
    df1.to_csv(tmp_file1, index=False)
    df1.to_excel(tmp_file2, index=False)
    param_metadata = [
        {
            'original_value': tmp_file1,
            'type': 'import',
            'subtype': 'file_name_import_csv',
            'name': 'file_name_import_csv_0',
            'required': False
        },
        {
            'original_value': tmp_file2,
            'type': 'import',
            'subtype': 'file_name_import_excel',
            'name': 'file_name_import_excel_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile1,
            'type': 'export',
            'subtype': 'file_name_export_csv',
            'name': 'file_name_export_csv_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile2,
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]
    
    new_export_file_0 = str(tmp_path / 'new_export.csv')
    new_export_file_1 = str(tmp_path / 'new_export.xlsx')
    analysis = RunnableAnalysis('', None,  fully_parameterized_function, param_metadata)

    # Test that get_param_metadata works
    assert analysis.get_param_metadata() == param_metadata
    assert analysis.get_param_metadata(param_type='import') == param_metadata[:2]
    assert analysis.get_param_metadata(param_type='export') == param_metadata[2:]

    with pytest.raises(TypeError):
        analysis.get_param_metadata(param_type='invalid')

    result = analysis.run(file_name_export_csv_0=new_export_file_0)
    assert result is not None
    assert os.path.exists(new_export_file_0)
    assert not os.path.exists(new_export_file_1)
    pd.testing.assert_frame_equal(result[0], expected_df)
    pd.testing.assert_frame_equal(result[1], df1)


@requires_streamlit
def test_mito_analysis_run_with_import_var_in_code(tmp_path):
    fully_parameterized_function = f"""from mitosheet.public.v3 import *

def function_ctqm(import_dataframe_0):
    import_dataframe_0.insert(1, 'Test', 0)
    
    return import_dataframe_0
"""
    df = pd.DataFrame({'A': [1], 'B': [2]})
    param_metadata = [
        {
            'original_value': 'test_df_name',
            'type': 'import',
            'subtype': 'import_dataframe',
            'required': True,
            'name': 'import_dataframe_0'
        }
    ]

    analysis = RunnableAnalysis('', None,  fully_parameterized_function, param_metadata)

    assert analysis.get_param_metadata() == param_metadata
    assert analysis.get_param_metadata('import') == param_metadata
    assert analysis.get_param_metadata('export') == []

    result = analysis.run(df)
    expected_df = pd.DataFrame({'A': [1], 'Test': [0], 'B': [2]})
    assert result is not None
    pd.testing.assert_frame_equal(result, expected_df)
    
@requires_streamlit
def test_mito_analysis_run_with_positional_args(tmp_path):
    fully_parameterized_function = f"""from mitosheet.public.v3 import *
import pandas as pd

def function(import_dataframe_0, file_name_import_csv_0, file_name_import_excel_0, file_name_export_csv_0, file_name_export_excel_0):
    txt = pd.read_csv(file_name_import_csv_0)
    
    sheet_df_dictonary = pd.read_excel(file_name_import_excel_0, engine='openpyxl', sheet_name=[
        'Sheet1'
    ], skiprows=0)
    Sheet1 = sheet_df_dictonary['Sheet1']

    txt.insert(1, 'HelloWorld', SUM(1,2))
    
    txt.to_csv(file_name_export_csv_0, index=False)
    
    with pd.ExcelWriter(file_name_export_excel_0, engine="openpyxl") as writer:
        Sheet1.to_excel(writer, sheet_name="Sheet1", index=False)
    
    return import_dataframe_0, txt, Sheet1
"""
    tmp_file1 = str(tmp_path / 'txt.csv')
    tmp_file2 = str(tmp_path / 'file.xlsx')
    tmp_exportfile1 = str(tmp_path / 'export.csv')
    tmp_exportfile2 = str(tmp_path / 'export.xlsx')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    expected_df = pd.DataFrame({ 'A': [1], 'HelloWorld': [3], 'B': [2] })
    df1.to_csv(tmp_file1, index=False)
    df1.to_excel(tmp_file2, index=False)
    param_metadata = [
        {
            'original_value': 'test_df_name',
            'type': 'import',
            'subtype': 'import_dataframe',
            'required': True,
            'name': 'import_dataframe_0'
        },
        {
            'original_value': tmp_file1,
            'type': 'import',
            'subtype': 'file_name_import_csv',
            'name': 'file_name_import_csv_0',
            'required': False
        },
        {
            'original_value': tmp_file2,
            'type': 'import',
            'subtype': 'file_name_import_excel',
            'name': 'file_name_import_excel_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile1,
            'type': 'export',
            'subtype': 'file_name_export_csv',
            'name': 'file_name_export_csv_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile2,
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]
    
    new_export_file_0 = str(tmp_path / 'new_export.csv')
    new_export_file_1 = str(tmp_path / 'new_export.xlsx')
    analysis = RunnableAnalysis('', None,  fully_parameterized_function, param_metadata)

    # Test that get_param_metadata works
    assert analysis.get_param_metadata() == param_metadata
    assert analysis.get_param_metadata(param_type='import') == param_metadata[:3]
    assert analysis.get_param_metadata(param_type='export') == param_metadata[3:]

    new_df = pd.DataFrame({'A': [1], 'B': [2]})
    result = analysis.run(df1, file_name_export_csv_0=new_export_file_0)
    assert result is not None
    assert os.path.exists(new_export_file_0)
    assert not os.path.exists(new_export_file_1)
    pd.testing.assert_frame_equal(result[0], df1)
    pd.testing.assert_frame_equal(result[1], expected_df)
    pd.testing.assert_frame_equal(result[2], new_df)


@requires_streamlit
def test_mito_analysis_run_with_duplicate_positional_and_kwargs(tmp_path):
    fully_parameterized_function = f"""from mitosheet.public.v3 import *
import pandas as pd

def function(import_dataframe_0, file_name_import_csv_0, file_name_import_excel_0, file_name_export_csv_0, file_name_export_excel_0):
    txt = pd.read_csv(file_name_import_csv_0)
    
    sheet_df_dictonary = pd.read_excel(file_name_import_excel_0, engine='openpyxl', sheet_name=[
        'Sheet1'
    ], skiprows=0)
    Sheet1 = sheet_df_dictonary['Sheet1']

    txt.insert(1, 'HelloWorld', SUM(1,2))
    
    txt.to_csv(file_name_export_csv_0, index=False)
    
    with pd.ExcelWriter(file_name_export_excel_0, engine="openpyxl") as writer:
        Sheet1.to_excel(writer, sheet_name="Sheet1", index=False)
    
    return import_dataframe_0, txt, Sheet1
"""
    tmp_file1 = str(tmp_path / 'txt.csv')
    tmp_file2 = str(tmp_path / 'file.xlsx')
    tmp_exportfile1 = str(tmp_path / 'export.csv')
    tmp_exportfile2 = str(tmp_path / 'export.xlsx')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    expected_df = pd.DataFrame({ 'A': [1], 'HelloWorld': [3], 'B': [2] })
    df1.to_csv(tmp_file1, index=False)
    df1.to_excel(tmp_file2, index=False)
    param_metadata = [
        {
            'original_value': 'test_df_name',
            'type': 'import',
            'subtype': 'import_dataframe',
            'required': True,
            'name': 'import_dataframe_0'
        },
        {
            'original_value': tmp_file1,
            'type': 'import',
            'subtype': 'file_name_import_csv',
            'name': 'file_name_import_csv_0',
            'required': False
        },
        {
            'original_value': tmp_file2,
            'type': 'import',
            'subtype': 'file_name_import_excel',
            'name': 'file_name_import_excel_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile1,
            'type': 'export',
            'subtype': 'file_name_export_csv',
            'name': 'file_name_export_csv_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile2,
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]
    
    new_export_file_0 = str(tmp_path / 'new_export.csv')
    analysis = RunnableAnalysis('', None, fully_parameterized_function, param_metadata)
    with pytest.raises(TypeError):
        analysis.run(df1, import_dataframe_0=df1, file_name_export_csv_0=new_export_file_0)
    


@requires_streamlit
def test_run_fail_missing_required():
    fully_parameterized_function = f"""from mitosheet.public.v3 import *
import pandas as pd

def function(import_dataframe_0):
    return import_dataframe_0
"""
    param_metadata = [
        {
            'original_value': 'test_df_name',
            'type': 'import',
            'subtype': 'import_dataframe',
            'required': True,
            'name': 'import_dataframe_0'
        },
    ]
    
    analysis = RunnableAnalysis('', None,  fully_parameterized_function, param_metadata)
    with pytest.raises(TypeError):
        analysis.run()
    

@requires_streamlit
def test_run_fail_incorrect_args():
    fully_parameterized_function = f"""from mitosheet.public.v3 import *
import pandas as pd

def function(import_dataframe_0):
    return import_dataframe_0
"""
    param_metadata = [
        {
            'original_value': "xyz",
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]
    
    analysis = RunnableAnalysis('', None,  fully_parameterized_function, param_metadata)
    with pytest.raises(TypeError):
        analysis.run(testing=1)
    

@requires_streamlit
def test_to_and_from_json():
    analysis = RunnableAnalysis('', None,  simple_fn, simple_param_metadata)
    # Test that the to_json function 
    json = analysis.to_json()
    assert json is not None
    assert json == r'{"code": "", "code_options": null, "fully_parameterized_function": "from mitosheet.public.v3 import *\nimport pandas as pd\n\ndef function(import_dataframe_0):\n    return import_dataframe_0\n", "param_metadata": [{"original_value": "test_df_name", "type": "df_name", "subtype": "import_dataframe", "required": true, "name": "import_dataframe_0"}], "mito_analysis_version": 1}'

    # Test that the from_json function works
    new_analysis = RunnableAnalysis.from_json(json)
    assert new_analysis is not None
    
    df = pd.DataFrame({'A': [1], 'B': [2]})
    result = new_analysis.run(df)
    assert result is not None
    pd.testing.assert_frame_equal(result, df)

@requires_streamlit
def test_to_and_from_json_special_characters():
    special_characters_fn = """from mitosheet.public.v3 import *
import pandas as pd

def function(vari\abl"e_name{}):
    return vari\abl"e_name{}
"""
    special_characters_metadata = [
    {
        'original_value': 'test_df_name',
        'type': 'df_name',
        'subtype': 'import_dataframe',
        'required': True,
        'name': 'vari\ abl"e_name{}'
    },
]
    analysis = RunnableAnalysis('', None,  special_characters_fn, special_characters_metadata)
    # Test that the to_json function 
    json = analysis.to_json()
    assert json is not None

    # Test that the from_json function works
    new_analysis = RunnableAnalysis.from_json(json)
    assert new_analysis is not None
    assert new_analysis.fully_parameterized_function == special_characters_fn

@requires_streamlit
def test_custom_imports():
    fully_parameterized_code = """from mitosheet.public.v3 import *
from mitosheet.tests.test_transpile import custom_import, ADDONE

def function():
    df1 = custom_import()
    
    df1.insert(1, 'B', ADDONE(df1['A']))
    
    return df1
"""
    analysis = RunnableAnalysis('', None,  fully_parameterized_code, [])
    result = analysis.run()
    pd.testing.assert_frame_equal(result, pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 4]}))

@requires_streamlit
def test_can_pass_dataframe_to_file_path_in_run_auto_conversion():

    analysis = RunnableAnalysis(
        '',
        None,
        """from mitosheet.public.v3 import *
import pandas as pd

def function_srjr(file_name_import_csv_0):
    df_export = pd.read_csv(file_name_import_csv_0)
    
    return df_export
""",
    [{"original_value": "datasets/df_export.csv", "type": "import", "subtype": "file_name_import_csv", "required": False, "name": "file_name_import_csv_0"}]
)

    # Run with a df rather than a file path
    df = pd.DataFrame({'A': [1, 2, 3]})
    result = analysis.run(file_name_import_csv_0=df)
    assert result.equals(df)