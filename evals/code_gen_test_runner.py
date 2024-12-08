from evals.ai_api_calls.get_open_ai_completion import get_open_ai_completion
from evals.eval_types import PromptGenerator, CodeGenTestCase, TestCaseResult
from evals.utils import are_globals_equal, get_globals_to_compare, get_script_from_cells


def run_code_gen_test(test: CodeGenTestCase, prompt_generator: PromptGenerator) -> TestCaseResult:
    print(f"Running test: {test.name}")
                
    # Get the script from the cells
    current_cell_contents_script = get_script_from_cells(test.test_case_core.notebook_state.cell_contents)

    # Get the expected code script 
    expected_code = current_cell_contents_script + "\n" + test.test_case_core.expected_code

    # Create the actual code script produced by the LLM
    prompt = prompt_generator.get_prompt(test.user_input, test.test_case_core.notebook_state)
    ai_generated_code = get_open_ai_completion(prompt)
    print(f"AI generated code:\n{ai_generated_code}")
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
        print("Test Failed: ")
        print(f"Expected code:\n{expected_code}")
        print(f"\nActual code:\n{actual_code}")
        print(f"Error: {e}")
        return TestCaseResult(test=test, passed=False)

    expected_globals = get_globals_to_compare(expected_globals, test.test_case_core.variables_to_compare)
    actual_globals = get_globals_to_compare(actual_globals, test.test_case_core.variables_to_compare)

    return TestCaseResult(test=test, passed=are_globals_equal(expected_globals, actual_globals))
