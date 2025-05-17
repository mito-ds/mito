## Evals for the Agent:

### How to add test cases:
1. Upload your existing notebook with the specific test case name to the test_case_inputs/input_notebooks folder. <br />
2. Upload your expected output notebook with the specific test case name to the test_case_inputs/expected_output_notebooks folder. <br />
3. Add an eval to test_cases.json. Provide the following details in the json file - <br />
    a. test_case_name - Name of the eval<br />
    b. user_task - The task you want the agent to execute<br />
    c. description - description of the eval<br />
    d. conversation_history_present - true/ false depending on whether a conversation history is present for the task<br />
    e. evals_to_test - List of all the tests you want to run. This is of the following format - <br />
        ```
        {
            "eval_name": "compare_next_response",
            "params": {
            "type": "cell_update", "cell_type": "code"
            }
        }
        ```

### How to run the evals:
1. Run the file handler.py. This will collect the evals from test_cases.json and evaluate them.
