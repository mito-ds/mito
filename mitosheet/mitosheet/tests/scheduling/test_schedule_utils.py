import pandas as pd
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.scheduling.schedule_utils import get_automation_code

def test_get_automation_code_with_no_params():
    mito = create_mito_wrapper()
    automation_code = get_automation_code(
        mito.mito_backend.steps_manager,
        'automation_name',
        'automation_name',
    )
    print(automation_code)

    assert automation_code == """
def automation_name():
    return 



# Run the automation
automation_name()"""

def ADDONE(x):
    return x + 1 

def test_get_automation_code_with_custom_function_params():

    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, sheet_functions=[ADDONE])
    mito.set_formula('=ADDONE(A1)', 0, 'B', add_column=True)
    automation_code = get_automation_code(
        mito.mito_backend.steps_manager,
        'automation_name',
        'automation_name',
    )
    print(automation_code)

    assert automation_code == """from mitosheet.public.v3 import *
from mitosheet.tests.scheduling.test_scheduling_utils import ADDONE

def automation_name(import_dataframe_0):
    import_dataframe_0.insert(1, 'B', ADDONE(import_dataframe_0['A'].shift(-1, fill_value=0)))
    
    return import_dataframe_0



# Run the automation
import_dataframe_0 = r"automation_name/data/df1"
automation_name(import_dataframe_0)"""

def test_get_automation_code(tmp_path):
    mito = create_mito_wrapper()
    df = pd.DataFrame({'A': [1, 2, 3]})

    import_path = str(tmp_path / 'input.csv')
    df.to_csv(import_path, index=False)

    mito.simple_import([import_path])
    mito.add_column(0, 'B', -1)
    output_path = str(tmp_path / 'output.csv')
    output_path_xlsx = str(tmp_path / 'output.xlsx')
    mito.export_to_file('csv', [0], output_path)
    mito.export_to_file('excel', [0], output_path_xlsx)

    automation_code = get_automation_code(
        mito.mito_backend.steps_manager,
        'automation_name',
        'automation_name',
    )
    
    assert automation_code == """import os
import sys
from mitosheet.public.v3 import *
import pandas as pd

def automation_name(file_name_import_csv_0, file_name_export_csv_0, file_name_export_excel_0):
    input = pd.read_csv(file_name_import_csv_0, sep='A')
    
    input.insert(2, 'B', 0)
    
    input.to_csv(file_name_export_csv_0, index=False)
    
    with pd.ExcelWriter(file_name_export_excel_0, engine="openpyxl") as writer:
        input.to_excel(writer, sheet_name="input", index=False)
    
    return input


# Create a folder for this run
export_time = sys.argv[1]
os.makedirs(f"automation_name/runs/{export_time}")

# Run the automation
file_name_import_csv_0 = r"automation_name/data/input.csv"
file_name_export_csv_0 = f"automation_name/runs/{export_time}/file_name_export_csv_0.csv"
file_name_export_excel_0 = f"automation_name/runs/{export_time}/file_name_export_excel_0.xlsx"
automation_name(file_name_import_csv_0, file_name_export_csv_0, file_name_export_excel_0)"""