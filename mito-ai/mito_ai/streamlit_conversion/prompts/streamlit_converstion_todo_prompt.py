

def get_streamlit_conversion_todo_prompt(todo_placeholder: str) -> str:
    """
    This prompt is used to convert the TODOs from the agent's response into a list of TODOs.
    """
    return f"""You've started converting a Jupyter notebook into a Streamlit app. 

Your next job is to fix the following TODO: 

{todo_placeholder}

"""