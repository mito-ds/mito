import copy
from typing import Dict, List, Optional
from evals.ai_api_calls.get_open_ai_completion import get_open_ai_completion
from evals.asserts.equal_globals import assert_equal_globals, get_globals_to_compare
from evals.asserts.equal_outputs import assert_equal_outputs
from evals.eval_types import DebugPromptGenerator, SmartDebugTestCase, TestCaseResult
from evals.prompts.smart_debug_prompts import SMART_DEBUG_PROMPT_GENERATORS
from evals.test_cases.smart_debug_tests import SMART_DEBUG_TESTS
from evals.test_runners.utils import exec_code_and_get_globals_and_output
from evals.utils import get_script_from_cells, print_test_case_result_tables
from IPython.core.interactiveshell import InteractiveShell
from io import StringIO
import sys
import re


def run_smart_debug_tests(test_name: Optional[str], prompt_name: Optional[str], tags: Optional[List[str]], model: Optional[str]):

    tests_to_run = SMART_DEBUG_TESTS
    if test_name:
        tests_to_run = [test for test in SMART_DEBUG_TESTS if test.name == test_name]
        if not tests_to_run:
            print(f"No test found with name: {test_name}")
            exit(1)

    if tags:
        tests_to_run = [test for test in tests_to_run if any(tag in (test.workflow_tags or test.type_tags) for tag in tags)]
        if not tests_to_run:
            print(f"No tests found with tags: {tags}")
            exit(1)

    print(f"Collected {len(tests_to_run)} tests")

    # Filter prompts if prompt name provided
    print("Collecting prompts...")
    prompt_generators_to_test = SMART_DEBUG_PROMPT_GENERATORS
    if prompt_name:
        prompt_generators_to_test = [prompt for prompt in SMART_DEBUG_PROMPT_GENERATORS if prompt.prompt_name == prompt_name]
        if not prompt_generators_to_test:
            print(f"No prompt found with name: {prompt_name}")
            exit(1)
    
    print(f"Collected {len(prompt_generators_to_test)} prompts")

    # Get the default model if no model is provided
    model = prompt_generators_to_test[0].get_default_model() if model is None else model

    # Mapping from prompt name to test results for each prompt we test
    test_case_results: Dict[str, List[TestCaseResult]] = {}
    for prompt_generator in prompt_generators_to_test:
        test_case_results[prompt_generator.prompt_name] = []
        for test in tests_to_run:
            test_case_result = run_smart_debug_test(test, prompt_generator, model)
            test_case_results[prompt_generator.prompt_name].append(test_case_result)

    print_test_case_result_tables("smart_debug", test_case_results, model)


def run_smart_debug_test(test: SmartDebugTestCase, prompt_generator: DebugPromptGenerator, model: Optional[str]) -> TestCaseResult:
    print(f"Running test: {test.name}")
                
    # Create a copy of the notebook state that includes the invalid code.
    script_without_invalid_code = get_script_from_cells(test.notebook_state.cell_contents)

    invalid_notebook_state = copy.deepcopy(test.notebook_state)
    
    # Add the invalid code to a new cell. This is fine because we're converting the whole thing
    # into a single script when we execute it anyways. 
    invalid_notebook_state.cell_contents.append(test.invalid_code)
    invalid_code_cells_script = get_script_from_cells(invalid_notebook_state.cell_contents, include_current_cell=True)
    
    # Exec the invalid code and get the error message
    error_message = get_structured_error(invalid_code_cells_script)

    #print(f"Error message: {error_message}")
    if error_message is None:
        print("Broken Test: Test did not produce an error.")
    
    # Ask the AI to correct the error
    # Make sure to use the invalid_notebook_state so that the prompt can include the 
    # invalid code in the prompt. 
    prompt = prompt_generator.get_prompt(error_message, invalid_notebook_state)
    ai_generated_code = get_open_ai_completion(prompt, model)
    actual_code = script_without_invalid_code + "\n" + ai_generated_code

    # Get the expected code script 
    expected_code = script_without_invalid_code + "\n" + test.correct_code

    try:
        expected_globals, expected_output = exec_code_and_get_globals_and_output(expected_code)
        actual_globals, actual_output = exec_code_and_get_globals_and_output(actual_code)
    except Exception as e:
        # Fail early if we can't execute the code
        print(f"Failed to execute code with error: {e}")
        return TestCaseResult(test=test, passed=False)

    equal_globals = assert_equal_globals(expected_globals, actual_globals, test.variables_to_compare)
    equal_outputs = assert_equal_outputs(expected_output, actual_output)

    passed = equal_globals and equal_outputs

    if not passed:
        print(f"Test {test.name} failed")
        print(f"Expected Code: {expected_code}")
        print(f"Actual Code: {actual_code}\n")

    if not equal_globals:
        print("Globals are not equal")
        print(f"Expected globals: {get_globals_to_compare(expected_globals, test.variables_to_compare)}")
        print(f"Actual globals: {get_globals_to_compare(actual_globals, test.variables_to_compare)}")
        print(f"Variables to compare: {test.variables_to_compare}\n")

    if not equal_outputs:
        print("Outputs are not equal")
        print(f"Expected output: {expected_output}")
        print(f"Actual output: {actual_output}\n")

    return TestCaseResult(test=test, passed=passed)


def get_structured_error(code):
    ipython = InteractiveShell.instance()
    stdout_capture = StringIO()
    original_stdout = sys.stdout
    
    try:
        sys.stdout = stdout_capture
        result = ipython.run_cell(code)
        
        if result.error_before_exec or result.error_in_exec:
            full_traceback = strip_ansi_codes(stdout_capture.getvalue())
            
            # Close the stdout capture
            sys.stdout = original_stdout
            stdout_capture.close()
            
            lines = full_traceback.split('\n')
            
            filtered_lines = []
            capturing = False
            
            for line in lines:
                # Always include error headers
                if '--------------------' in line:
                    filtered_lines.append(line)
                    continue
                
                # Start capturing when we see a Cell block
                if line.strip().startswith('Cell In['):
                    capturing = True
                    filtered_lines.append(line)
                    continue
                
                # Keep capturing until we hit an empty line
                if capturing:
                    if line.strip() == '':
                        filtered_lines.append('')
                        capturing = False
                    else:
                        filtered_lines.append(line)
                        
            # Always include the final, non-empty line
            # This is the last line that is not ""
            non_empty_lines = [line for line in lines if line != ""]
            filtered_lines.append(non_empty_lines[-1])
            
            sys.stdout = original_stdout  # Restore stdout before printing
            return '\n'.join(filtered_lines)
        else: 
            sys.stdout = original_stdout  # Restore stdout before printing
            print("Test Failure 1: No error was produced")
            return None
    except Exception as e:
        sys.stdout = original_stdout  # Restore stdout before printing
        print(f"Test Failure 2: Error running code in IPython shell: {e}")
        return None
    finally:
        sys.stdout = original_stdout
        stdout_capture.close()

def strip_ansi_codes(text):
    """Remove ANSI escape sequences from text"""
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    return ansi_escape.sub('', text)