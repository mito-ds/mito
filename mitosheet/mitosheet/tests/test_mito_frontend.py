import subprocess
import os

import pandas as pd
import pytest

from mitosheet.mito_backend import get_mito_frontend_code
from mitosheet.steps_manager import StepsManager
from mitosheet.tests.test_utils import create_mito_wrapper_dfs


# See here: https://www.tutorialspoint.com/json_simple/json_simple_escape_characters.htm
STRINGS_TO_TEST = [
    ('	'),
    ('Normal'),
    ('space in the text'),
    ('学	医'),
    ('this is \\text'),
    ('\n'),
    ('\t'),
    ('\r'),
    ('`'),
    ("'"),
    ('"'),
    ('&'),
    ('\b'),
    ('\f'),
]


def write_test_code(file: str, string: str) -> None:
    df = pd.DataFrame({'A': [string]})
    mito = create_mito_wrapper_dfs(df)
    code = get_mito_frontend_code('a', 'a', 'a', mito.mito_backend)
    with open(file, 'w+') as f:
        f.write(code)

# Skip if not not defined
@pytest.mark.parametrize('string', STRINGS_TO_TEST)
def test_mito_frontend_is_valid_code(tmp_path, string):
    
    file = tmp_path / 'out.js'
    write_test_code(file, string)
    p = subprocess.Popen(['node', file,], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    (_, err) = p.communicate()
    p.wait()

    # we want to make sure that there are no failures in parsing, that it runs up to the 
    # ReferenceError: document is not defined 
    assert 'SyntaxError' not in err.decode('utf-8') 
    assert 'ReferenceError' in err.decode('utf-8') 