#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, List, Optional
from mitosheet.enterprise.mito_config import MITO_CONFIG_KEY_CODE_SNIPPETS, MITO_CONFIG_KEY_CODE_SNIPPETS_URL, MITO_CONFIG_KEY_CODE_SNIPPETS_VERSION
from mitosheet.types import CodeSnippet, StepsManagerType
import requests as req
from mitosheet.transpiler.transpile_utils import NEWLINE_TAB, NEWLINE

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
                return f"Custom code snippets has type {type(code_snippets)}, but should be have the format: {correct_code_snippets_type}"
        
        for code_snippet in code_snippets:
                if type(code_snippet) != dict:
                        return f"Custom code snippets should have the format: {correct_code_snippets_type} {NEWLINE}{NEWLINE}But this code snippet was included: {code_snippet}"


                id = code_snippet.get('Id', None)
                name = code_snippet.get('Name', None)
                description = code_snippet.get('Description', None)
                code = code_snippet.get('Code', None)

                error = False
                if id is None or type(id) != str:
                        error = True
                if name is None or type(name) != str:
                        error = True
                if description is None or type(name) != str:
                        error = True
                if code is None or type(code) != list:
                        error = True
                if not error:
                        for line in code:
                                if type(line) != str:
                                        error = True
                                        break

                if error:
                        return f"Custom code snippets should have the format: {correct_code_snippets_type} {NEWLINE}{NEWLINE}But this code snippet was included: {code_snippet}"

        return ''


# Global variable used to cache the custom code snippets so that when users
# open the code snippets taskpane multiple times in the same mito instantiation, 
# we can display the custom code snippets without querying the url each time.
CACHED_CUSTOM_CODE_SNIPPETS: Optional[List[CodeSnippet]] = None
def get_custom_code_snippets(mito_config_code_snippets_url: str) -> str:
        global CACHED_CUSTOM_CODE_SNIPPETS
        if CACHED_CUSTOM_CODE_SNIPPETS is not None:
                return json.dumps({
                        'status': 'success',
                        'code_snippets': CACHED_CUSTOM_CODE_SNIPPETS
                })
        
        # Request the code snippets from the url
        response = req.get(mito_config_code_snippets_url, verify=False)

        if response.status_code == 200:
                # Parse the respone body into JSON 
                code_snippets = response.json()
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
                return json.dumps({
                        'status': 'error',
                        'error_message': f"Error accessing the code snippets data from the URL. Response status code: {response.status_code}" , 
                })


def get_code_snippets(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
        mito_config_code_snippets = steps_manager.mito_config[MITO_CONFIG_KEY_CODE_SNIPPETS]
        mito_config_code_snippets_version = mito_config_code_snippets[MITO_CONFIG_KEY_CODE_SNIPPETS_VERSION]
        mito_config_code_snippets_url = mito_config_code_snippets[MITO_CONFIG_KEY_CODE_SNIPPETS_URL]

        if mito_config_code_snippets_version == '1' and mito_config_code_snippets_url is not None:
                return get_custom_code_snippets(mito_config_code_snippets_url)
                
        # Otherwise, use the default code snippets. 
        return json.dumps({
                'status': 'success',
                'code_snippets': DEFAULT_CODE_SNIPPETS
        })

