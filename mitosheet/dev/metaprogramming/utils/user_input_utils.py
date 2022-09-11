
from typing import Dict


# Types that step parameters can use in a valid way
VALID_PARAMETER_TYPES = [
    'int', 'float', 'str', 'bool',
    'ColumnID', 'List[ColumnID]', 
    'Any'
]


def read_params() -> Dict[str, str]:
    param_names = filter(lambda x: x != '', input("Enter a comma seperated list of param nams: [sheet_index, column_ids, ...] ").replace(' ', '').split(','))
    
    params = {}
    for param_name in param_names:
        type = ''
        while type not in VALID_PARAMETER_TYPES:
            type = input(f'Select a type from {VALID_PARAMETER_TYPES} for {param_name}: ')
        params[param_name] = type
    
    return params