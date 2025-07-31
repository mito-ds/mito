def get_streamlit_app_creation_message(notebook_content_string: str) -> str:
    
    return f"""Convert the following notebook content into a Streamlit app, following the guidelines I have shared with you.

{notebook_content_string}"""