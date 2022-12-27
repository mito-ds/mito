#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of The Mito Enterprise license.

import json
from token import NEWLINE
from typing import Any, List, Optional
import requests
from mitosheet.transpiler.transpile_utils import NEWLINE_TAB
from mitosheet.types import CodeSnippet

# Global variable used to cache the custom code snippets so that when users
# open the code snippets taskpane multiple times in the same mito instantiation, 
# we can display the custom code snippets without querying the url each time.
CACHED_CUSTOM_CODE_SNIPPETS: Optional[List[CodeSnippet]] = None

# Helper functions for generating the proper return type
def create_error_return_obj(erorr_message: str) -> str:
    return json.dumps({
            'status': 'error',
            'error_message': erorr_message
    })
def create_success_return_obj(code_snippets: List[CodeSnippet]) -> str:
    return json.dumps({
            'status': 'success',
            'code_snippets': code_snippets 
    })

def get_code_snippets_format_error(code_snippets: Any) -> str:
    """
    Makes sure that the code snippets are properly formatted. Returns '' if they are properly formatted,
    and otherwise returns a helpful error message. 

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

def get_custom_code_snippets(mito_config_code_snippets_url: str) -> str:
    """
    Load the code snippets from the provided url and validate that they are in the correct format
    """

    # If there are cached custom code snippets, use them
    global CACHED_CUSTOM_CODE_SNIPPETS
    if CACHED_CUSTOM_CODE_SNIPPETS is not None:
        return create_success_return_obj(CACHED_CUSTOM_CODE_SNIPPETS)

    # Try to load code snippets from the URL
    try:
        response = requests.get(mito_config_code_snippets_url, verify=False)
    except Exception as e: 
        return create_error_return_obj(f"Error accessing the code snippets data from the URL. {e}" )

    if response.status_code != 200: 
        return create_error_return_obj(f"Error accessing the code snippets data from the URL. Response status code: {response.status_code}")

    # Parse the respone body into JSON 
    code_snippets = response.json()

    # Validate that the code snippets are properly formatted
    code_snippet_format_error = get_code_snippets_format_error(code_snippets)

    if code_snippet_format_error != '':
        return create_error_return_obj(code_snippet_format_error)
    
    # Cache the code snippets so we don't need to request them from the url next time
    CACHED_CUSTOM_CODE_SNIPPETS = code_snippets
    return create_success_return_obj(code_snippets)
        
