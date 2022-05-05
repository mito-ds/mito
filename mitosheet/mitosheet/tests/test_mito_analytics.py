#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests to make sure that the mito analytics test is
performing correctly
"""

from mitosheet.telemetry.telemetry_utils import PRINT_LOGS


def test_not_printing_logs():
    assert PRINT_LOGS is False