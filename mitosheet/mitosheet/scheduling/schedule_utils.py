import datetime
import os
import sys
from typing import Any, Dict, Tuple
from mitosheet.transpiler.transpile import transpile

from mitosheet.types import StepsManagerType

def get_path_of_import_param_for_automation(
        automation_base_folder: str,
        original_value: str,
    ) -> str:
    file_name = os.path.basename(original_value)
    return os.path.join(automation_base_folder, 'data', file_name)

def get_data_files_for_automation(
        steps_manager: StepsManagerType,
        automation_base_folder: str,
    ) -> Dict[str, str]:

    data_files: Dict[str, str] = {}

    # First, we get the CSV and Excel files the user has importer
    import_params = [param for param in steps_manager.param_metadata if param['type'] == 'import']
    original_paths = [param['original_value'] for param in import_params if 'file' in param['subtype'] and param['original_value'] is not None]

    for original_path in original_paths:
        new_path = get_path_of_import_param_for_automation(
            automation_base_folder,
            original_path
        )
        data_files[new_path] = open(original_path).read()

    return data_files

def get_minute_and_hour_from_time(time: str) -> Tuple[int, int]:
    hour = time.split(':')[0]
    minute = time.split(':')[1]

    # Handle the timezone here. Github actions run in UTC, so we need to convert the time to UTC
    # from the current timezone of the user
    current_timezone = datetime.datetime.now(datetime.timezone.utc).astimezone().tzinfo
    hour_and_minute = datetime.datetime.strptime(f'{hour}:{minute}', '%H:%M').time()

    # Then, make a datetime object with the current timezone, and convert it to UTC
    hour_and_minute = datetime.datetime.combine(datetime.date.today(), hour_and_minute)

    # Then, we convert it to the current timezone, and then to UTC
    hour_and_minute = hour_and_minute.replace(tzinfo=current_timezone)
    hour_and_minute = hour_and_minute.astimezone(datetime.timezone.utc)

    hour_int = hour_and_minute.hour
    minute_int = hour_and_minute.minute

    return hour_int, minute_int

def get_cron_string_from_schedule(schedule: Dict[str, Any]) -> str:
    if schedule['type'] == 'Every Day':
        hour, minute = get_minute_and_hour_from_time(schedule['time'])
        return f'{minute} {hour} * * *'

    elif schedule['type'] == 'Every Week':
        hour, minute = get_minute_and_hour_from_time(schedule['time'])
        day_of_week = schedule['dayOfWeek']
        return f'{minute} {hour} * * {day_of_week}'

    elif schedule['type'] == 'Every Month':
        hour, minute = get_minute_and_hour_from_time(schedule['time'])
        day_of_month = schedule['dayOfMonth']
        return f'{minute} {hour} {day_of_month} * *'

    else:
        raise Exception(f"Invalid schedule type: {schedule['type']}")
    
def get_automation_code(
        steps_manager: StepsManagerType,
        automation_name: str,
        automation_base_folder: str,
    ) -> str:

    # First, we get the function name
    # TODO: improve this
    function_name = automation_name.replace(' ', '_').lower()

    function_code_lines = transpile(
        steps_manager,
        add_comments=False,
        optimize=True,
        code_options_override={
            'import_custom_python_code': True,
            'as_function': True,
            'call_function': False,
            'function_name': function_name,
            'function_params': 'all',
        }
    )


    # After getting the function, we go through and actually look at all the parameters. We 
    # append the necessary code to the function to define the parameters and set their values

    # NOTE: in the future, this should be a proper code option -- but this needs more specifying and
    # probably some refactoring. There's a bit of debt in code options, as they are a monolith and kinda 
    # hard to change. I'm not even really sure what the interface for function_params should be -- but it 
    # feels like there's two things:
    # 1. What should be parameterized
    # 2. What should the called values of those parameters be. 
    # Perhaps, we want to make `call_function` allow a similar sort of mapping to `function_params` --
    # where you can say for these subtypes, give them these values? But this get challenging to specify
    # the most useful types for these, as we've sene with `function_params`. I think we probably should
    # do a couple more hacks, then take a step back, and design a _beautiful_ API. I think we're close...

    import_param_definitions = []
    export_param_definitions = []
    for param_metadata in steps_manager.param_metadata:
        # If it's an import, then the correct file path to use the automations folder
        if param_metadata['type'] == 'import' and param_metadata['original_value'] is not None:
            new_path = get_path_of_import_param_for_automation(
                automation_base_folder,
                param_metadata['original_value']
            )

            import_param_definitions.append(
                f'{param_metadata["name"]} = r"{new_path}"'
            )
            
        elif param_metadata['type'] == 'export':
            # Outputs write to {automation_base_folder}/runs/{timestamp}/{param_name}.csv
            file_extension = 'csv' if 'csv' in param_metadata['subtype'] else 'xlsx'
            new_path = f"{automation_base_folder}/runs/{{export_time}}/{param_metadata['name']}.{file_extension}"
            export_param_definitions.append(
                f'{param_metadata["name"]} = f"{new_path}"'
            )

    additional_package_imports = []
    export_folder_setup = []
    if len(export_param_definitions) > 0:
        additional_package_imports.append('import os')
        additional_package_imports.append('import sys')

        # Create a folder for the current timestamp
        export_folder_setup.append('# Create a folder for this run')
        export_folder_setup.append('export_time = sys.argv[1]')
        export_folder_path = f'{automation_base_folder}/runs/{{export_time}}'
        export_folder_setup.append(f'os.makedirs(f"{export_folder_path}")')

    # Then, we actually call the function
    function_call = f'{function_name}('
    for param_metadata in steps_manager.param_metadata:
        function_call += f'{param_metadata["name"]}, '
    if len(steps_manager.param_metadata) > 0:
        function_call = function_call[:-2]
    function_call += ')'

    # Add the import and export param definitions to the function code
    function_code_lines = [
        *additional_package_imports,
        *function_code_lines,
        '',
        *export_folder_setup,
        '',
        '# Run the automation',
        *import_param_definitions,
        *export_param_definitions,
        function_call
    ]

    return '\n'.join(function_code_lines)

    
def get_requirements_txt_file() -> str:
    from mitosheet import __version__ as mitosheet_version
    if mitosheet_version == '0.3.131': # Handle development version
        mitosheet_version = '0.1.528'

    from pandas import __version__ as pandas_version
    return f"""mitosheet=={mitosheet_version}
pandas=={pandas_version}
"""
    

def get_github_workflow_file(
        automation_name: str,
        automation_base_folder: str,
        schedule: Dict[str, Any]    
    ) -> str:

    cron_string = get_cron_string_from_schedule(schedule)
    # Get the current Python version as a string of 3.10, for example
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}"

    current_timestamp_variable = "${{ steps.date.outputs.date }}"
    
    return f"""
name: "Automation: {automation_name}"
on:
  schedule:
    - cron: {cron_string}
  workflow_dispatch: null
  pull_request:
    branches:
        - main
    
jobs:
  run_automation:
    name: "Run {automation_name}"
    runs-on: ubuntu-latest      
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python {python_version}
        uses: actions/setup-python@v4
        with:
          python-version: {python_version}
      - name: Get the current timestamp
        id: date
        run: echo "::set-output name=date::$(date +'%Y-%m-%d-%H-%M-%S')"
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r {automation_base_folder}/requirements.txt
      - name: Run automation
        run: python {automation_base_folder}/automation.py {current_timestamp_variable}
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: results-{current_timestamp_variable}
          path: {automation_base_folder}/runs/{current_timestamp_variable}
"""

def get_readme_file(
        automation_name: str,
        automation_description: str
    ) -> str:
    return f"""
# {automation_name}

{automation_description}

This automation was generated by Mito. To learn more about Mito, visit https://trymito.io.
"""

def get_automation_files_for_new_automation(
        steps_manager: StepsManagerType, 
        automation_name: str,
        automation_description: str,
        automation_base_folder: str,
        schedule: Dict[str, Any]
    ) -> Dict[str, str]:
    """
    Returns the new files 
    new_files

    new_files
    """
    new_files: Dict[str, str] = {}

    # Add the data files
    data_files = get_data_files_for_automation(
        steps_manager,
        automation_base_folder,
    )
    new_files.update(data_files)

    # Then, we get these files from the parameters as the function call to the function
    new_files[f'{automation_base_folder}/automation.py'] = get_automation_code(
        steps_manager,
        automation_name,
        automation_base_folder,
    )
    
    # Setup a requirements.txt file
    new_files[f'{automation_base_folder}/requirements.txt'] = get_requirements_txt_file()

    # Then, we add the Github Actions workflow file
    new_files[f'.github/workflows/automation.yml'] = get_github_workflow_file(automation_name, automation_base_folder, schedule)

    # Finally, we add a README file
    new_files[f'{automation_base_folder}/README.md'] = get_readme_file(automation_name, automation_description)

    return new_files