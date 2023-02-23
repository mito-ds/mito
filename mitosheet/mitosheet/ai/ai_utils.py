

import ast
import os
from typing import Optional

def is_open_ai_credentials_available() -> bool:
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    return OPENAI_API_KEY is not None


def fix_up_missing_imports(code: str) -> str:
    if 'np.' in code and 'import numpy as np' not in code:
        code = 'import numpy as np\n' + code
    if 'pd.' in code and 'import pandas as pd' not in code:
        code = 'import pandas as pd\n' + code

    return code

    

def fix_dataframe_name(code: str, new_df_name: str) -> str:
    """
    This fixes common issues in AI generated code including:
    1. If the final value is a dataframe, then it gives this dataframe a name 
    2. If np or pd is used, then we import them    
    """

    ast_before = ast.parse(code)
    last_expression = ast_before.body[-1]

    # (1)
    last_expression_string = ast.unparse([last_expression]) # type: ignore
    code = code.replace(last_expression_string, f'{new_df_name} = {last_expression_string}')

    return code

