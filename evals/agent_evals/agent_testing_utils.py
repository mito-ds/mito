import os
import nbformat
import json
from testing_constants import (JUPYTER_NOTEBOOK_SECTION_HEADING,
                               VARIABLES_SECTION_HEADING,
                               FILES_SECTION_HEADING,
                               USER_TASK_HEADING_SECTION)


def get_existing_response_history(output_path):
    if os.path.exists(output_path):
        with open(output_path, "r", encoding="utf-8") as f:
            response_history = json.load(f)
    else:
        response_history = {"response": []}
    return response_history


def process_notebook_update(notebook, cell_update):
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
    print(all_code)
    return notebook, all_code


def process_response_for_errors(response):
    response = response.replace('"get_cell_output_cell_id": None', '"get_cell_output_cell_id": null')
    return response


def create_prompt_from_code_and_user_task(code, user_task, variables="", files=""):
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
    conversation_history = [
            {"role": "system", "content": system_prompt},
        ]

    return conversation_history

def get_history_from_response(response):
    message = response["message"]
    cell_type = response["cell_update"]["cell_type"]
    if cell_type == "code":
        code = response["cell_update"]["code"]
        content = f"""```python\n{code}\n\n{message}"""
    else:
        content=message
    return {"role": "assistant", "content": content}


