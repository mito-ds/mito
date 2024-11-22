from typing import List, Dict, Any

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
    print(f"Prompt: {prompt_name}")
    for test_case_result in test_case_results:
        print(f"Test: {test_case_result.test.name} - {test_case_result.passed}")
