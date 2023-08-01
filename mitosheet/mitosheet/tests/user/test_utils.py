#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the user utils, which determine the current
state of the user (e.g. should they upgrade).
"""
import os
from datetime import datetime, timedelta

import pytest

from mitosheet.user import (is_local_deployment,
                            is_on_kuberentes_mito, is_running_test)


def test_is_local():
    assert is_local_deployment()
    assert not is_on_kuberentes_mito()

def test_detects_tests():
    assert is_running_test()