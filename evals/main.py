import argparse
from evals.test_runners.code_gen_test_runner import run_chat_tests, run_inline_code_completion_tests
from evals.test_runners.smart_debugger_test_runner import run_smart_debug_tests

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run evaluation tests')
        
    # Require the user to specify if they want to run chat or smart debug tests
    parser.add_argument('--test_type', type=str, required=True, choices=['chat', 'inline_code_completion', 'smart_debug'], help='Type of tests to run (chat or smart_debug)')
    parser.add_argument('--test_name', type=str, help='Name of specific test to run')
    parser.add_argument('--prompt_name', type=str, help='Name of specific prompt to run')
    parser.add_argument('--tags', type=str, help='Comma separated list of tags to filter tests by')
    args = parser.parse_args()

    test_type = args.test_type
    test_name = args.test_name
    prompt_name = args.prompt_name
    tags = args.tags

    if test_type.lower() == "chat":
        run_chat_tests(test_name, prompt_name, tags)
    elif test_type.lower() == "inline_code_completion":
        run_inline_code_completion_tests(test_name, prompt_name, tags)
    elif test_type.lower() == "smart_debug":
        run_smart_debug_tests(test_name, prompt_name, tags)