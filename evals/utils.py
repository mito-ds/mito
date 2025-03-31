# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Dict, Any, Optional, Sequence
from evals.test_cases.agent_find_and_update_tests.simple import AgentFindAndUpdateTestCase
from prettytable import PrettyTable
from evals.eval_types import SmartDebugTestCase, TestCaseResult
import pandas as pd

def get_script_from_cells(cells: List[str], include_current_cell: bool = False) -> str:
    """
    Convert all of the previous cells into a single script. Exclude the current cell.
    """

    # TODO: Check if in the code gen test runners, we care about excluding the current cell.
    if include_current_cell:
        return "\n".join(cells)
    else:
        return "\n".join(cells[:-1])


def print_test_case_result_tables(test_type: str, test_case_results_dict: Dict[str, List[TestCaseResult]], model: str):
    for prompt_name, test_case_results in test_case_results_dict.items():
        print_test_case_result_table(test_type, prompt_name, test_case_results, model)

def print_test_case_result_table(test_type: str, prompt_name: str, test_case_results: List[TestCaseResult], model: str):

    # Bold prompt name
    print(f"Testing \033[1m{test_type}\033[0m with prompt \033[1m{prompt_name}\033[0m using \033[1m{model}\033[0m")

    table = PrettyTable()
    table.align = 'l'  # Left align all columns
    field_names = ['Test Name', 'Workflow Tags', 'Type Tags', 'Result']

    table.field_names = field_names

    for test_case_result in test_case_results:
        result_text = "Passed" if test_case_result.passed else "\033[91mFailed\033[0m"

        # Get the tags for the test. Smart debug tags are defined at the test level. 
        # Code gen tags are defined at the test case core level.
        workflow_tags = test_case_result.test.workflow_tags if isinstance(test_case_result.test, SmartDebugTestCase) or isinstance(test_case_result.test, AgentFindAndUpdateTestCase) else test_case_result.test.test_case_core.workflow_tags
        clean_workflow_tags = clean_tags_for_display(workflow_tags)

        clean_type_tags = clean_tags_for_display(test_case_result.test.type_tags)
        table.add_row([test_case_result.test.name, clean_workflow_tags, clean_type_tags, result_text])

    table.add_row(["" for _ in field_names])

    total_passed = sum(test_case_result.passed for test_case_result in test_case_results)
    total_tests = len(test_case_results)
    average_score = total_passed / total_tests

    table.add_row([f"Average Score", "", "", f"{average_score:.2f} ({total_passed}/{total_tests})"])

    print(table)

def clean_tags_for_display(tags: Sequence[str]) -> str:
    """
    Remove the [ and ] and quotes from the tags.
    """
    return ", ".join([tag.replace("[", "").replace("]", "").replace('"', "").replace("'", "") for tag in tags])

