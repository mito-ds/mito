#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the The Mito Enterprise license.

from mito_ai.utils.version_utils import is_enterprise, is_mitosheet_private
from mito_ai.constants import (
    AZURE_OPENAI_API_KEY, 
    AZURE_OPENAI_ENDPOINT, 
    AZURE_OPENAI_API_VERSION, 
    AZURE_OPENAI_MODEL,
    ABACUS_BASE_URL,
    ABACUS_MODELS
)

def is_azure_openai_configured() -> bool:
    """
    Azure OpenAI is only supported for Mito Enterprise users
    """
    is_allowed_to_use_azure = is_enterprise() or is_mitosheet_private()
    return all([is_allowed_to_use_azure, AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_VERSION, AZURE_OPENAI_MODEL])

def is_abacus_configured() -> bool:
    """
    Abacus AI is only supported for Mito Enterprise users.
    Checks if Abacus AI is configured with base URL and models.
    """
    return all([is_enterprise(), ABACUS_BASE_URL, ABACUS_MODELS])