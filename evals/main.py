import argparse
import pandas as pd
from typing import Dict, List
from evals.ai_api_calls.get_open_ai_completion import get_open_ai_completion
from evals.prompts import PROMPT_GENERATORS
from evals.eval_types import TestCase, TestCaseResult
from evals.utils import are_globals_equal, get_globals_to_compare, get_script_from_cells, print_test_case_result_tables
from evals.test_cases import TESTS

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run evaluation tests')
    parser.add_argument('--test-name', type=str, help='Name of specific test to run')
    parser.add_argument('--prompt-name', type=str, help='Name of specific prompt to run')
    parser.add_argument('--tags', type=str, help='Comma separated list of tags to filter tests by')
    args = parser.parse_args()

    # Filter tests if test name provided
    print("Collecting tests...")

    tests_to_run = TESTS
    if args.test_name:
        tests_to_run = [test for test in TESTS if test.name == args.test_name]
        if not tests_to_run:
            print(f"No test found with name: {args.test_name}")
            exit(1)

    if args.tags:
        tests_to_run = [test for test in tests_to_run if any(tag in args.tags for tag in test.tags)]
        if not tests_to_run:
            print(f"No tests found with tags: {args.tags}")
            exit(1)

    print(f"Collected {len(tests_to_run)} tests")

    # Filter prompts if prompt name provided
    print("Collecting prompts...")
    prompt_generators_to_test = PROMPT_GENERATORS
    if args.prompt_name:
        prompt_generators_to_test = [prompt for prompt in PROMPT_GENERATORS if prompt.prompt_name == args.prompt_name]
        if not prompt_generators_to_test:
            print(f"No prompt found with name: {args.prompt_name}")
            exit(1)
    print(f"Collected {len(prompt_generators_to_test)} prompts")


    # Mapping from prompt name to test results for each prompt we test
    test_case_results: Dict[str, List[TestCaseResult]] = {}
    for prompt_generator in prompt_generators_to_test:
        test_case_results[prompt_generator.prompt_name] = []
        for test in tests_to_run:

            print(f"Running test: {test.name}")
                
            # Get the script from the cells
            current_cell_contents_script = get_script_from_cells(test.notebook_state.cell_contents)

            # Get the expected code script 
            expected_code = current_cell_contents_script + "\n" + test.expected_code

            # Create the actual code script produced by the LLM
            prompt = prompt_generator.get_prompt(test.user_input, test.notebook_state)
            ai_generated_code = get_open_ai_completion(prompt)
            actual_code = current_cell_contents_script + "\n" + ai_generated_code

            # So that we can compare the results of the two scripts, create global context for 
            # each script. When calling exec, the globals are updated in place.
            expected_globals = {}
            actual_globals = {}

            try:
                exec(expected_code, expected_globals)
                exec(actual_code, actual_globals)
            except Exception as e:
                # Fail early if we can't execute the code
                test_case_result = TestCaseResult(test=test, passed=False)
                test_case_results[prompt_generator.prompt_name].append(test_case_result)
                print("Test Failed: ")
                print(f"Expected code:\n{expected_code}")
                print(f"\nActual code:\n{actual_code}")
                print(f"Error: {e}")
                continue

            expected_globals = get_globals_to_compare(expected_globals, test.variables_to_compare)
            actual_globals = get_globals_to_compare(actual_globals, test.variables_to_compare)

            test_case_result = TestCaseResult(test=test, passed=are_globals_equal(expected_globals, actual_globals))
            test_case_results[prompt_generator.prompt_name].append(test_case_result)

    print_test_case_result_tables(test_case_results)
    