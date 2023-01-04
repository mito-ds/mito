#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List
from mitosheet.enterprise.api.code_snippets_utils import create_success_return_obj, get_custom_code_snippets
from mitosheet.types import CodeSnippet, StepsManagerType

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
        code_snippets_envs = steps_manager.mito_config.get_code_snippets()

        if code_snippets_envs is None: 
                return create_success_return_obj(DEFAULT_CODE_SNIPPETS)

        mito_config_code_snippets_url = code_snippets_envs["MITO_CONFIG_CODE_SNIPPETS_URL"]

        return get_custom_code_snippets(mito_config_code_snippets_url)
        

