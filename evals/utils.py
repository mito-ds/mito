from typing import List, Dict, Any
from prettytable import PrettyTable
from evals.eval_types import TestCaseResult


def get_script_from_cells(cells: List[str]) -> str:
    return "\n".join(cells)

def get_globals_to_compare(globals: Dict[str, Any]) -> Dict[str, Any]:
    """
    Globals have a lot of stuff we don't actually care about comparing. 
    For now, we only care about comparing variables created by the script.
    This functionremoves everything else
    """

    globals = {k: v for k, v in globals.items() if k != "__builtins__"}

    # Remove functions from the globals since we don't want to compare them
    globals = {k: v for k, v in globals.items() if not callable(v)}

    return globals

def print_green(text: str):
    print("\033[92m", end="")
    print(text)
    print("\033[0m", end="")

def print_red(text: str):
    print("\033[91m", end="")
    print(text)
    print("\033[0m", end="")


def print_test_case_result_table(prompt_name: str, test_case_results: List[TestCaseResult]):

    # Bold prompt name
    print(f"\nPrompt: \033[1m{prompt_name}\033[0m")

    table = PrettyTable()
    field_names = ['Test Name', 'Result']
    table.field_names = field_names

    average_score = sum(test_case_result.passed for test_case_result in test_case_results) / len(test_case_results)

    for test_case_result in test_case_results:
        result_text = "Passed" if test_case_result.passed else "\033[91mFailed\033[0m"
        table.add_row([test_case_result.test.name, result_text])

    table.add_row(["" for _ in field_names])
    table.add_row([f"Average Score", f"{average_score:.2f}"])

    print(table)
