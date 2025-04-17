#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the The Mito Enterprise license.

from mito_ai.utils.version_utils import is_enterprise
from mito_ai.constants import AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_VERSION, AZURE_OPENAI_MODEL

def is_azure_openai_configured() -> bool:
    """
    Azure OpenAI is only supported for Mito Enterprise users
    """
    is_enterprise_user = is_enterprise()
    return all([is_enterprise_user, AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_VERSION, AZURE_OPENAI_MODEL])