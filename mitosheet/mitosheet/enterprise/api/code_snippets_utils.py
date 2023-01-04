#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of The Mito Enterprise license.

import json
from typing import Any, List, Optional
import requests
from mitosheet.telemetry.telemetry_utils import log
from mitosheet.transpiler.transpile_utils import NEWLINE, NEWLINE_TAB
from mitosheet.types import CodeSnippet

# Global variable used to cache the custom code snippets so that when users
# open the code snippets taskpane multiple times in the same mito instantiation, 
# we can display the custom code snippets without querying the url each time.
cached_custom_code_snippets: Optional[List[CodeSnippet]] = None

# Helper functions for generating the proper return type
def create_error_return_obj(error_message: str) -> str:
    return json.dumps({
            'status': 'error',
            'error_message': error_message
    })
def create_success_return_obj(code_snippets: List[CodeSnippet]) -> str:
    return json.dumps({
            'status': 'success',
            'code_snippets': code_snippets 
    })

def get_code_snippets_format_error(code_snippets: Any) -> Optional[str]:
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
    correct_code_snippets_type = f"List[{{{NEWLINE_TAB}Id: str, {NEWLINE_TAB}Name: str, {NEWLINE_TAB}Description: str, {NEWLINE_TAB}Code: List[str]{NEWLINE}}}]"

    if not isinstance(code_snippets, list):
        return f"Custom code snippets has type {type(code_snippets)}, but should be have the format: {correct_code_snippets_type}"
    
    for code_snippet in code_snippets:
        if not isinstance(code_snippet, dict):
            return f"Custom code snippets should have the format: {correct_code_snippets_type} {NEWLINE}{NEWLINE}But this code snippet was included: {code_snippet}"

        id = code_snippet.get('Id', None)
        name = code_snippet.get('Name', None)
        description = code_snippet.get('Description', None)
        code = code_snippet.get('Code', None)

        error = False
        if id is None or not isinstance(id, str):
            error = True
        if name is None or not isinstance(name, str):
            error = True
        if description is None or not isinstance(description, str):
            error = True
        if code is None or not isinstance(code, list):
            error = True
        if not error:
            for line in code:
                if not isinstance(line, str):
                    error = True
                    break

        if error:
            return f"Custom code snippets should have the format: {correct_code_snippets_type} {NEWLINE}{NEWLINE}But this code snippet was included: {code_snippet}"

    return None

def get_custom_code_snippets(mito_config_code_snippets_url: str) -> str:
    """
    Load the code snippets from the provided url and validate that they are in the correct format
    """

    # If there are cached custom code snippets, use them
    global cached_custom_code_snippets
    if cached_custom_code_snippets is not None:
        return create_success_return_obj(cached_custom_code_snippets)

    # Try to load code snippets from the URL
    try:
        response = requests.get(mito_config_code_snippets_url, verify=False)
    except Exception as e:
        error_message = f"Error accessing the code snippets data from the URL. {e}" 
        log('get_code_snippet_error', {'get_code_snippet_error_reason': error_message})
        return create_error_return_obj(error_message)

    if response.status_code != 200: 
        error_message = f"Error accessing the code snippets data from the URL. Response status code: {response.status_code}"
        log('get_code_snippet_error', {'get_code_snippet_error_reason': error_message})
        return create_error_return_obj(error_message)

    # Parse the response body into JSON 
    code_snippets = response.json()

    # Validate that the code snippets are properly formatted
    code_snippet_format_error = get_code_snippets_format_error(code_snippets)

    if code_snippet_format_error is not None:
        # Note: We do not log the code_snippet_format_error because it contains user-defined code snippets
        log('get_code_snippet_error', {'get_code_snippet_error_reason': 'code_snippet_format_error'})
        return create_error_return_obj(code_snippet_format_error)
    
    # Cache the code snippets so we don't need to request them from the url next time
    cached_custom_code_snippets = code_snippets
    log('using_custom_code_snippets')
    return create_success_return_obj(code_snippets)
        
