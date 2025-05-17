import os
import nbformat
import json
from testing_constants import (JUPYTER_NOTEBOOK_SECTION_HEADING,
                               VARIABLES_SECTION_HEADING,
                               FILES_SECTION_HEADING,
                               USER_TASK_HEADING_SECTION)


def process_notebook_update(notebook, cell_update):
    """Create the output notebook based on the specified cell update"""
    cell_type = cell_update["cell_type"]
    code = cell_update["code"]
    update_type = cell_update["type"]

    new_cell = nbformat.v4.new_code_cell(source=code) if cell_type == "code" else nbformat.v4.new_markdown_cell(
        source=code)

    if update_type == "new":
        index = cell_update["index"]
        notebook.cells.insert(index, new_cell)
    elif update_type == "modification":
        target_cell_id = cell_update["id"]
        for cell in notebook.cells:
            if cell.get("id") == target_cell_id:
                cell["source"] = code
                break
    else:
        raise ValueError(f"Unsupported update type: {update_type}")

    all_code = "\n\n".join(
        cell.source for cell in notebook.cells if cell.cell_type == "code"
    )
    # print(all_code)
    return notebook, all_code


def process_response_for_errors(response):
    """Agent sometimes does not give the response in the correct json format. This function corrects those errors"""
    response = response.replace(': None', ': null')
    return response


def create_prompt_from_code_and_user_task(code, user_task, variables="", files=""):
    """Based on the code and the task provided by the user, create a prompt similar to what is mentioned in the agent prompt"""
    prompt = f"""
    {JUPYTER_NOTEBOOK_SECTION_HEADING}
    [
        {code},
    ]

    {VARIABLES_SECTION_HEADING}
    {variables}

    {FILES_SECTION_HEADING}
    {files}

    {USER_TASK_HEADING_SECTION}
    {user_task}
    """

    return prompt

def start_new_conversation_history(system_prompt):
    """Function to get new conversation history"""
    conversation_history = [
            {"role": "system", "content": system_prompt},
        ]
    return conversation_history

def get_history_from_response(response):
    """Based on the code and message provided by the agent, return respective conversation history"""
    message = response["message"]
    if response["type"]=="finished_task":
        content = message
    else:
        cell_type = response["cell_update"]["cell_type"]
        if cell_type == "code":
            code = response["cell_update"]["code"]
            content = f"""```python\n{code}\n```\n\n{message}"""
        else:
            content=message
    return {"role": "assistant", "content": content}


def get_test_case_mappings(eval_instance):
    """Mappings of all eval functions in the Evals class"""
    return {
        name: getattr(eval_instance, name)
        for name in dir(eval_instance)
        if callable(getattr(eval_instance, name)) and not name.startswith("__")
    }

def get_eval_result_mappings():
    """Mappings of the eval results"""
    return {True: "PASS", False: "FAIL"}

def get_input_and_expected_output_nb(input_nb_path, expected_output_nb_path):
    """Returns input notebook and expected output notebook from paths"""
    with open(input_nb_path, "r", encoding="utf-8") as f:
        input_nb = nbformat.read(f, as_version=4)
    with open(expected_output_nb_path, "r", encoding="utf-8") as f:
        expected_output_nb = nbformat.read(f, as_version=4)
    return input_nb, expected_output_nb
