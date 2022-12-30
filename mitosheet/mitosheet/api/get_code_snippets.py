#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List
from mitosheet.enterprise.api.code_snippets_utils import create_error_return_obj, create_success_return_obj, get_custom_code_snippets
from mitosheet.telemetry.telemetry_utils import log
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
        mito_config = steps_manager.mito_config
        mito_config_code_snippets_version = mito_config.get_code_snippets_version()
        mito_config_code_snippets_url = mito_config.get_code_snippets_url()
        mito_config_code_snippets_support_email = mito_config.get_code_snippets_support_email()

        if mito_config_code_snippets_version == '1' and mito_config_code_snippets_url is not None:
                return get_custom_code_snippets(mito_config_code_snippets_url)

        # Give the user a helpful error message if they don't have the correct environment variables set. 
        if mito_config_code_snippets_version != '1' and mito_config_code_snippets_url is not None:
                log('get_code_snippet_error', {'get_code_snippet_error_reason': 'mito_config_code_snippet_version not set'})
                return create_error_return_obj(f"The code snippet environment variables are configured improperly. The MITO_CONFIG_CODE_SNIPPETS_URL environment variable is set, but the MITO_CONFIG_CODE_SNIPPETS_VERSION environment variable is not set to a valid version (ie: '1'). Reach out to support for help: {mito_config_code_snippets_support_email}")

        # Give the user a helpful error message if they don't have the correct environment variables set. 
        if mito_config_code_snippets_version == '1' and mito_config_code_snippets_url is None:
                log('get_code_snippet_error', {'get_code_snippet_error_reason': 'mito_config_code_snippets_url not set'})
                return create_error_return_obj(f"The code snippet environment variables are configured improperly. The MITO_CONFIG_CODE_SNIPPETS_VERSION environment variable is set, but the MITO_CONFIG_CODE_SNIPPETS_URL environment variable is not set. Reach out to support for help: {mito_config_code_snippets_support_email}")
   
        # Otherwise, use the default code snippets. 
        return create_success_return_obj(DEFAULT_CODE_SNIPPETS)

