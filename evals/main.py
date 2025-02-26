import argparse
import time
from evals.test_runners.agent_test_runner import run_agent_tests
from evals.test_runners.code_gen_test_runner import run_chat_tests, run_inline_code_completion_tests
from evals.test_runners.smart_debugger_test_runner import run_smart_debug_tests

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run evaluation tests')
        
    # Require the user to specify if they want to run chat or smart debug tests
    parser.add_argument('--test_type', type=str, required=True, choices=['chat', 'inline_code_completion', 'smart_debug', 'agent'], help='Type of tests to run (chat or smart_debug)')
    parser.add_argument('--test', type=str, help='Name of specific test to run')
    parser.add_argument('--prompt', type=str, help='Name of specific prompt to run')
    parser.add_argument('--tags', type=str, help='Comma separated list of tags to filter tests by')
    parser.add_argument('--model', type=str, help='Model to use for the tests')
    args = parser.parse_args()

    test_type = args.test_type
    test_name = args.test
    prompt_name = args.prompt
    tags = args.tags
    model = args.model

    time_start = time.time()
    if test_type.lower() == "chat":
        run_chat_tests(test_name, prompt_name, tags, model)
    elif test_type.lower() == "inline_code_completion":
        run_inline_code_completion_tests(test_name, prompt_name, tags, model)
    elif test_type.lower() == "smart_debug":
        run_smart_debug_tests(test_name, prompt_name, tags, model)
    elif test_type.lower() == 'agent':
        run_agent_tests(test_name, prompt_name, tags, model)
    time_end = time.time()
    print(f"Time taken: {time_end - time_start} seconds")