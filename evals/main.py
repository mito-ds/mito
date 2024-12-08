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

    # tests_to_run = ALL_TESTS
    # if args.test_name:
    #     tests_to_run = [test for test in ALL_TESTS if test.name == args.test_name]
    #     if not tests_to_run:
    #         print(f"No test found with name: {args.test_name}")
    #         exit(1)

    # if args.tags:
    #     tests_to_run = [
    #         test for test in tests_to_run
    #         if (isinstance(test, CodeGenTestCase) and any(tag in args.tags for tag in test.test_case_core.tags)) or (
    #             isinstance(test, SmartDebugTestCase) and any(tag in args.tags for tag in test.tags)
    #         )
    #     ]
    #     if not tests_to_run:
    #         print(f"No tests found with tags: {args.tags}")
    #         exit(1)

    # print(f"Collected {len(tests_to_run)} tests")

    # # Filter prompts if prompt name provided
    # print("Collecting prompts...")
    # PROMPT_GENERATORS = CHAT_PROMPT_GENERATORS if test_type == "chat" else SMART_DEBUG_PROMPT_GENERATORS
    # prompt_generators_to_test = PROMPT_GENERATORS
    # if args.prompt_name:
    #     prompt_generators_to_test = [prompt for prompt in PROMPT_GENERATORS if prompt.prompt_name == args.prompt_name]
    #     if not prompt_generators_to_test:
    #         print(f"No prompt found with name: {args.prompt_name}")
    #         exit(1)
    # print(f"Collected {len(prompt_generators_to_test)} prompts")


    # # Mapping from prompt name to test results for each prompt we test
    # test_case_results: Dict[str, List[TestCaseResult]] = {}
    # for prompt_generator in prompt_generators_to_test:
    #     test_case_results[prompt_generator.prompt_name] = []
    #     for test in tests_to_run:
    #         if isinstance(test, SmartDebugTestCase):
    #             test_case_result = run_smart_debug_test(test, prompt_generator)
    #         elif isinstance(test, CodeGenTestCase):
    #             test_case_result = run_code_gen_test(test, prompt_generator)
    #         else:
    #             raise ValueError(f"Unknown test case type: {type(test)}")
    #         test_case_results[prompt_generator.prompt_name].append(test_case_result)

    # print_test_case_result_tables(test_case_results)
    