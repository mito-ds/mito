import nbformat
import json
from execute_code import exec_code_and_get_globals_and_output
from agent_testing_utils import get_existing_response_history, process_response_for_errors, process_notebook_update, create_prompt_from_code_and_user_task, start_new_conversation_history, get_history_from_response

from default_system_prompt import create_agent_system_message_prompt
from run_test_case import get_openai_code_and_conversation_history

DEFAULT_MODEL = "gpt-4.1"
TEST_CASES_PATH = "test_cases.json"
PROMPT = create_agent_system_message_prompt()

with open(TEST_CASES_PATH, "r", encoding="utf-8") as f:
    test_cases = json.load(f)


def execute_test_case(input_nb_path, user_task, output_nb_path, output_response_path, conversation_history_path=""):
    with open(input_nb_path, "r", encoding="utf-8") as f:
        input_nb = nbformat.read(f, as_version=4)
    existing_response_json = get_existing_response_history(output_response_path)

    if conversation_history_path:
        with open(conversation_history_path, 'r', encoding='utf-8') as f:
            conversation_history = json.load(f)
    else:
        conversation_history = start_new_conversation_history(user_task, PROMPT)


    cell_update_type = ""
    while cell_update_type!="finished_task":
        print(cell_update_type)
        conversation_history.append({"role":"user", "content":user_task})
        agent_response = get_openai_code_and_conversation_history(user_task=user_task,
                                                                  model=DEFAULT_MODEL,
                                                                  system_prompt=PROMPT,
                                                                  conversation_history=conversation_history)

        agent_response = process_response_for_errors(agent_response)
        response_json = json.loads(agent_response)
        existing_response_json['response'].append(response_json)

        output_nb, output_code = process_notebook_update(input_nb, response_json['cell_update'])
        globals, exec_output = exec_code_and_get_globals_and_output(output_code)

        conversation_history.append(get_history_from_response(response_json))

        input_nb = output_nb
        cell_update_type = response_json["type"]
        user_task = create_prompt_from_code_and_user_task(output_nb, exec_output)

    with open(output_response_path, "w", encoding="utf-8") as f:
        json.dump(existing_response_json, f, indent=4)

    with open(output_nb_path, "w", encoding="utf-8") as f:
        nbformat.write(output_nb, f)


def test_case_handler():
    for test in test_cases:
        input_nb_path = test["input_notebook_path"]
        user_task = test["user_task"]
        output_nb_path = test["output_notebook_path"]
        output_response_path = test["output_response_path"]
        if "input_conversation_history" in test:
            conversation_history_path = test["input_conversation_history"]
            execute_test_case(input_nb_path, user_task, output_nb_path, output_response_path, conversation_history_path)
        else:
            execute_test_case(input_nb_path, user_task, output_nb_path, output_response_path)
