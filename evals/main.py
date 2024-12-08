import argparse
import pandas as pd
from typing import Dict, List
from evals.ai_api_calls.get_open_ai_completion import get_open_ai_completion
from evals.test_runners.code_gen_test_runner import run_code_gen_test, run_code_gen_tests
from evals.prompts.chat_prompts import CHAT_PROMPT_GENERATORS
from evals.prompts.smart_debug_prompts import SMART_DEBUG_PROMPT_GENERATORS
from evals.eval_types import CodeGenTestCase, SmartDebugTestCase, TestCaseResult
from evals.test_runners.smart_debugger_test_runner import run_smart_debug_test, run_smart_debug_tests
from evals.utils import are_globals_equal, get_globals_to_compare, get_script_from_cells, print_test_case_result_tables
from evals.test_cases.smart_debug_tests import *

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run evaluation tests')
        
    # Require the user to specify if they want to run chat or smart debug tests
    parser.add_argument('--test-type', type=str, required=True, choices=['chat', 'smart_debug'], help='Type of tests to run (chat or smart_debug)')
    parser.add_argument('--test-name', type=str, help='Name of specific test to run')
    parser.add_argument('--prompt-name', type=str, help='Name of specific prompt to run')
    parser.add_argument('--tags', type=str, help='Comma separated list of tags to filter tests by')
    args = parser.parse_args()

    test_type = args.test_type
    test_name = args.test_name
    prompt_name = args.prompt_name
    tags = args.tags

    if test_type == "chat":
        run_code_gen_tests(test_name, prompt_name, tags)
    elif test_type == "smart_debug":
        run_smart_debug_tests(test_name, prompt_name, tags)
