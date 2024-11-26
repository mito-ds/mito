from typing import List, Dict, Any, Optional, Sequence
from prettytable import PrettyTable
from evals.eval_types import TestCaseResult
import pandas as pd

def get_script_from_cells(cells: List[str]) -> str:
    """
    Convert all of the previous cells into a single script. Exclude the current cell.
    """
    return "\n".join(cells[:-1])

def get_globals_to_compare(globals: Dict[str, Any], variables_to_compare: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Globals have a lot of stuff we don't actually care about comparing. 
    For now, we only care about comparing variables created by the script.
    This functionremoves everything else
    """
    if variables_to_compare is not None:
        # Get the variables to compare from the globals and remove everything else
        return {k: v for k, v in globals.items() if k in variables_to_compare}

    globals = {k: v for k, v in globals.items() if k != "__builtins__"}

    # Remove functions from the globals since we don't want to compare them
    globals = {k: v for k, v in globals.items() if not callable(v)}

    return globals


def print_test_case_result_tables(test_case_results_dict: Dict[str, List[TestCaseResult]]):
    for prompt_name, test_case_results in test_case_results_dict.items():
        print_test_case_result_table(prompt_name, test_case_results)

def print_test_case_result_table(prompt_name: str, test_case_results: List[TestCaseResult]):

    # Bold prompt name
    print(f"\nPrompt: \033[1m{prompt_name}\033[0m")

    table = PrettyTable()
    table.align = 'l'  # Left align all columns
    field_names = ['Test Name', 'Tags', 'Result']
    table.field_names = field_names

    for test_case_result in test_case_results:
        result_text = "Passed" if test_case_result.passed else "\033[91mFailed\033[0m"
        clean_tags = clean_tags_for_display(test_case_result.test.tags)
        table.add_row([test_case_result.test.name, clean_tags, result_text])

    table.add_row(["" for _ in field_names])

    total_passed = sum(test_case_result.passed for test_case_result in test_case_results)
    total_tests = len(test_case_results)
    average_score = total_passed / total_tests

    table.add_row([f"Average Score", "", f"{average_score:.2f} ({total_passed}/{total_tests})"])

    print(table)

def clean_tags_for_display(tags: Sequence[str]) -> str:
    """
    Remove the [ and ] and quotes from the tags.
    """
    return ", ".join([tag.replace("[", "").replace("]", "").replace('"', "").replace("'", "") for tag in tags])

def are_globals_equal(globals1: Dict[str, Any], globals2: Dict[str, Any]) -> bool:
    """
    Compares two dictionaries of globals, and returns True if they are equal,
    and False otherwise.

    Take special care to correctly check equality for pandas DataFrames.
    """

    # First, check if the keys are the same
    if globals1.keys() != globals2.keys():
        return False
    
    global_keys_one = set(globals1.keys())
    for key in global_keys_one:
        var_one = globals1[key]
        var_two = globals2[key]

        if isinstance(var_one, pd.DataFrame) and isinstance(var_two, pd.DataFrame):
            if not var_one.equals(var_two):
                return False
        else:
            if var_one != var_two:
                return False
    
    return True