

import os


def is_open_ai_credentials_available() -> bool:
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    return OPENAI_API_KEY is not None
    