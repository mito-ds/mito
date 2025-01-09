#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE.
"""
The mitosheet package is distributed under the mitosheet
package names on pip.
"""
import json
import os
from glob import glob
from pathlib import Path
from typing import List, Tuple
from setuptools import find_packages, setup

HERE = Path(__file__).parent.resolve()
package_json = json.loads(open('package.json').read())
lab_path = Path(HERE, 'mitosheet', 'labextension')

data_files_spec = [
    # Jupyter extension data files
    ("share/jupyter/labextensions/mitosheet", str(lab_path), "**"),
    ("share/jupyter/labextensions/mitosheet", str(HERE), "install.json"),
]

def get_data_files_from_data_files_spec(
    data_specs: List[Tuple[str, str, str]],
):
    """
    Given tuples of (data_file_path, directory_to_search, pattern_to_find),
    this function will return a list of tuples of (data_file_path, [files])
    in the format that setuptools expects.
    """
    file_data = {}
    for (data_file_path, directory_to_search, pattern_to_find) in data_specs or []:
        # Get the directory to search ready
        if os.path.isabs(directory_to_search):
            directory_to_search = os.path.relpath(directory_to_search)
        directory_to_search = directory_to_search.rstrip("/")
        # Get all non-directory files that match the pattern, searching recursively
        files = [
            f for f in glob(
                Path().joinpath(directory_to_search, pattern_to_find).as_posix(), 
                recursive=True
            ) if not os.path.isdir(f)
        ]
        offset = len(directory_to_search) + 1
        for file_name in files:
            relative_path = str(Path(file_name).parent)[offset:]
            full_data_file_path = Path().joinpath(data_file_path, relative_path).as_posix()
            if full_data_file_path not in file_data:
                file_data[full_data_file_path] = []
            file_data[full_data_file_path].append(file_name)
    # Turn to list and sort by length, to be consistent (and maybe cuz we need to for folder creation?)
    data_files = sorted(file_data.items(), key=lambda x: len(x[0]))
    
    return data_files

data_files = get_data_files_from_data_files_spec(data_files_spec)   


# Read the content of README.md for the long description
with open(HERE / "README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup_args = dict(
    name                    = 'mitosheet',
    version                 = package_json["version"],
    url                     = package_json["homepage"],
    author                  = package_json["author"]["name"],
    author_email            = package_json["author"]["email"],
    description             = package_json["description"],
    license                 = "GNU Affero General Public License v3",
    long_description        = long_description,
    long_description_content_type = "text/markdown",
    packages                 = find_packages(exclude=['deployment']),
    include_package_data     = True,
    package_data             = {'': ['*.js', '*.css', '*.html']},
    data_files               = data_files,
    install_requires=[        
        "jupyterlab~=4.0",
        # We allow users to have many versions of pandas installed. All functionality should
        # work, with the exception of Excel import, which might require additonal dependencies
        'pandas>=0.24.2',
        'analytics-python',
        # Graphing libraries
        'plotly>=4.14.3',
        'chardet>=3.0.4',
        # For XLSX, reading - we don't fix so works on all python versions
        'openpyxl',
        'packaging'
    ],
    extras_require = {
        'test': [
            'pytest',
            'flake8',
            'types-chardet',
            'types-requests',
            'mypy',
            'pytest_httpserver',
        ],
        'deploy': [
            'wheel==0.42.0', 
            'twine==5.1.1',
            'setuptools==68.0.0'
        ],
        'streamlit': [
            'streamlit>=1.24,<1.32',
        ],
        'optional_feature_dependencies': [
            # According to this documentation (https://github.com/snowflakedb/snowflake-connector-python),
            # snowflake-connect-python requires at least Python 3.7
            'snowflake-connector-python[pandas]; python_version>="3.7"',
            'streamlit>=1.24,<1.32',
            'dash>=2.9',
            "flask"
        ]
    },
    zip_safe                = False,
    python_requires         = ">=3.8",
    platforms               = "Linux, Mac OS X, Windows",
    classifiers             = [
        "License :: OSI Approved :: GNU Affero General Public License v3",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Framework :: Jupyter",
        "Framework :: Jupyter :: JupyterLab",
        "Framework :: Jupyter :: JupyterLab :: 4",
        "Framework :: Jupyter :: JupyterLab :: Extensions",
        "Framework :: Jupyter :: JupyterLab :: Extensions :: Prebuilt"
    ],
)

if __name__ == '__main__':
    setup(**setup_args)