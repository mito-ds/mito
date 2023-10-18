import os
from mitosheet.tests.decorators import requires_streamlit
from mitosheet.streamlit.v1.spreadsheet import MitoAnalysis
import pytest
import pandas as pd

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
            'initial_value': tmp_file1,
            'type': 'import',
            'subtype': 'file_name_import_csv',
            'name': 'file_name_import_csv_0',
            'required': False
        },
        {
            'initial_value': tmp_file2,
            'type': 'import',
            'subtype': 'file_name_import_excel',
            'name': 'file_name_import_excel_0',
            'required': False
        },
        {
            'initial_value': tmp_exportfile1,
            'type': 'export',
            'subtype': 'file_name_export_csv',
            'name': 'file_name_export_csv_0',
            'required': False
        },
        {
            'initial_value': tmp_exportfile2,
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]
    
    analysis = MitoAnalysis('', None, fully_parameterized_function, param_metadata)
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
            'initial_value': tmp_file1,
            'type': 'import',
            'subtype': 'file_name_import_csv',
            'name': 'file_name_import_csv_0',
            'required': False
        },
        {
            'initial_value': tmp_file2,
            'type': 'import',
            'subtype': 'file_name_import_excel',
            'name': 'file_name_import_excel_0',
            'required': False
        },
        {
            'initial_value': tmp_exportfile1,
            'type': 'export',
            'subtype': 'file_name_export_csv',
            'name': 'file_name_export_csv_0',
            'required': False
        },
        {
            'initial_value': tmp_exportfile2,
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]
    
    new_export_file_0 = str(tmp_path / 'new_export.csv')
    new_export_file_1 = str(tmp_path / 'new_export.xlsx')
    analysis = MitoAnalysis('', None, fully_parameterized_function, param_metadata)

    # Test that get_param_metadata works
    assert analysis.get_param_metadata() == param_metadata
    assert analysis.get_param_metadata(type='import') == param_metadata[:2]
    assert analysis.get_param_metadata(type='export') == param_metadata[2:]

    with pytest.raises(TypeError):
        analysis.get_param_metadata(type='invalid')

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
            'initial_value': 'test_df_name',
            'type': 'import',
            'subtype': 'import_dataframe',
            'required': True,
            'name': 'import_dataframe_0'
        }
    ]

    analysis = MitoAnalysis('', None, fully_parameterized_function, param_metadata)

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
            'initial_value': 'test_df_name',
            'type': 'import',
            'subtype': 'import_dataframe',
            'required': True,
            'name': 'import_dataframe_0'
        },
        {
            'initial_value': tmp_file1,
            'type': 'import',
            'subtype': 'file_name_import_csv',
            'name': 'file_name_import_csv_0',
            'required': False
        },
        {
            'initial_value': tmp_file2,
            'type': 'import',
            'subtype': 'file_name_import_excel',
            'name': 'file_name_import_excel_0',
            'required': False
        },
        {
            'initial_value': tmp_exportfile1,
            'type': 'export',
            'subtype': 'file_name_export_csv',
            'name': 'file_name_export_csv_0',
            'required': False
        },
        {
            'initial_value': tmp_exportfile2,
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]
    
    new_export_file_0 = str(tmp_path / 'new_export.csv')
    new_export_file_1 = str(tmp_path / 'new_export.xlsx')
    analysis = MitoAnalysis('', None, fully_parameterized_function, param_metadata)

    # Test that get_param_metadata works
    assert analysis.get_param_metadata() == param_metadata
    assert analysis.get_param_metadata(type='import') == param_metadata[:3]
    assert analysis.get_param_metadata(type='export') == param_metadata[3:]

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
            'initial_value': 'test_df_name',
            'type': 'import',
            'subtype': 'import_dataframe',
            'required': True,
            'name': 'import_dataframe_0'
        },
        {
            'initial_value': tmp_file1,
            'type': 'import',
            'subtype': 'file_name_import_csv',
            'name': 'file_name_import_csv_0',
            'required': False
        },
        {
            'initial_value': tmp_file2,
            'type': 'import',
            'subtype': 'file_name_import_excel',
            'name': 'file_name_import_excel_0',
            'required': False
        },
        {
            'initial_value': tmp_exportfile1,
            'type': 'export',
            'subtype': 'file_name_export_csv',
            'name': 'file_name_export_csv_0',
            'required': False
        },
        {
            'initial_value': tmp_exportfile2,
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]
    
    new_export_file_0 = str(tmp_path / 'new_export.csv')
    analysis = MitoAnalysis('', None, fully_parameterized_function, param_metadata)
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
            'initial_value': 'test_df_name',
            'type': 'import',
            'subtype': 'import_dataframe',
            'required': True,
            'name': 'import_dataframe_0'
        },
    ]
    
    analysis = MitoAnalysis('', None, fully_parameterized_function, param_metadata)
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
            'initial_value': "xyz",
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]
    
    analysis = MitoAnalysis('', None, fully_parameterized_function, param_metadata)
    with pytest.raises(TypeError):
        analysis.run(testing=1)
    
