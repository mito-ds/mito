# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from pathlib import Path


OPEN_BRACKET = '{'
CLOSE_BRACKET = '}'


def name_to_enum_key(name: str) -> str:
    return name.upper().replace(' ', '_')

def add_enum_value(path: Path, marker: str, key: str, value: str) -> None:

    with open(path, 'r') as f:
        code = f.read()
        code = code.replace(marker, f"{key} = '{value}',\n    {marker}")

    with open(path, 'w') as f:
        f.write(code)
    

def get_default_typescript_value_for_param(param_name: str, param_type: str) -> str:
    if param_name == 'sheet_index':
        return 'sheetIndex'

    if param_type == 'int' or param_type == 'float':
        return '0'
    elif param_type == 'str':
        return '"Random String"'
    elif param_type == 'bool':
        return 'true'
    elif param_type == 'ColumnID':
        return 'TODO'
    elif param_type.startswith('List'):
        return '[]'
    elif param_type == 'Any':
        return input(f'What is the default value for {param_name}?')
    else:
        raise Exception(f'{param_name} of type {param_type} is an unsupported type')

    
def get_typescript_type_for_param(param_name: str, param_type: str) -> str:
    if param_type == 'int' or param_type == 'float':
        return 'number'
    elif param_type == 'str':
        return 'string'
    elif param_type == 'bool':
        return 'boolean'
    elif param_type == 'ColumnID':
        return 'ColumnID'
    elif param_type == 'List[ColumnID]':
        return 'ColumnID[]'
    elif param_type == 'List[str]':
        return 'string[]'
    elif param_type == 'List[int]':
        return 'number[]'
    elif param_type == 'Any':
        return input(f'What is the Typescript type for {param_name}?')
    else:
        raise Exception(f'{param_name} of type {param_type} is an unsupported type')