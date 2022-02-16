#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the sheet_function decorator.
"""
import pandas as pd
import numpy as np
import pytest

from mitosheet.errors import MitoError
from mitosheet.sheet_functions.types.decorators import handle_sheet_function_errors

def test_function_no_error():
    @handle_sheet_function_errors
    def function_no_error():
        return True

    assert function_no_error()

def test_function_catches_error():
    @handle_sheet_function_errors
    def function_error():
        raise Exception()

    with pytest.raises(MitoError):
        function_error()

