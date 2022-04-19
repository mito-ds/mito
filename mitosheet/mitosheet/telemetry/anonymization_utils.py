

# When we anonymize, we use some combination of these words
# to construct new private words
from typing import Any, Dict
from mitosheet.parser import parse_formula
from mitosheet.telemetry.private_params_map import FORMULAS_TO_ANONYIMIZE, PARAMS_TO_ANONYIMIZE, PARAMS_TO_LINEARIZE, PUBLIC_PARAMS
from mitosheet.types import StepsManagerType
from mitosheet.user.db import get_user_field
from mitosheet.user.schemas import UJ_USER_SALT


valid_words = ['cat', 'dog', 'hat', 'time', 'person', 'year', 'way', 'thing', 'man', 'world', 'life', 'born', 'part', 'child', 'eye', 'woman', 'place', 'work', 'fall', 'case', 'point', 'company', 'number', 'group', 'problem', 'fact']

# We use the same salt to anonymize_words, and we read
# this salt in once the function is called for the first
# time, to make sure it's initialized properly
salt = None
def anonymize_word(word: Any) -> str:
    """
    Helper function that turns a column header into
    a totally anonymous version of the column header,
    as to not leak _any_ user data
    """
    # We make sure that the salt is read in after the entire
    # app has been initalized, so that we don't have to read
    # from the file all the time
    global salt
    if salt is None:
        salt = get_user_field(UJ_USER_SALT)

    word = str(word)

    # We select three indexes from the valid_words list, and concatenate them
    index_one = int(hash(salt + word + '0')) % len(valid_words)
    index_two = int(hash(salt + word + '1')) % len(valid_words)
    index_three = int(hash(salt + word + '2')) % len(valid_words)

    return valid_words[index_one] + valid_words[index_two] + valid_words[index_three]


def anonymize_formula(formula: str, sheet_index: int, steps_manager: StepsManagerType=None) -> str:
    """
    Helper function that anonymizes formula to 
    make sure that no private data is included in it.
    """
    if steps_manager is None:
        return anonymize_word(formula)

    # We just input a random address, as we don't use it
    _, _, dependencies = parse_formula(
        formula, 
        'A', 
        steps_manager.dfs[sheet_index].columns,
        throw_errors=False
    )
    
    for dependency in dependencies:
        formula = formula.replace(str(dependency), anonymize_word(dependency))
    
    return formula

def anonyimize_object(obj: Any) -> Any:
    """
    Anoymizes anything it is given
    """
    if isinstance(obj, list):
        return [anonymize_word(v) for v in obj]
    elif isinstance(obj, dict):
        return {key: anonymize_word(v) for key, v in obj.items()}

all_keys = set()
def get_final_private_params_for_single_kv(key: str, value: Any, params: Dict[str, Any], steps_manager: StepsManagerType=None) -> Dict[str, Any]:
    private_params = dict()
    
    added = False
    if key in PUBLIC_PARAMS:
        private_params[key] = value
    elif key in PARAMS_TO_ANONYIMIZE:
        private_params[key] = anonyimize_object(value)
    elif key in FORMULAS_TO_ANONYIMIZE:
        private_params[key] = anonymize_formula(value, params['sheet_index'], steps_manager)
    elif key in PARAMS_TO_LINEARIZE:
        # TODO: explain this
        for nested_key, nested_value in value.items():
            nested_params = get_final_private_params_for_single_kv(nested_key, nested_value, params, steps_manager)
            nested_params = {key + "_" + k: v for k, v in  nested_params.items()}
            private_params = {**private_params, **nested_params}
    else:
        global all_keys
        all_keys.add(key)
        added = True

    if added:
        print(all_keys)
        assert False
    
    return private_params