#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, List
from mitosheet.types import CodeSnippet, StepsManagerType
import os
import requests as req

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

def get_code_snippets(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
        # If code snippet environment variables are set, then use them to get the code snippets. 
        mito_config_code_snippets_version = os.environ.get(MITO_CONFIG_KEY_CODE_SNIPPETS_VERSION)
        mito_config_code_snippets_url = os.environ.get(MITO_CONFIG_KEY_CODE_SNIPPETS_URL)
        if mito_config_code_snippets_version == '1' and mito_config_code_snippets_url is not None:
                
                # Request the code snippets from the url
                response = req.get(mito_config_code_snippets_url, verify=False)

                if response.status_code == 200:
                        # Parse the respone body into JSON 
                        code_snippets = response.json()
                        return json.dumps(code_snippets)
                else:
                        # Helpful info for debugging with the API is not threaded.
                        print("Error accessing the code snippets data from the URL. Response status code: ", response.status_code)

        # Otherwise, use the default code snippets. 
        return json.dumps(DEFAULT_CODE_SNIPPETS)
