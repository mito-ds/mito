#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, List
from mitosheet.types import CodeSnippet, StepsManagerType
import os
import requests as req
from mitosheet.transpiler.transpile_utils import TAB, NEWLINE_TAB, NEWLINE

MITO_CONFIG_KEY_CODE_SNIPPETS_VERSION = 'MITO_CONFIG_CODE_SNIPPETS_VERSION'
MITO_CONFIG_KEY_CODE_SNIPPETS_URL = 'MITO_CONFIG_CODE_SNIPPETS_URL'

DEFAULT_CODE_SNIPPETS: List[CodeSnippet] = [
        {
                'Id': 'mito-code-snippet:calculate-correlation-matrix',
                'Name': 'Calculate correlation matrix',
                'Description': 'Compute pairwise correlation of columns, excluding NA/null values.',
                'Code': [
                        "REPLACE_WITH_DATAFRAME_NAME.corr()" 
                ]
        },
        {
                'Id': 'mito-code-snippet:send-email-using-outlook',
                "Name": "Send email using Outlook (Windows)", 
                "Description": "Automatically send email with embedded dataframe",
                "Code": [
                                "import win32com.client",
                                "",
                                "outlook = win32com.client.Dispatch('outlook.application')",
                                "mail = outlook.CreateItem(0)",
                                "mail.To = ['REPLACE_WITH_EMAIL_1', 'REPLACE_WITH_EMAIL_2']",
                                "mail.HTMLBody = REPLACE_WITH_DATAFRAME_NAME.to_html()",
                                "",
                                "# Send the email",
                                "mail.Send()"
                ],
        },
        {
                'Id': 'mito-code-snippet:create-dataframe-from-clipboard',
                'Name': 'Create dataframe from clipboard',
                'Description': 'Read the data that is copied to you clipboard into a pandas dataframe',
                'Code': [
                        "import pandas as pd",
		        "df = pd.read_clipboard()"
                ]
        },
        {
                'Id': 'mito-code-snippet:read-csv-files-from-folder',
                "Name": "Read all CSV files from folder", 
                "Description": "Read the CSV files from a folder, and concate them into a single dataframe.",
                "Code": [
                        "import pandas as pd",
                        "import glob",
                        "import os",
                        "",
                        "path = 'REPLACE_WITH_PATH_TO_FOLDER'",
                        "all_files = glob.glob(os.path.join(path, '*.csv'))",
                        "df = pd.concat((pd.read_csv(f) for f in all_files), ignore_index=True)"
                ]
        },
        {
                'Id': 'mito-code-snippet:diff-between-dataframe',
                "Name": "Find differences between dataframes", 
                "Description": "Subtract one dataframe from another by row",
                "Code": [
                        "df3 = REPLACE_WITH_DATAFRAME_1 - REPLACE_WITH_DATAFRAME_2",
                        "mitosheet.sheet(df3)"
                ]
        } 
]

def get_code_snippets_format_error(code_snippets) -> str:
        # TODO: I don't think I can return an error from the API, so instead, we can update the API to either return the code snippets or an error message
        # The errors could be:
        # 1. The errors created here
        # 2. The failed request error. 
        """
        Version 1 of code snippets has the following type:
        [
                {
                        Id: str
                        Name: str
                        Description: str
                        Code: List[str]
                },
                {
                        Id: str
                        Name: str
                        Description: str
                        Code: List[str]
                },
        ]
        """
        correct_code_snippets_type = f"[{{{NEWLINE_TAB}Id: str, {NEWLINE_TAB}Name: str, {NEWLINE_TAB}Description: str, {NEWLINE_TAB}Code: List[str]{NEWLINE}}}]"

        if type(code_snippets) != list:
                return f"Custom code snippets has type {type(code_snippets)}, but should be a list of objects with keys -> {correct_code_snippets_type}"
        
        test = [{
                'Id': 2,
                'Description': 'THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTTHIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATT THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED THIS IS A LOT OF TEXT. HOW IS IT FORMATTEDED THIS IS A LOT OF TEXT. HOW IS IT FORMATTEDED THIS IS A LOT OF TEXT. HOW IS IT FORMATTED',
                'Code': ['123', 5]
        }]
        code_snippets: List[CodeSnippet] = test
        for code_snippet in code_snippets:
                if type(code_snippet) != dict:
                        return f"At least one of the code snippets has type {type(code_snippet)}, but should be an object with keys -> {correct_code_snippets_type}"

                id = code_snippet.get('Id', None)
                name = code_snippet.get('Name', None)
                description = code_snippet.get('Description', None)
                code = code_snippet.get('Code', None)

                errors = []
                if id is None:
                        errors.append('Id does not exist in code snippet')
                if id is not None and type(id) != str:
                        errors.append('Id is not a string')
                if name is None:
                        errors.append('Name does not exist in code snippet')
                if name is not None and type(name) != str:
                        errors.append('Name is not a stirng')
                if description is None:
                        errors.append('Description does not exist in code snippet')
                if description is not None and type(description) != str:
                        errors.append('Description is not a string')
                if code is None:
                        errors.append("Code does not exist in code snippet")
                if code is not None and type(code) != list:
                        errors.append("Code is not a list")
                if code is not None and type(code) == list:
                        for line in code:
                                if type(code) != str:
                                        errors.append("each line of code is not a string")
                                        break

                incorrectly_formatted_values = (f'{NEWLINE} - ').join(errors)
                return f"Custom code snippets should have the format: {correct_code_snippets_type} {NEWLINE}{NEWLINE}But this code snippet was included: {code_snippet}"

        return ''


# Global variable used to cache the custom code snippets so that when users
# open the code snippets taskpane multiple times in the same mito instantiation, 
# we can display the custom code snippets without querying the url each time.
CACHED_CUSTOM_CODE_SNIPPETS = None

def show_custom_code_snippets() -> bool:
        # If code snippet environment variables are set, then use them to get the code snippets. 
        mito_config_code_snippets_version = os.environ.get(MITO_CONFIG_KEY_CODE_SNIPPETS_VERSION)
        mito_config_code_snippets_url = os.environ.get(MITO_CONFIG_KEY_CODE_SNIPPETS_URL)
        
        return mito_config_code_snippets_version == '1' and mito_config_code_snippets_url is not None

def get_custom_code_snippets() -> str:
        print(3)
        global CACHED_CUSTOM_CODE_SNIPPETS

        print(CACHED_CUSTOM_CODE_SNIPPETS)
        if CACHED_CUSTOM_CODE_SNIPPETS is not None:
                print(CACHED_CUSTOM_CODE_SNIPPETS)
                return json.dumps({
                        'status': 'success',
                        'code_snippets': CACHED_CUSTOM_CODE_SNIPPETS
                })

        print(4)

        # If we have not already loaded the custom code snippets, load them from the url and validate them.
        mito_config_code_snippets_url = os.environ.get(MITO_CONFIG_KEY_CODE_SNIPPETS_URL)

        print(5)
        
        # Request the code snippets from the url
        response = req.get(mito_config_code_snippets_url, verify=False)
        print(response)

        if response.status_code == 200:
                # Parse the respone body into JSON 
                code_snippets = DEFAULT_CODE_SNIPPETS #response.json()
                code_snippet_format_error = get_code_snippets_format_error(code_snippets)


                if code_snippet_format_error == '':
                        # Cache the code snippets so we don't need to request them from the url next time
                        CACHED_CUSTOM_CODE_SNIPPETS = code_snippets
                        return json.dumps({
                                'status': 'success',
                                'code_snippets': code_snippets
                        })
                else:
                        return json.dumps({
                                'status': 'error',
                                'error_message': code_snippet_format_error
                        })

        else:
                # Helpful info for debugging with the API is not threaded.
                return json.dumps({
                        'status': 'error',
                        'error_message': "Error accessing the code snippets data from the URL. Response status code:" , 
                })


def get_code_snippets(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
        print(1)

        if show_custom_code_snippets():
                print(2)
                return get_custom_code_snippets()
                
        # Otherwise, use the default code snippets. 
        print('return default')
        return json.dumps({
                'status': 'success',
                'code_snippets': DEFAULT_CODE_SNIPPETS
        })
