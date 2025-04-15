# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from pathlib import Path
import shutil

def get_downloads_folder() -> Path:
    return Path(os.path.join(os.path.expanduser('~'), 'Downloads'))

def get_src_folder() -> Path:
    return Path('../src/')

def get_step_performers_folder() -> Path:
    return Path('../mitosheet/step_performers')

def get_code_chunk_folder() -> Path:
    return Path('../mitosheet/code_chunks')

def get_test_folder() -> Path:
    return Path('../mitosheet/tests')

def get_api_folder() -> Path:
    return Path('../mitosheet/api')

def create_folder(path_to_folder: Path) -> None:
    if os.path.exists(path_to_folder):
        clear = input(f'{path_to_folder} already exists, do you want to clear it?: [y/n]').lower().startswith('y')
        if clear:
            shutil.rmtree(path_to_folder)
        else:
            print("Ok... exiting")
            exit(1)

    os.mkdir(path_to_folder)


# This function actually writes the given code to the given file
def write_python_code_file(path_to_file: Path, code: str) -> None:
    if os.path.exists(path_to_file):
        clear = input(f'{path_to_file} already exists, do you want to clear it?: [y/n]').lower().startswith('y')
        if clear:
            os.remove(path_to_file)
        else:
            print("Ok... exiting")
            exit(1)
    
    with open(path_to_file, 'w+') as f:
        f.write(code)
