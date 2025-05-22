import nbformat
import json
from execute_code import exec_code_and_get_globals_and_output
from agent_testing_utils import process_response_for_errors, process_notebook_update, create_prompt_from_code_and_user_task, get_history_from_response, get_test_case_mappings, get_eval_result_mappings, get_input_and_expected_output_nb

from default_system_prompt import create_agent_system_message_prompt
from run_test_case import get_openai_code
from eval_metrics import Evals

import warnings
warnings.filterwarnings("ignore", message="Importing 'mito_ai' outside a proper installation.")

DEFAULT_MODEL = "gpt-4.1"
TEST_CASES_PATH = "test_cases.json"
PROMPT = create_agent_system_message_prompt(True)

with open(TEST_CASES_PATH, "r", encoding="utf-8") as f:
    test_cases = json.load(f)


def execute_test_case(input_nb_path, user_task, output_nb_path, output_response_path, output_conversation_history_path, input_conversation_history_path=""):
    with open(input_nb_path, "r", encoding="utf-8") as f:
        input_nb = nbformat.read(f, as_version=4)
    existing_response_json = {"response": []}

    if input_conversation_history_path:
        with open(input_conversation_history_path, 'r', encoding='utf-8') as f:
            conversation_history = json.load(f)
    else:
        conversation_history = []

    output_nb = None
    cell_update_type = ""
    while cell_update_type!="finished_task":
        user_prompt = create_prompt_from_code_and_user_task(input_nb["cells"], user_task)
        agent_response = get_openai_code(user_task=user_prompt,
                                         model=DEFAULT_MODEL,
                                         system_prompt=PROMPT,
                                         conversation_history=conversation_history)

        agent_response = process_response_for_errors(agent_response)
        response_json = json.loads(agent_response)
        existing_response_json['response'].append(response_json)


        if response_json["type"]!="finished_task":
            output_nb, output_code = process_notebook_update(input_nb, response_json['cell_update'])
            globals, exec_output = exec_code_and_get_globals_and_output(output_code)
            user_task = create_prompt_from_code_and_user_task(output_nb, exec_output)

        conversation_history.append(get_history_from_response(response_json))
        input_nb = output_nb
        cell_update_type = response_json["type"]

    with open(output_response_path, "w", encoding="utf-8") as f:
        json.dump(existing_response_json, f, indent=4)

    with open(output_conversation_history_path, "w", encoding="utf-8") as f:
        json.dump(conversation_history, f, indent=4)

    with open(output_nb_path, "w", encoding="utf-8") as f:
        nbformat.write(output_nb, f)

    return output_nb, existing_response_json["response"], conversation_history


def run_evals(evals_to_test, input_nb, output_nb, expected_output_nb, list_of_responses, conversation_history):
    total_tests = len(evals_to_test)
    passed_tests = 0
    eval_class = Evals(input_nb,
                       output_nb,
                       expected_output_nb,
                       list_of_responses,
                       conversation_history
                       )
    test_case_mappings = get_test_case_mappings(eval_class)
    eval_result_mappings = get_eval_result_mappings()

    result_metrics = {}
    for evals in evals_to_test:
        test_case_name = evals["eval_name"]
        input_params = evals["params"]


        eval_function = test_case_mappings[test_case_name]
        result = eval_function(input_params)

        result_metrics[test_case_name] = eval_result_mappings[result]
        if result:
            passed_tests+=1
    return result_metrics, passed_tests, total_tests


def display_result_metrics(result_metrics_dict, passed_tests_dict):
    for eval in result_metrics_dict.keys():
        print(f"-----Eval {eval}-----")
        for test_case in result_metrics_dict[eval]:
            print(f"Result of {test_case}: {result_metrics_dict[eval][test_case]}")
        print(f"Total test cases passed: {passed_tests_dict[eval][0]} out of {passed_tests_dict[eval][1]}\n\n")



def test_case_handler():

    result_metrics_all = {}
    number_of_tests_all = {}

    print()
    for test in test_cases:
        test_case_name = test["test_case_name"]
        user_task = test["user_task"]
        evals_to_test = test["evals_to_test"]
        input_nb_path = f"test_case_inputs/input_notebooks/{test_case_name}.ipynb"
        expected_output_nb_path = f"test_case_inputs/expected_output_notebooks/{test_case_name}.ipynb"
        output_nb_path = f"test_case_outputs/observed_output_notebooks/{test_case_name}.ipynb"
        output_response_path = f"test_case_outputs/observed_agent_responses/{test_case_name}.json"
        output_conversation_history_path = f"test_case_outputs/conversation_histories/{test_case_name}.json"

        print(f"Executing {test_case_name}")
        if test["conversation_history_present"]:
            input_conversation_history_path = f"test_case_inputs/conversation_histories/{test_case_name}.json"
            output_nb, list_of_responses, conversation_history = execute_test_case(input_nb_path, user_task, output_nb_path, output_response_path, output_conversation_history_path, input_conversation_history_path)
        else:
            output_nb, list_of_responses, conversation_history = execute_test_case(input_nb_path, user_task, output_nb_path, output_response_path, output_conversation_history_path)

        input_nb, expected_output_nb = get_input_and_expected_output_nb(input_nb_path, expected_output_nb_path)
        print(f"Evaluating {test_case_name}")
        result_metrics, passed_tests, total_tests = run_evals(evals_to_test, input_nb, output_nb, expected_output_nb, list_of_responses, conversation_history)
        result_metrics_all[test_case_name] = result_metrics
        number_of_tests_all[test_case_name] = [passed_tests, total_tests]
    print()
    display_result_metrics(result_metrics_all, number_of_tests_all)

test_case_handler()
