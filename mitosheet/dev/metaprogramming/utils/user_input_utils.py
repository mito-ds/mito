# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Dict, Optional


# Types that step parameters can use in a valid way
VALID_PARAMETER_TYPES = [
    'int', 'float', 'str', 'bool',
    'ColumnID', 'List[ColumnID]', 
    'List[str]', 'List[int]',
    'Any'
]


def read_params(name_of_params: Optional[str]='param names') -> Dict[str, str]:
    param_names = filter(lambda x: x != '', input(f"Enter a comma seperated list of {name_of_params}: [sheet_index, column_ids, ...] ").replace(' ', '').split(','))
    
    params = {}
    for param_name in param_names:
        type = ''
        while type not in VALID_PARAMETER_TYPES:
            type = input(f'Select a type from {VALID_PARAMETER_TYPES} for {param_name}: ')
        params[param_name] = type
    
    return params