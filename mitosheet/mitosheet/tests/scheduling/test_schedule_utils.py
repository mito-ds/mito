import pandas as pd
import pytest

from mitosheet.scheduling.schedule_utils import (
    get_automation_code, get_automation_files_for_new_automation,
    get_cron_string_from_schedule)
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.tests.decorators import only_on_github_actions


def test_get_automation_code_with_no_params():
    mito = create_mito_wrapper()
    automation_code = get_automation_code(
        mito.mito_backend.steps_manager,
        'automation_name',
        'automation_name',
    )

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

    assert automation_code == """from mitosheet.public.v3 import *
from mitosheet.tests.scheduling.test_schedule_utils import ADDONE

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


def test_get_automation_files_returns_correct_files(tmp_path):
    mito = create_mito_wrapper()
    df = pd.DataFrame({'A': [1, 2, 3]})
    import_path = str(tmp_path / 'input.csv')
    df.to_csv(import_path, index=False)
    mito.simple_import([import_path])

    files = get_automation_files_for_new_automation(
        mito.mito_backend.steps_manager,
        'newname',
        'automation_description',
        'automations/newname',
        {
            'type': 'Every Day',
            'time': '09:00'
        }
    )

    assert len(files) == 5
    assert 'automations/newname/automation.py' in files and len(files['automations/newname/automation.py']) > 0
    assert 'automations/newname/requirements.txt' in files and len(files['automations/newname/requirements.txt']) > 0
    assert 'automations/newname/README.md' in files and len(files['automations/newname/README.md']) > 0
    assert 'automations/newname/data/input.csv' in files and len(files['automations/newname/data/input.csv']) > 0
    assert '.github/workflows/newname.yml' in files and len(files['.github/workflows/newname.yml']) > 0


"""
type EveryDayAutomationSchedule = {
    type: 'Every Day',
    time: string
}

type EveryWeekAutomationSchedule = {
    type: 'Every Week',
    dayOfWeek: number,
    time: string
}

type EveryMonthAutomationSchedule = {
    type: 'Every Month',
    dayOfMonth: number,
    time: string
}
"""
CRON_TESTS = [
    (
        {
            'type': 'Every Day',
            'time': '09:00'
        }
        , '0 9 * * *'
    ),
    (
        {
            'type': 'Every Week',
            'dayOfWeek': 1,
            'time': '09:00'
        }
        , '0 9 * * 1'
    ),
    (
        {
            'type': 'Every Month',
            'dayOfMonth': 1,
            'time': '09:00'
        }
        , '0 9 1 * *'
    )
]

@pytest.mark.parametrize('schedule, cron_string', CRON_TESTS)
@only_on_github_actions
def test_cron_string_from_schedule(schedule, cron_string):
    assert get_cron_string_from_schedule(schedule) == cron_string